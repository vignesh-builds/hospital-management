// Rupee amount: 1234.5 -> "₹1,234.50"
export const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// "2026-11-02T14:30:00" -> "02 Nov 2026, 02:30 pm"
export const formatDateTime = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Calendar days since admission, minimum 1 (same rule the server bills with)
export const stayDays = (admittedAtIso) => {
  if (!admittedAtIso) return 1;
  const start = new Date(admittedAtIso);
  if (Number.isNaN(start.getTime())) return 1;
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((today - startDay) / 86400000);
  return Math.max(1, days);
};
