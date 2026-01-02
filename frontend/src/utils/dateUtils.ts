export function formatDateTimeIST(dateString: string) {
  const date = new Date(dateString.endsWith("Z") ? dateString : dateString + "Z");

  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
