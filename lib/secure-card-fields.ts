export type SecureField = {
  mount(container: string): void;
  unmount(): void;
  on(event: string, callback: (payload: { bin?: string; errorMessages?: unknown[] }) => void): void;
  update(properties: object): void;
};

export function mountCardFields(
  fields: { create(type: string, options: object): SecureField },
  prefix: string,
  events: { ready(field: string): void; valid(field: string, valid: boolean): void; bin(value: string): void; cvvFocus(focused: boolean): void; error(): void },
) {
  const instances: Record<string, SecureField> = {};
  let active = true;
  try {
    for (const [name, label, placeholder] of [
      ['cardNumber', 'Número do cartão', 'Número do cartão'],
      ['expirationDate', 'Validade do cartão', 'MM/AA'],
      ['securityCode', 'Código de segurança (CVV)', 'CVV'],
    ]) {
      const field = fields.create(name, { placeholder, srLabel: label, ariaRequired: true, style: { height: '24px', fontSize: '16px', color: '#0f172a', fontFamily: 'Arial, sans-serif' } });
      instances[name] = field;
      field.on('ready', () => { if (active) events.ready(name); });
      field.on('validityChange', event => { if (active) events.valid(name, Array.isArray(event.errorMessages) && event.errorMessages.length === 0); });
      field.on('error', () => { if (active) events.error(); });
      if (name === 'cardNumber') field.on('binChange', event => { if (active) events.bin(typeof event.bin === 'string' && /^\d{6,8}$/.test(event.bin) ? event.bin : ''); });
      if (name === 'securityCode') {
        field.on('focus', () => { if (active) events.cvvFocus(true); });
        field.on('blur', () => { if (active) events.cvvFocus(false); });
      }
      field.mount(`${prefix}-${name}`);
    }
  } catch (error) {
    active = false;
    Object.values(instances).forEach(field => { try { field.unmount(); } catch { /* Remaining fields still need cleanup. */ } });
    throw error;
  }
  return {
    configure(settings?: { card_number?: { length?: number; validation?: string }; security_code?: { length?: number; mode?: string } }) {
      if (!active) return;
      const number = settings?.card_number;
      const cvv = settings?.security_code;
      if (number && Number.isInteger(number.length) && number.length! >= 12 && number.length! <= 19) {
        instances.cardNumber.update({ settings: { length: number.length, validation: number.validation === 'none' ? 'none' : 'standard' } });
      }
      if (cvv && [3, 4].includes(cvv.length!)) {
        instances.securityCode.update({ settings: { length: cvv.length, mode: 'mandatory' } });
      }
    },
    unmount() {
      active = false;
      Object.values(instances).forEach(field => { try { field.unmount(); } catch { /* Best-effort cleanup of every provider field. */ } });
    },
  };
}
