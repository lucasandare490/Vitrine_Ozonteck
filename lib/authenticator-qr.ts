// Supabase returns an SVG data URL with raw XML, including a trailing newline.
// Encode only the payload so Next/Image accepts it and '#' cannot truncate it.
export function encodeAuthenticatorQr(qr: string) {
  const prefix = 'data:image/svg+xml;utf-8,';
  if (!qr.startsWith(prefix)) throw new Error('Formato de QR Code inesperado.');
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr.slice(prefix.length))}`;
}
