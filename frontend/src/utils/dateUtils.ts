import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const IST_TIMEZONE = "Asia/Kolkata";

/**
 * Convert UTC date string → IST formatted string
 */
export const formatToIST = (
  utcDate: string | Date,
  pattern: string = "dd/MM/yyyy HH:mm"
) => {
  if (!utcDate) return "";

  const date = typeof utcDate === "string"
    ? new Date(utcDate)
    : utcDate;

  const istDate = toZonedTime(date, IST_TIMEZONE);
  return format(istDate, pattern);
};
