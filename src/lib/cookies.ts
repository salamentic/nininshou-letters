const MAX_AGE = 365 * 86400; // 1 year

export function getCookie(name: string): string | null {
  const match = document.cookie.split(';').find(c => c.trim().startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1].trim()) : null;
}

export function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${MAX_AGE}`;
}
