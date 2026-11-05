/**
 * Row -> domain mappers.
 *
 * Keeps every database detail (snake_case columns, joined tables, enum names)
 * out of the UI. The domain types in src/data/types.ts are unchanged, so the
 * existing screens keep working.
 */

import type {
  BodyStyle,
  CustomerProfile,
  FuelType,
  Inquiry,
  Payment,
  PaymentProvider,
  Reservation,
  Transmission,
  Vehicle,
  VehicleStatus,
} from "@/data/types";

export interface CarRow {
  id: string;
  slug: string;
  make: string;
  model: string;
  trim: string | null;
  year: number;
  price: number;
  currency: string;
  mileage: number;
  transmission: string;
  fuel_type: string;
  body_type: string;
  location: string;
  description: string | null;
  status: string;
  engine: string | null;
  horsepower: number | null;
  zero_to_sixty: number | null;
  drivetrain: string | null;
  exterior_color: string | null;
  interior_color: string | null;
  vin: string | null;
  featured: boolean;
  badge: string | null;
  highlights: string[] | null;
  created_at: string;
  seller_id: string | null;
  review_status: string;
  review_note: string | null;
  car_images?: { image_url: string; sort_order: number }[] | null;
}

export const CAR_SELECT =
  "id, slug, make, model, trim, year, price, currency, mileage, transmission, fuel_type, body_type, location, description, status, engine, horsepower, zero_to_sixty, drivetrain, exterior_color, interior_color, vin, featured, badge, highlights, created_at, seller_id, review_status, review_note, car_images ( image_url, sort_order )";

export function toVehicle(row: CarRow): Vehicle {
  const images = [...(row.car_images ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((image) => image.image_url);

  return {
    id: row.id,
    slug: row.slug,
    make: row.make,
    model: row.model,
    trim: row.trim ?? "",
    year: row.year,
    price: Number(row.price),
    mileage: row.mileage,
    bodyStyle: row.body_type as BodyStyle,
    fuel: row.fuel_type as FuelType,
    transmission: row.transmission as Transmission,
    engine: row.engine ?? "—",
    horsepower: row.horsepower ?? 0,
    zeroToSixty: row.zero_to_sixty ? Number(row.zero_to_sixty) : 0,
    drivetrain: row.drivetrain ?? "—",
    exteriorColor: row.exterior_color ?? "—",
    interiorColor: row.interior_color ?? "—",
    location: row.location,
    vin: row.vin ?? "—",
    status: row.status as VehicleStatus,
    featured: row.featured,
    badge: row.badge ?? undefined,
    description: row.description ?? "",
    highlights: row.highlights ?? [],
    images,
    createdAt: row.created_at,
    sellerId: row.seller_id,
    reviewStatus: row.review_status as Vehicle["reviewStatus"],
    reviewNote: row.review_note ?? undefined,
  };
}

interface CarLabel {
  year: number;
  make: string;
  model: string;
}

function label(car: CarLabel | null | undefined) {
  return car ? `${car.year} ${car.make} ${car.model}` : "Vehicle";
}

export interface InquiryRow {
  id: string;
  car_id: string | null;
  topic?: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  created_at: string;
  cars?: CarLabel | null;
}

export function toInquiry(row: InquiryRow): Inquiry {
  return {
    id: row.id,
    vehicleId: row.car_id ?? undefined,
    topic: row.topic ?? undefined,
    // Contact-page messages have no car; label them by what they are about.
    vehicleName: row.car_id
      ? label(row.cars)
      : row.topic
        ? `General enquiry — ${row.topic}`
        : "General enquiry",
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    message: row.message,
    status: row.status as Inquiry["status"],
    createdAt: row.created_at,
  };
}

export interface ReservationRow {
  id: string;
  user_id: string;
  car_id: string;
  amount: number;
  currency: string;
  status: string;
  pickup_date: string | null;
  created_at: string;
  cars?: CarLabel | null;
  profiles?: { full_name: string | null; email: string | null } | null;
}

export function toReservation(row: ReservationRow): Reservation {
  return {
    id: row.id,
    vehicleId: row.car_id,
    vehicleName: label(row.cars),
    customerName: row.profiles?.full_name ?? "Customer",
    email: row.profiles?.email ?? "",
    depositAmount: Number(row.amount),
    pickupDate: row.pickup_date ?? "",
    status: row.status as Reservation["status"],
    createdAt: row.created_at,
  };
}

const PROVIDER_LABELS: Record<PaymentProvider, string> = {
  mpesa: "M-Pesa",
  stripe: "Card",
  paypal: "PayPal",
  bank_transfer: "Bank transfer",
  financing: "Financing",
  manual: "Manual",
};

export interface PaymentRow {
  id: string;
  reservation_id: string;
  user_id: string;
  car_id: string;
  amount: number;
  currency: string;
  provider: string;
  provider_reference: string | null;
  status: string;
  created_at: string;
  cars?: CarLabel | null;
  profiles?: { full_name: string | null; email: string | null } | null;
}

export function toPayment(row: PaymentRow): Payment {
  const provider = row.provider as PaymentProvider;
  return {
    id: row.id,
    reference: row.provider_reference ?? row.id.slice(0, 8).toUpperCase(),
    reservationId: row.reservation_id,
    customerName: row.profiles?.full_name ?? "Customer",
    vehicleName: label(row.cars),
    amount: Number(row.amount),
    currency: row.currency,
    provider,
    method: PROVIDER_LABELS[provider] ?? provider,
    status: row.status as Payment["status"],
    createdAt: row.created_at,
  };
}

export interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  avatar_url: string | null;
  created_at: string;
}

export function toProfile(row: ProfileRow): CustomerProfile {
  return {
    id: row.id,
    fullName: row.full_name ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    city: "",
    country: "",
    memberSince: row.created_at,
    preferredContact: "Email",
    role: row.role,
    avatarUrl: row.avatar_url ?? undefined,
  };
}
