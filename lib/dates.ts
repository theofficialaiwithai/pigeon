/**
 * Convert a YYYY-MM-DD date string + day offset into a UTC Date representing
 * 07:00 in the given IANA timezone. Handles DST correctly via the Intl API.
 */
export function toSendAt(
  dateStr: string,
  daysOffset: number,
  timezone: string
): Date {
  const [y, m, d] = dateStr.split("-").map(Number);

  // Add offset in UTC milliseconds to avoid DST boundary issues in date math
  const baseMs = Date.UTC(y, m - 1, d) + daysOffset * 86_400_000;
  const target = new Date(baseMs);
  const ty = target.getUTCFullYear();
  const tm = target.getUTCMonth();
  const td = target.getUTCDate();

  // Sample the timezone offset at noon UTC on the target day (stays in-day for all TZs)
  const noon = new Date(Date.UTC(ty, tm, td, 12, 0, 0));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "longOffset",
  }).formatToParts(noon);

  const tzStr =
    parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+00:00";
  // e.g. "GMT-04:00", "GMT+05:30", "GMT+00:00"

  const match = tzStr.match(/GMT([+-])(\d{2}):(\d{2})/);
  let offsetMinutes = 0;
  if (match) {
    const sign = match[1] === "+" ? 1 : -1;
    offsetMinutes = sign * (parseInt(match[2]) * 60 + parseInt(match[3]));
  }

  // UTC = local - offset  →  07:00 local = (7*60 - offsetMinutes) UTC minutes past midnight
  const totalUtcMinutes = 7 * 60 - offsetMinutes;
  const utcH = Math.floor(totalUtcMinutes / 60);
  const utcM = totalUtcMinutes % 60;

  return new Date(Date.UTC(ty, tm, td, utcH, utcM, 0));
}

export function formatSendDate(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}
