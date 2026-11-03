'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  ArrowUp,
  Camera,
  CreditCard,
  Handshake,
  Heart,
  Lock,
  MapPin,
  MessageCircle,
  Music2,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Users,
} from 'lucide-react';

const WHATSAPP_URL = 'https://wa.me/5581981472684';
const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/rogerioandreozonteck/',
    icon: Camera,
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/share/1HfPtPLK5s/',
    icon: Users,
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@rogerioandredelima',
    icon: Music2,
  },
] as const;

function PaymentMethods() {
  return <div>
    <div className="grid max-w-64 grid-cols-3 gap-2" aria-label="Formas de pagamento">
      {[
        ['visa.png', 'Visa'], ['master.png', 'Mastercard'], ['elo.png', 'Elo'],
        ['amex.svg', 'American Express'], ['boleto.gif', 'Boleto'], ['pix.gif', 'Pix'],
      ].map(([file, name]) => <span key={name} title={name} className="flex h-12 items-center justify-center rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
        <Image src={'/payments/' + file} alt={name} width={60} height={30} unoptimized className="h-7 w-14 object-contain" />
      </span>)}
    </div>
    <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-600"><Handshake size={16} className="text-sky-600" aria-hidden="true" />Processado pelo Mercado Pago</p>
    <p className="mt-2 text-xs leading-relaxed text-slate-500">Parcelas e disponibilidade do cartão são informadas no pagamento.</p>
  </div>;
}

