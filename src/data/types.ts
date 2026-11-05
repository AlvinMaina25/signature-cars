/**
 * Domain types for the marketplace.
 * These mirror what the database returns, mapped in src/services/mappers.ts so
 * the UI never deals with raw table columns.
 */

export type BodyStyle = "Coupe" | "Sedan" | "SUV" | "Convertible" | "Grand Tourer";
export type FuelType = "Petrol" | "Hybrid" | "Electric";
export type Transmission = "Automatic" | "Manual";
export type VehicleStatus = "available" | "reserved" | "sold";
export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Vehicle {
  id: string;
  slug: string;
  make: string;
  model: string;
  trim: string;
  year: number;
  price: number;
  mileage: number;
  bodyStyle: BodyStyle;
  fuel: FuelType;
  transmission: Transmission;
  engine: string;
  horsepower: number;
  zeroToSixty: number;
  drivetrain: string;
  exteriorColor: string;
  interiorColor: string;
  location: string;
  vin: string;
  status: VehicleStatus;
  featured: boolean;
  badge?: string | undefined;
  description: string;
  highlights: string[];
  images: string[];
  createdAt: string;
  /** Set when submitted by an ordinary user via "Sell your car"; null/undefined for admin-created listings. */
  sellerId?: string | null;
  /** Moderation state. Only "approved" listings are publicly visible. */
  reviewStatus: ReviewStatus;
  /** Optional note from an admin, shown to the seller when a submission is rejected. */
  reviewNote?: string | null | undefined;
}

export interface VehicleFilters {
  query?: string;
  bodyStyle?: BodyStyle | "all";
  fuel?: FuelType | "all";
  transmission?: Transmission | "all";
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price-asc" | "price-desc" | "mileage-asc";
}

export type InquiryStatus = "new" | "in-progress" | "answered" | "closed";

export interface Inquiry {
  id: string;
  /** Absent for general messages sent from the Contact page. */
  vehicleId?: string | undefined;
  topic?: string | undefined;
  vehicleName: string;
  name: string;
  email: string;
  phone?: string | undefined;
  message: string;
  status: InquiryStatus;
  createdAt: string;
}

export type ReservationStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface Reservation {
  id: string;
  vehicleId: string;
  vehicleName: string;
  customerName: string;
  email: string;
  depositAmount: number;
  pickupDate: string;
  status: ReservationStatus;
  createdAt: string;
}

/** Database payment lifecycle. Written only by trusted server-side code. */
export type PaymentStatus =
  "pending" | "processing" | "successful" | "failed" | "cancelled" | "refunded";

/** Payment rails the data model is ready for. */
export type PaymentProvider =
  "mpesa" | "stripe" | "paypal" | "bank_transfer" | "financing" | "manual";

export interface Payment {
  id: string;
  reference: string;
  reservationId: string;
  customerName: string;
  vehicleName: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  /** Human label for the provider, e.g. "M-Pesa", "Card". */
  method: string;
  status: PaymentStatus;
  createdAt: string;
}

export interface CustomerProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  memberSince: string;
  preferredContact: "Email" | "Phone" | "WhatsApp";
  role?: string | undefined;
  avatarUrl?: string | undefined;
}

export type VehicleDraft = Omit<
  Vehicle,
  "id" | "slug" | "createdAt" | "images" | "highlights" | "reviewStatus" | "sellerId" | "reviewNote"
> & {
  images?: string[];
  highlights?: string[];
  reviewStatus?: ReviewStatus;
  sellerId?: string | null;
  reviewNote?: string | null;
};
