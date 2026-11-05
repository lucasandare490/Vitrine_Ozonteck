import Image from 'next/image';
import { Barcode, Handshake } from 'lucide-react';

const brands = [
  { name: 'Visa', file: 'visa.png', width: 64, height: 48, display: 'w-16' },
  { name: 'Mastercard', file: 'master-oficial.svg', width: 48, height: 32, display: 'w-12' },
  { name: 'Elo', file: 'elo-oficial.png', width: 328, height: 168, display: 'w-20' },
  { name: 'American Express', file: 'amex.svg', width: 48, height: 48, display: 'w-9' },
  { name: 'Boleto', file: null, width: 0, height: 0, display: '' },
  { name: 'Pix', file: 'pix-oficial.png', width: 540, height: 190, display: 'w-20' },
] as const;

export default function PaymentBrands() {
  return <div>
    <ul className="grid max-w-sm grid-cols-3 gap-2.5" aria-label="Bandeiras e formas de pagamento">
      {brands.map(brand => <li key={brand.name} className="flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-3">
        <span className="flex h-10 w-full items-center justify-center" aria-hidden="true">
          {brand.file ? <Image src={`/payments/${brand.file}`} alt="" width={brand.width} height={brand.height} unoptimized className={`${brand.display} max-h-10 object-contain`} /> : <Barcode size={39} strokeWidth={1.6} className="text-slate-800" />}
        </span>
        <span className="text-center text-[10px] font-semibold leading-4 text-slate-600">{brand.name}</span>
      </li>)}
    </ul>
    <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-600"><Handshake size={17} className="shrink-0 text-teal-700" aria-hidden="true" />Processado pelo Mercado Pago</p>
    <p className="mt-2 text-xs leading-relaxed text-slate-500">As opções disponíveis, o tipo do cartão e as parcelas são confirmados na etapa de pagamento. A aprovação depende do Mercado Pago e do banco emissor.</p>
  </div>;
}