function SocialLinks() {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Redes sociais de Rogério André">
      {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir ${label} de Rogério André em nova aba`}
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
        >
          <Icon size={16} className="text-teal-600" aria-hidden="true" />
          {label}
        </a>
      ))}
    </div>
  );
}

function CompactFooter({ checkout }: { checkout: boolean }) {
  return (
    <footer className="relative z-10 border-t border-slate-200 bg-white" data-footer-variant="compact">
      <div className="flex w-full flex-col gap-4 px-5 pb-24 pt-7 text-left sm:px-8 md:flex-row md:items-center md:justify-between md:py-7 lg:px-12 xl:px-16 2xl:px-20">
        <div>
          <p className="text-sm font-bold text-slate-800">
            {checkout ? 'Pagamento processado pelo Mercado Pago' : 'Ozonteck Recife'}
          </p>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
            {checkout
              ? 'Os dados completos do cartão não são armazenados pela Ozonteck.'
              : 'Atendimento especializado e suporte para sua experiência de compra.'}
          </p>
          <p className="mt-2 text-xs text-slate-600">CNPJ: 42.648.567/0001-19</p>
        </div>

        <nav aria-label="Links auxiliares" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-xs font-bold text-slate-600 md:justify-end">
          <Link href="/" className="transition-colors hover:text-teal-700">Catálogo</Link>
          <Link href="/suporte" className="transition-colors hover:text-teal-700">Central de ajuda</Link>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-teal-700 transition-colors hover:text-teal-900">
            <MessageCircle size={15} aria-hidden="true" /> WhatsApp
          </a>
        </nav>
      </div>
    </footer>
  );
}

function FullFooter() {
  return (
    <footer className="relative z-10 mt-auto w-full border-t-4 border-teal-800 bg-[#eef4f3] [&_a]:rounded-sm [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-teal-700" data-footer-variant="full">
      <div className="mx-auto w-full max-w-[1536px] px-5 sm:px-8 lg:px-12">
        <section aria-label="Vantagens da compra" className="grid grid-cols-1 gap-7 border-b border-slate-100 py-10 md:grid-cols-3 md:gap-0 md:divide-x md:divide-slate-100">
          <div className="flex items-start gap-4 md:pr-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700">
              <CreditCard size={24} strokeWidth={1.7} aria-hidden="true" />
            </div>
            <div>
              <h2 className="mb-1.5 text-base font-bold text-slate-900">Escolha como pagar</h2>
              <p className="text-sm leading-relaxed text-slate-500">Pix, boleto e cartões. Confira as opções de parcelamento ao pagar.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 md:px-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700">
              <Truck size={24} strokeWidth={1.7} aria-hidden="true" />
            </div>
            <div>
              <h2 className="mb-1.5 text-base font-bold text-slate-900">Envio ou retirada</h2>
              <p className="text-sm leading-relaxed text-slate-500">Receba o pedido ou combine a retirada com nosso especialista na Boa Vista.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 md:pl-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700">
              <ShoppingBag size={24} strokeWidth={1.7} aria-hidden="true" />
            </div>
            <div>
              <h2 className="mb-1.5 text-base font-bold text-slate-900">Compra com orientação</h2>
              <p className="text-sm leading-relaxed text-slate-500">Conte com atendimento humano antes e depois da sua compra.</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-slate-200 py-10 sm:grid-cols-2 xl:grid-cols-[1fr_1.3fr_1.1fr_1.1fr] xl:gap-x-10">
          <nav aria-labelledby="footer-navigation-title">
            <h2 id="footer-navigation-title" className="mb-5 text-xs font-bold uppercase text-slate-900">Ozonteck Recife</h2>
            <ul className="space-y-3 text-sm text-slate-600">
              <li><Link href="/#catalogo" className="transition-colors hover:text-teal-700">Catálogo de produtos</Link></li>
              <li><Link href="/#loja-fisica" className="transition-colors hover:text-teal-700">Nossa loja física</Link></li>
              <li><Link href="/sobre_cliente" className="transition-colors hover:text-teal-700">Conheça o consultor</Link></li>
              <li><Link href="/suporte" className="transition-colors hover:text-teal-700">Central de ajuda</Link></li>
            </ul>
            <div className="mt-7 border-t border-slate-200 pt-5">
              <h3 className="text-sm font-bold text-slate-900">Faça parte da equipe OZONTECK</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">Conheça a equipe de Rogério André para comprar para consumo ou atuar como distribuidor. O benefício de preço na loja depende de aprovação manual.</p>
              <Link href="/junte-se-a-nos" className="mt-2 inline-flex min-h-11 items-center font-bold text-sm text-teal-800 underline underline-offset-4">Quero conhecer a rede</Link>
            </div>
          </nav>

          <section aria-labelledby="footer-contact-title">
            <h2 id="footer-contact-title" className="mb-5 text-xs font-bold uppercase text-slate-900">Atendimento</h2>
            <address className="space-y-3 text-sm not-italic text-slate-600">
              <p>Rogério André, consultor autorizado</p>
              <a href="tel:+5581981472684" className="flex items-center gap-2 transition-colors hover:text-teal-700">
                <Phone size={14} className="text-teal-600" aria-hidden="true" /> (81) 98147-2684
              </a>
              <p className="flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 shrink-0 text-teal-600" aria-hidden="true" />
                <span>R. da União, 295 - Boa Vista<br />Recife - PE, 50050-015</span>
              </p>
            </address>
            <div className="mt-6">
              <h3 className="mb-3 text-[11px] font-bold uppercase text-slate-900">Redes sociais</h3>
              <SocialLinks />
            </div>
          </section>

          <section aria-labelledby="footer-payment-title">
            <h2 id="footer-payment-title" className="mb-5 text-xs font-bold uppercase text-slate-900">Formas de pagamento</h2>
            <PaymentMethods />
          </section>

          <section aria-labelledby="footer-security-title">
            <h2 id="footer-security-title" className="mb-5 text-xs font-bold uppercase text-slate-900">Segurança</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <Lock size={20} className="shrink-0 text-emerald-600" aria-hidden="true" />
                <div>
                  <p className="text-[11px] font-bold uppercase text-slate-800">Acesso controlado</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">Autenticação e permissões por perfil</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <ShieldCheck size={20} className="shrink-0 text-emerald-600" aria-hidden="true" />
                <div>
                  <p className="text-[11px] font-bold uppercase text-slate-800">Pagamento terceirizado</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">Processado pelo Mercado Pago</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col items-start justify-between gap-6 pb-24 pt-7 md:flex-row md:items-center md:py-7">
          <div className="text-left">
            <p className="mb-1 text-xs font-bold text-slate-900">Ozonteck Produtos de Alta Performance</p>
            <p className="text-xs leading-relaxed text-slate-600">Distribuidor autorizado: Rogério André © {new Date().getFullYear()} - Todos os direitos reservados.</p>
            <p className="mt-2 text-xs text-slate-600">CNPJ: 42.648.567/0001-19</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">Preços e condições de pagamento exclusivos para compras pela internet.</p>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-4 md:items-end">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="group inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-bold text-slate-600 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
            >
              <ArrowUp size={14} className="transition-transform group-hover:-translate-y-0.5" aria-hidden="true" />
              Voltar ao topo
            </button>
            <p className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
              Desenvolvido com <Heart size={12} className="fill-teal-500 text-teal-500" aria-hidden="true" /> por
              <span className="font-bold text-slate-700">Lucas André</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Footer() {
  const pathname = usePathname();

  if (pathname === '/login' || pathname.startsWith('/admin')) return null;
  if (pathname === '/lista') return <CompactFooter checkout />;
  if (pathname.startsWith('/conta')) return <CompactFooter checkout={false} />;

  return <FullFooter />;
}
