type AddressInput = { cep: string; rua: string; numero: string; complemento: string; bairro: string; cidade: string; estado: string };
export function validateSavedAddress(address: AddressInput): string | null {
  if (!/^\d{5}-?\d{3}$/.test(address.cep.trim())) return 'Informe um CEP válido com oito dígitos.';
  if (![address.rua, address.numero, address.bairro, address.cidade].every(value => value.trim().length > 0)) return 'Preencha rua, número, bairro e cidade.';
  if (!'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ').includes(address.estado.trim().toUpperCase())) return 'Informe uma UF válida.';
  if (Object.values(address).some(value => value.length > 250 || /[\u0000-\u001f\u007f]/.test(value))) return 'Revise o tamanho e os caracteres dos campos do endereço.';
  return null;
}
