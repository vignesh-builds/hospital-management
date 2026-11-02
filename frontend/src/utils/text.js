// Initials for avatar circles. Safe for null / undefined / empty names.
export const initials = (name) =>
  String(name || "")
    .replace(/^dr\.?\s+/i, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "?";
