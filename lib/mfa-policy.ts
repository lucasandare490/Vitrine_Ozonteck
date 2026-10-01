// The caller must authenticate the token before passing its assurance level here.
export function requiresSecondFactor(
  factors: readonly { status: string }[] | undefined,
  assuranceLevel: unknown,
) {
  return Boolean(factors?.some(factor => factor.status === 'verified')) && assuranceLevel !== 'aal2';
}
