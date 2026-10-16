export type OrderContactAddress = {
  nome?: string; telefone?: string; rua?: string; numero?: string;
  complemento?: string; bairro?: string; cidade?: string; estado?: string; cep?: string;
  modalidade?: 'entrega' | 'retirada';
};

export function orderContactLink(id: string, address: OrderContactAddress | null) {
  let phone = (address?.telefone || '').replace(/\D/g, '');
  if (phone.length === 10 || phone.length === 11) phone = `55${phone}`;
  if (!/^55\d{10,11}$/.test(phone)) return null;
  const message = `Olá${address?.nome ? `, ${address.nome}` : ''}! Aqui é Rogério, da Ozonteck. Sobre seu pedido nº ${id}: vamos combinar ${address?.modalidade === 'retirada' ? 'a retirada na loja' : 'a entrega'}?`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function orderAddressText(address: OrderContactAddress | null) {
  if (address?.modalidade === 'retirada') return 'Retirada na loja';
  return [address?.rua, address?.numero, address?.complemento, address?.bairro,
    address?.cidade, address?.estado, address?.cep].filter(Boolean).join(', ');
}
