const localUrl = 'http://localhost:3000';
export const GOOGLE_STORE_REVIEW_URL = 'https://g.page/r/CVsulQKezR0QEBM/review';

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  try {
    return new URL(configuredUrl || localUrl);
  } catch {
    return new URL(localUrl);
  }
}
