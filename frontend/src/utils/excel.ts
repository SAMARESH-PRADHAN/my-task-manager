import * as XLSX from "xlsx-js-style";

// Column category colors (header bg, even row bg, odd row bg, text color)
const COLUMN_THEMES: Record<string, { header: string; even: string; odd: string; text: string }> = {
  // Customer info — teal
  "Customer Name": { header: "0E6655", even: "D1F2EB", odd: "E8F8F5", text: "0B5345" },
  Phone:           { header: "0E6655", even: "D1F2EB", odd: "E8F8F5", text: "0B5345" },
  Email:           { header: "0E6655", even: "D1F2EB", odd: "E8F8F5", text: "0B5345" },

  // Service info — indigo
  "Service Type":   { header: "1A237E", even: "E8EAF6", odd: "F3F4FC", text: "1A237E" },
  Board:            { header: "1A237E", even: "E8EAF6", odd: "F3F4FC", text: "1A237E" },
  "Application ID": { header: "1A237E", even: "E8EAF6", odd: "F3F4FC", text: "1A237E" },
  Password:         { header: "4A235A", even: "F5EEF8", odd: "FAF5FF", text: "4A235A" },

  // People — orange
  "Assigned To":  { header: "784212", even: "FDEBD0", odd: "FEF5E7", text: "784212" },
  Employee:       { header: "784212", even: "FDEBD0", odd: "FEF5E7", text: "784212" },
  "Completed By": { header: "784212", even: "FDEBD0", odd: "FEF5E7", text: "784212" },

  // Money — green
  "Total Amount": { header: "145A32", even: "D5F5E3", odd: "EAFAF1", text: "145A32" },
  Deduction:      { header: "7B241C", even: "FADBD8", odd: "FDEDEC", text: "7B241C" },
  Revenue:        { header: "1D6A39", even: "A9DFBF", odd: "D5F5E3", text: "145A32" },
  "Payment Mode": { header: "145A32", even: "D5F5E3", odd: "EAFAF1", text: "145A32" },

  // Status — handled separately with value-based colors
  "Work Status":    { header: "1F618D", even: "D6EAF8", odd: "EBF5FB", text: "1F618D" },
  "Payment Status": { header: "1F618D", even: "D6EAF8", odd: "EBF5FB", text: "1F618D" },

  // Meta — gray-blue
  Description: { header: "2C3E50", even: "EBEDEF", odd: "F2F3F4", text: "2C3E50" },
  Date:        { header: "2C3E50", even: "EBEDEF", odd: "F2F3F4", text: "2C3E50" },
};

const DEFAULT_THEME = { header: "2C3E50", even: "F2F3F4", odd: "FFFFFF", text: "2C3E50" };

const border = (color = "CCCCCC") => ({
  top: { style: "thin", color: { rgb: color } },
  bottom: { style: "thin", color: { rgb: color } },
  left: { style: "thin", color: { rgb: color } },
  right: { style: "thin", color: { rgb: color } },
});

const getStatusValueStyle = (header: string, value: any, isEven: boolean, theme: typeof DEFAULT_THEME) => {
  if (header === "Work Status" || header === "Payment Status") {
    const v = String(value ?? "").toLowerCase();
    if (v === "completed") return {
      font: { bold: true, sz: 10, name: "Arial", color: { rgb: "0B5345" } },
      fill: { fgColor: { rgb: "A9DFBF" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: border("A9DFBF"),
    };
    if (v === "pending" || v === "unpaid") return {
      font: { bold: true, sz: 10, name: "Arial", color: { rgb: "784212" } },
      fill: { fgColor: { rgb: "FAD7A0" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: border("FAD7A0"),
    };
  }
  return null;
};

export const downloadExcel = (data: any[], filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const wsData: any[][] = [];

  // Serial No theme
  const serialTheme = { header: "424949", even: "EAECEE", odd: "F2F3F4", text: "424949" };

  // Header row
  wsData.push(
    ["Serial No", ...headers.filter(h => h !== "Serial No")].map((h) => {
      const theme = h === "Serial No" ? serialTheme : (COLUMN_THEMES[h] ?? DEFAULT_THEME);
      return {
        v: h,
        t: "s",
        s: {
          font: { bold: true, sz: 11, name: "Arial", color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: theme.header } },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          border: border("FFFFFF"),
        },
      };
    })
  );

  const orderedHeaders = ["Serial No", ...headers.filter(h => h !== "Serial No")];

  // Data rows
  data.forEach((row, rowIdx) => {
    const isEven = rowIdx % 2 === 0;
    wsData.push(
      orderedHeaders.map((header) => {
        const value = row[header] ?? "";
        const theme = header === "Serial No" ? serialTheme : (COLUMN_THEMES[header] ?? DEFAULT_THEME);
        const statusStyle = getStatusValueStyle(header, value, isEven, theme);

        const baseStyle = statusStyle ?? {
          font: { sz: 10, name: "Arial", color: { rgb: theme.text } },
          fill: { fgColor: { rgb: isEven ? theme.even : theme.odd } },
          alignment: {
            horizontal: typeof value === "number" || header === "Serial No" ? "center" : "left",
            vertical: "center",
          },
          border: border(isEven ? theme.even : "DDDDDD"),
        };

        const isNum = typeof value === "number" ||
          (typeof value === "string" && value !== "" && !isNaN(Number(value)));

        return { v: value, t: isNum ? "n" : "s", s: baseStyle };
      })
    );
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws["!cols"] = orderedHeaders.map((header) => {
    const maxLen = Math.max(
      header.length,
      ...data.map((row) => String(row[header] ?? "").length)
    );
    return { wch: Math.min(Math.max(maxLen + 3, 10), 45) };
  });

  // Row heights
  ws["!rows"] = [{ hpt: 35 }, ...data.map(() => ({ hpt: 22 }))];

  // Freeze top row
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tasks");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};