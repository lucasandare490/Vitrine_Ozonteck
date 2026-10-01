export type PerfumeryVolume = 'all' | '17' | '100';

// Presentations confirmed in the official catalog screenshots supplied by the owner.
const volumes: Record<string, Exclude<PerfumeryVolume, 'all'>> = Object.fromEntries([
  ...['CAPA', 'CIND', 'DG', 'GREC', 'FERA', 'MAXIMUM', 'PRESIDENTE',
    'SENTIMENTO', 'VIP-GIRL', 'SOBERANO', 'VG', 'SPEED', '303-VIP',
    'MAX-B', '303-M', 'ALEM', 'FANT', 'VENUM', 'VIDA', 'SEDUC',
    'GOUF-B', '303-W', 'ANGE', 'BLUE', 'FAMMA', 'EASY', 'GOUF-T',
    'MAD', 'SCAN', 'DOCU', 'AVEN', 'SOUL', 'SUPREMO', 'AALI',
    'SUBLI', 'RHINO', 'OUD', 'LABOOM'].map(code => [`PERF-${code}`, '17' as const]),
  ...['OUD', 'AALIYAH', 'RHINO', 'SUBLIME', 'SCAN', 'VIDA', 'SOB',
    'SENT', 'PRES', 'MAXBOSS', 'VG', 'CIND', 'MADAME', 'SPEED']
    .map(code => [`P100-${code}`, '100' as const]),
]);

export function matchesPerfumeryVolume(code: string, volume: PerfumeryVolume): boolean {
  return volume === 'all' || volumes[code] === volume;
}
