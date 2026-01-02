import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const IST_TIMEZONE = "Asia/Kolkata";

/**
 * Convert UTC date string to IST and format
 */
export const formatToIST = (
  dateString: string,
  pattern: string
) => {
  const zonedDate = toZonedTime(dateString, IST_TIMEZONE);
  return format(zonedDate, pattern);
};
/**
 * Convert UTC date string to IST date & time
 * Used in tables & Excel export
 */
export const formatDateTimeIST = (dateString: string) => {
  return formatToIST(dateString, "dd/MM/yyyy hh:mm a");
};