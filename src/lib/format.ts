export function formatPrice(value: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMileage(value: number) {
  return `${new Intl.NumberFormat("en-US").format(value)} mi`;
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function vehicleName(vehicle: { year: number; make: string; model: string }) {
  return `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
}

export function monthlyPayment(price: number, months = 60, downPct = 0.1, apr = 0.079) {
  const principal = price * (1 - downPct);
  const r = apr / 12;
  const payment = (principal * r) / (1 - Math.pow(1 + r, -months));
  return Math.round(payment);
}
