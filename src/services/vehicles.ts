/**
 * Vehicle (cars + car_images) data access.
 * Public reads go through the browser client; only admins can write, enforced
 * by row level security in the database.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Vehicle, VehicleDraft, VehicleFilters } from "@/data/types";

import { CAR_SELECT, toVehicle, type CarRow } from "./mappers";
import { removeUnreferencedVehicleImages } from "./vehicle-images";

function fail(context: string, error: { message: string } | null): never {
  throw new Error(`${context}: ${error?.message ?? "unknown database error"}`);
}

export async function listVehicles(filters: VehicleFilters = {}): Promise<Vehicle[]> {
  const {
    query = "",
    bodyStyle = "all",
    fuel = "all",
    transmission = "all",
    minPrice,
    maxPrice,
    sort = "newest",
  } = filters;

  let request = supabase.from("cars").select(CAR_SELECT);

  if (bodyStyle !== "all") request = request.eq("body_type", bodyStyle);
  if (fuel !== "all") request = request.eq("fuel_type", fuel);
  if (transmission !== "all") request = request.eq("transmission", transmission);
  if (typeof minPrice === "number") request = request.gte("price", minPrice);
  if (typeof maxPrice === "number") request = request.lte("price", maxPrice);

  const needle = query.trim();
  if (needle) {
    const like = `%${needle}%`;
    request = request.or(
      `make.ilike.${like},model.ilike.${like},trim.ilike.${like},body_type.ilike.${like},engine.ilike.${like}`,
    );
  }

  switch (sort) {
    case "price-asc":
      request = request.order("price", { ascending: true });
      break;
    case "price-desc":
      request = request.order("price", { ascending: false });
      break;
    case "mileage-asc":
      request = request.order("mileage", { ascending: true });
      break;
    default:
      request = request.order("created_at", { ascending: false });
  }

  const { data, error } = await request;
  if (error) fail("Could not load vehicles", error);
  return ((data ?? []) as unknown as CarRow[]).map(toVehicle);
}

export async function listFeaturedVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from("cars")
    .select(CAR_SELECT)
    .eq("featured", true)
    .order("created_at", { ascending: false })
    .limit(3);
  if (error) fail("Could not load featured vehicles", error);
  return ((data ?? []) as unknown as CarRow[]).map(toVehicle);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getVehicle(vehicleId: string): Promise<Vehicle | null> {
  const column = UUID_RE.test(vehicleId) ? "id" : "slug";
  const { data, error } = await supabase
    .from("cars")
    .select(CAR_SELECT)
    .eq(column, vehicleId)
    .maybeSingle();
  if (error) fail("Could not load this vehicle", error);
  return data ? toVehicle(data as unknown as CarRow) : null;
}

export async function getVehiclesByIds(ids: string[]): Promise<Vehicle[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("cars").select(CAR_SELECT).in("id", ids);
  if (error) fail("Could not load vehicles", error);
  return ((data ?? []) as unknown as CarRow[]).map(toVehicle);
}

function slugify(draft: { make: string; model: string; year: number }) {
  return `${draft.make}-${draft.model}-${draft.year}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toCarColumns(draft: Partial<Vehicle>) {
  const columns: Record<string, unknown> = {};
  if (draft.make !== undefined) columns["make"] = draft.make;
  if (draft.model !== undefined) columns["model"] = draft.model;
  if (draft.trim !== undefined) columns["trim"] = draft.trim;
  if (draft.year !== undefined) columns["year"] = draft.year;
  if (draft.price !== undefined) columns["price"] = draft.price;
  if (draft.mileage !== undefined) columns["mileage"] = draft.mileage;
  if (draft.transmission !== undefined) columns["transmission"] = draft.transmission;
  if (draft.fuel !== undefined) columns["fuel_type"] = draft.fuel;
  if (draft.bodyStyle !== undefined) columns["body_type"] = draft.bodyStyle;
  if (draft.location !== undefined) columns["location"] = draft.location;
  if (draft.description !== undefined) columns["description"] = draft.description;
  if (draft.status !== undefined) columns["status"] = draft.status;
  if (draft.engine !== undefined) columns["engine"] = draft.engine;
  if (draft.horsepower !== undefined) columns["horsepower"] = draft.horsepower;
  if (draft.zeroToSixty !== undefined) columns["zero_to_sixty"] = draft.zeroToSixty;
  if (draft.drivetrain !== undefined) columns["drivetrain"] = draft.drivetrain;
  if (draft.exteriorColor !== undefined) columns["exterior_color"] = draft.exteriorColor;
  if (draft.interiorColor !== undefined) columns["interior_color"] = draft.interiorColor;
  if (draft.vin !== undefined) columns["vin"] = draft.vin || null;
  if (draft.featured !== undefined) columns["featured"] = draft.featured;
  if (draft.badge !== undefined) columns["badge"] = draft.badge || null;
  if (draft.highlights !== undefined) columns["highlights"] = draft.highlights;
  if (draft.sellerId !== undefined) columns["seller_id"] = draft.sellerId;
  if (draft.reviewStatus !== undefined) columns["review_status"] = draft.reviewStatus;
  if (draft.reviewNote !== undefined) columns["review_note"] = draft.reviewNote || null;
  return columns;
}

const MIN_VEHICLE_IMAGES = 3;

/** Public URLs of a car's current photos (empty if they can't be read — cleanup is then skipped). */
async function currentImageUrls(carId: string): Promise<string[]> {
  const { data } = await supabase.from("car_images").select("image_url").eq("car_id", carId);
  return ((data ?? []) as { image_url: string }[]).map((row) => row.image_url);
}

