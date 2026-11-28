// Browser-only capability kept in memory; no account/session data or localStorage.
export type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
let pending: InstallPrompt | null = null;
const listeners = new Set<() => void>();
export const getInstallPrompt = () => pending;
export const getServerInstallPrompt = () => null;
export function subscribeInstallPrompt(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function setInstallPrompt(value: InstallPrompt | null) { pending = value; listeners.forEach(listener => listener()); }
