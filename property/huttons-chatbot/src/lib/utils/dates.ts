const SGT_OFFSET_HOURS = 8;

export function nowInSgt(): Date {
  const now = new Date();
  return new Date(now.getTime() + SGT_OFFSET_HOURS * 3600 * 1000);
}

export function formatSgtDateTime(d: Date = nowInSgt()): string {
  const date = d.toISOString().slice(0, 10);
  const time = d.toISOString().slice(11, 16);
  return `${date} ${time} SGT`;
}

export function todayInSgt(): string {
  return nowInSgt().toISOString().slice(0, 10);
}

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
