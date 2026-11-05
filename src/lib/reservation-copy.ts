import type { ReservationStatus } from "@/data/types";

export function reservationMessage(status: ReservationStatus, brandName: string): string {
  switch (status) {
    case "pending":
      return `We have your request. ${brandName} will contact you to confirm it.`;
    case "confirmed":
      return "Your reservation is confirmed and the car is being held for you.";
    case "completed":
      return "This reservation is complete. Thank you for choosing us.";
    case "cancelled":
      return "This reservation was cancelled and the car is no longer held for you.";
  }
}
