/** Local guidance only. Never use the estimate to accept/reject credentials. */
function hasRepeatedBlock(value: string) {
  for (let size = 1; size <= value.length / 2; size++) {
    if (value.length % size === 0 && value === value.slice(0, size).repeat(value.length / size)) return true;
  }
  return false;
}

export function estimatePasswordStrength(password: string): { level: 1 | 2 | 3 | 4; label: string } | null {
  if (!password) return null;
  // Bound work; never log, transmit or persist this value.
  const sample = [...password.slice(0, 256)];
  const plain = sample.join('').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
  const compact = plain.replace(/[^\p{L}\p{N}]/gu, '');
  const common = /^(?:senha|password|passw0rd|qwerty|admin|administrador|welcome|bemvindo|1234567890|123456789|12345678|123456|letmein|abc123|iloveyou)[\d\W_]*$/u.test(plain);
  const repeated = hasRepeatedBlock(plain) || new Set(sample).size <= 4;
  const sequential = compact.length >= 4 && ['01234567890', '1234567890', 'abcdefghijklmnopqrstuvwxyz', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'].some(sequence => sequence.includes(compact) || [...sequence].reverse().join('').includes(compact));
  let level = sample.length < 8 ? 1 : sample.length < 12 ? 2 : sample.length < 20 ? 3 : 4;
  if (common || repeated || sequential) level = 1;
  else if (/^\d+$/u.test(plain)) level = Math.min(level, 2);
  const bounded = level as 1 | 2 | 3 | 4;
  return { level: bounded, label: ['Fraca', 'Razoável', 'Boa', 'Forte'][bounded - 1] };
}
