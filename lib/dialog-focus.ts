/** Keep Tab inside the current modal while leaving normal field navigation alone. */
export function keepDialogFocus(event: { key: string; shiftKey: boolean; preventDefault(): void }, dialog: HTMLDialogElement) {
  if (event.key !== 'Tab') return;
  const fields = Array.from(dialog.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )).filter(element => element.tabIndex >= 0 && element.getClientRects().length > 0);
  const first = fields[0], last = fields.at(-1);
  if (!first || !last) { event.preventDefault(); dialog.focus(); return; }
  const active = dialog.ownerDocument.activeElement;
  if (event.shiftKey && (active === first || active === dialog)) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && (active === last || active === dialog)) { event.preventDefault(); first.focus(); }
}
