/**
 * Data access facade.
 *
 * Every screen still imports from here, but the implementations now live in
 * src/services/* and talk to the database. Function names and shapes are
 * unchanged, so the UI is untouched.
 */

import { supabase } from "@/integrations/supabase/client";

import type { Vehicle, VehicleFilters } from "./types";

export {
  createVehicle,
  deleteVehicle,
  getVehicle,
  getVehiclesByIds,
  listFeaturedVehicles,
  listVehicles,
  updateVehicle,
} from "@/services/vehicles";

export {
  createContactMessage,
  createInquiry,
  listInquiries,
  listMyInquiries,
  updateInquiryStatus,
  type InquiryInput,
} from "@/services/inquiries";

export {
  cancelMyReservation,
  listMyReservations,
  listReservations,
  updateReservationStatus,
} from "@/services/reservations";

export { listPayments, listReservationPayments } from "@/services/payments";

export { updatePaymentStatus } from "@/lib/payments.functions";

export { getProfile, updateProfile, isAdmin } from "@/services/profiles";

export {
  addFavorite,
  listFavoriteCarIds,
  mergeLocalFavorites,
  readLocalFavorites as readFavorites,
  removeFavorite,
  writeLocalFavorites as writeFavorites,
} from "@/services/favorites";

/* ------------------------------- reservations ------------------------------ */

export interface ReservationInput {
  vehicleId: string;
  vehicleName?: string;
  customerName: string;
  email: string;
  depositAmount: number;
  pickupDate: string;
}

/**
 * Creates a reservation plus its opening (pending) payment record through a
 * server function, so payment status never originates in the browser.
 */
export async function createReservation(input: ReservationInput) {
  const { createReservationWithPayment } = await import("@/lib/payments.functions");
  const { data: session } = await supabase.auth.getUser();
  if (!session.user) {
    throw new Error("Please sign in to reserve this car.");
  }

  return createReservationWithPayment({
    data: {
      carId: input.vehicleId,
      amount: input.depositAmount,
      currency: "KES",
      pickupDate: input.pickupDate,
      provider: "manual",
    },
  });
}

/* --------------------------- client-side filtering -------------------------- */

/** Kept for components that filter an already-loaded list in memory. */
export function filterVehicles(list: Vehicle[], filters: VehicleFilters = {}) {
  const {
    query = "",
    bodyStyle = "all",
    fuel = "all",
    transmission = "all",
    minPrice,
    maxPrice,
    sort = "newest",
  } = filters;

  const needle = query.trim().toLowerCase();

  const result = list.filter((v) => {
    const haystack =
      `${v.year} ${v.make} ${v.model} ${v.trim} ${v.bodyStyle} ${v.engine}`.toLowerCase();
    if (needle && !haystack.includes(needle)) return false;
    if (bodyStyle !== "all" && v.bodyStyle !== bodyStyle) return false;
    if (fuel !== "all" && v.fuel !== fuel) return false;
    if (transmission !== "all" && v.transmission !== transmission) return false;
    if (typeof minPrice === "number" && v.price < minPrice) return false;
    if (typeof maxPrice === "number" && v.price > maxPrice) return false;
    return true;
  });

  switch (sort) {
    case "price-asc":
      return result.sort((a, b) => a.price - b.price);
    case "price-desc":
      return result.sort((a, b) => b.price - a.price);
    case "mileage-asc":
      return result.sort((a, b) => a.mileage - b.mileage);
    default:
      return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

/* ------------------------------ admin metrics ------------------------------ */

export interface AdminMetrics {
  liveListings: number;
  reservedCount: number;
  openInquiries: number;
  depositsCollected: number;
  inventoryValue: number;
  averagePrice: number;
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const [cars, inquiries, payments] = await Promise.all([
    supabase.from("cars").select("price, status"),
    supabase.from("inquiries").select("status"),
    supabase.from("payments").select("amount, status"),
  ]);

  if (cars.error) throw new Error(`Could not load inventory metrics: ${cars.error.message}`);

  const rows = cars.data ?? [];
  const inventoryValue = rows.reduce((sum, row) => sum + Number(row.price), 0);

  return {
    liveListings: rows.filter((row) => row.status === "available").length,
    reservedCount: rows.filter((row) => row.status === "reserved").length,
    openInquiries: (inquiries.data ?? []).filter(
      (row) => row.status === "new" || row.status === "in-progress",
    ).length,
    depositsCollected: (payments.data ?? [])
      .filter((row) => row.status === "successful")
      .reduce((sum, row) => sum + Number(row.amount), 0),
    inventoryValue,
    averagePrice: rows.length ? Math.round(inventoryValue / rows.length) : 0,
  };
}
