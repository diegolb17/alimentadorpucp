import { FeedingRecord } from "@/types/feeding";

export function generateHistoryTxt(username: string, records: FeedingRecord[]): string {
  const lines: string[] = [];
  lines.push("=== HISTORIAL DE ALIMENTACION ===");
  lines.push(`Usuario: ${username}`);
  lines.push("".padEnd(31, "="));

  // Group by date
  const grouped = records.reduce<Record<string, FeedingRecord[]>>((acc, r) => {
    const d = r.timestamp.slice(0, 10);
    if (!acc[d]) acc[d] = [];
    acc[d].push(r);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  for (const date of sortedDates) {
    lines.push(date);
    const dayRecords = grouped[date].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    for (const record of dayRecords) {
      const time = new Date(record.timestamp).toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const humidifyStr = record.humidify ? "Humedecido" : "Normal";
      const sourceStr = record.source === "manual" ? "Manual" : "Programado";
      lines.push(`  ${time} | ${String(record.grams).padEnd(2)}g | ${humidifyStr.padEnd(10)} | ${sourceStr}`);
    }
    lines.push("".padEnd(31, "-"));
  }

  return lines.join("\n");
}
