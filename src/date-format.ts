const DEFAULT_TIME_ZONE = 'America/Chicago';

function displayTimeZone(): string {
  return process.env.DISPLAY_TIME_ZONE || DEFAULT_TIME_ZONE;
}

export function formatActivityDate(isoDate: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: displayTimeZone(),
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  }).format(new Date(isoDate));
}

export function formatActivityDateTime(isoDate: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: displayTimeZone(),
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(new Date(isoDate));
}
