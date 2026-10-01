import { MapPin, Store } from 'lucide-react';

export default function PickupPoint() {
  return <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
    <Store className="mb-4 text-teal-700" size={24} aria-hidden="true" />
    <h2 className="text-base font-bold text-slate-900">Retirada na unidade Recife</h2>
    <p className="mt-2 text-sm leading-relaxed text-slate-600">Prefere buscar seu pedido? Combine a disponibilidade e o horário com Rogério antes de ir à unidade.</p>
    <address className="my-4 text-sm not-italic text-slate-700">Rua da União, 295 — Boa Vista<br />Recife — PE, 50050-015</address>
    <div className="flex flex-col gap-3">
      <a className="rounded-lg bg-teal-700 px-4 py-3 text-center text-sm font-bold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700" href={`https://wa.me/5581981472684?text=${encodeURIComponent('Olá, Rogério! Quero combinar a retirada de um pedido na unidade Recife. Pode me orientar sobre disponibilidade e horário?')}`} target="_blank" rel="noopener noreferrer">Combinar retirada pelo WhatsApp</a>
      <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-teal-700 focus-visible:outline-2 focus-visible:outline-teal-700" href="https://www.google.com/maps/search/?api=1&query=Rua%20da%20Uni%C3%A3o%20295%20Boa%20Vista%20Recife%20PE" target="_blank" rel="noopener noreferrer"><MapPin size={16} /> Ver localização no mapa</a>
    </div>
    <p className="mt-3 text-xs leading-relaxed text-slate-500">A retirada é combinada com o atendimento. Este contato não altera automaticamente a entrega de um pedido já feito.</p>
  </section>;
}
