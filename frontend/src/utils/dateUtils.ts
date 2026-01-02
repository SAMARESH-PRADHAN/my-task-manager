import { format } from "date-fns";

/**
 * Format date exactly as stored in DB (DB already IST)
 */
export const formatDateTime = (dateString: string) => {
  return format(new Date(dateString), "dd/MM/yyyy hh:mm a");
};
