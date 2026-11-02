// Local date as YYYY-MM-DD (toISOString() gives the UTC date, which is
// wrong for users in India early in the morning)
export const todayISO = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

// "10:00:00" -> "10:00"
export const shortTime = (time) => (time ? String(time).slice(0, 5) : "");

// "2026-10-16" -> "16 Oct 2026"
export const formatDate = (date) => {
  if (!date) return "";
  const [year, month, day] = String(date).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