async function replaceImages(carId: string, images: string[]) {
  const previous = await currentImageUrls(carId);
  const { error: deleteError } = await supabase.from("car_images").delete().eq("car_id", carId);
  if (deleteError) fail("Could not update vehicle photos", deleteError);
  if (images.length > 0) {
    const { error } = await supabase
      .from("car_images")
      .insert(images.map((image_url, sort_order) => ({ car_id: carId, image_url, sort_order })));
    if (error) fail("Could not save vehicle photos", error);
  }
  // Only after the new rows are saved: remove files that were replaced or dropped.
  await removeUnreferencedVehicleImages(previous.filter((url) => !images.includes(url)));
}

export async function createVehicle(draft: VehicleDraft): Promise<Vehicle> {
  const images = draft.images ?? [];
  if (images.length < MIN_VEHICLE_IMAGES) {
    throw new Error(
      `A listing needs at least ${MIN_VEHICLE_IMAGES} photos (${images.length} given).`,
    );
  }

  const { data, error } = await supabase
    .from("cars")
    .insert({ ...toCarColumns(draft as Partial<Vehicle>), slug: slugify(draft) } as never)
    .select("id")
    .single();
  if (error) fail("Could not create the listing", error);

  await replaceImages((data as { id: string }).id, images);
  const created = await getVehicle((data as { id: string }).id);
  if (!created) throw new Error("Listing was created but could not be read back");
  return created;
}

/**
 * Submission path for ordinary users via "Sell your car". Always forces
 * seller_id to the current user and review_status to "pending" — the RLS
 * policy "Sellers submit cars" enforces the same thing server-side, so this
 * can't be spoofed even if someone bypasses this function.
 */
export async function createSellerListing(
  draft: Omit<VehicleDraft, "sellerId" | "reviewStatus" | "reviewNote" | "featured" | "status">,
): Promise<Vehicle> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error("Please sign in to submit a car for sale.");

  return createVehicle({
    ...draft,
    status: "available",
    featured: false,
    sellerId: auth.user.id,
    reviewStatus: "pending",
  });
}

/** A seller's own submissions, at any review status, newest first. */
export async function listMySubmittedVehicles(): Promise<Vehicle[]> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error("Please sign in to view your submissions.");

  const { data, error } = await supabase
    .from("cars")
    .select(CAR_SELECT)
    .eq("seller_id", auth.user.id)
    .order("created_at", { ascending: false });
  if (error) fail("Could not load your submissions", error);
  return ((data ?? []) as unknown as CarRow[]).map(toVehicle);
}

export async function updateVehicle(
  vehicleId: string,
  patch: Partial<Vehicle>,
): Promise<Vehicle | null> {
  if (patch.images && patch.images.length < MIN_VEHICLE_IMAGES) {
    throw new Error(
      `A listing needs at least ${MIN_VEHICLE_IMAGES} photos (${patch.images.length} given).`,
    );
  }

  const { error } = await supabase
    .from("cars")
    .update(toCarColumns(patch) as never)
    .eq("id", vehicleId);
  if (error) fail("Could not update the listing", error);
  if (patch.images) await replaceImages(vehicleId, patch.images);
  return getVehicle(vehicleId);
}

export async function deleteVehicle(vehicleId: string): Promise<void> {
  const imageUrls = await currentImageUrls(vehicleId);
  const { error } = await supabase.from("cars").delete().eq("id", vehicleId);
  if (error) fail("Could not delete the listing", error);
  await removeUnreferencedVehicleImages(imageUrls);
}
