import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight, MessageCircle, ShoppingBag, Users, ChartNoAxesCombined, ChevronDown } from 'lucide-react';
import { JOIN_REGISTRATION_URL, JOIN_CONTACT_URL, JOIN_FAQS } from '@/lib/join';

export const metadata: Metadata = {
  title: 'Junte-se a nós | Ozonteck Recife',
  description: 'Conheça a oportunidade de ser distribuidor independente OZONTECK na rede de Rogério André. Entenda a venda direta, a rede e os próximos passos para se cadastrar.',
};

const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-4';

export default function JoinPage() {
  return (
    <main className="bg-white px-5 pb-14 pt-6 sm:px-8 lg:px-12 lg:pb-20">
      <div className="mx-auto w-full max-w-[1536px]">
        <Link href="/" className={`mb-8 inline-flex min-h-11 items-center gap-2 rounded text-sm font-semibold text-teal-800 ${focus}`}>
          <ArrowLeft size={16} aria-hidden="true" /> Voltar à vitrine
        </Link>
        <div className="grid items-start gap-8 border-b border-slate-200 pb-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-14 lg:pb-14">
          <section aria-labelledby="join-title">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-teal-800">Junte-se a nós · Distribuidor independente</p>
            <h1 id="join-title" className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl xl:text-6xl">Construa seu negócio com a OZONTECK.<br /><span className="text-teal-800">Faça parte da rede de Rogério.</span></h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-700">Conheça a oportunidade de se tornar distribuidor independente e fazer parte da rede de Rogério André. Entenda a venda direta, as condições de participação e como realizar seu cadastro por indicação dele.</p>
            <p className="mt-4 max-w-2xl leading-relaxed text-slate-600">Entenda a atividade, converse sobre as condições de participação e dê seu próximo passo com o cadastro oficial vinculado à rede dele.</p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              <a href={JOIN_REGISTRATION_URL} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-teal-800 px-5 py-3 text-center font-bold text-white transition-colors hover:bg-teal-900 ${focus}`}>
                Quero ser distribuidor independente <ArrowUpRight size={20} className="shrink-0" aria-hidden="true" /><span className="sr-only"> (cadastro oficial em nova aba)</span>
              </a>
              <a href={JOIN_CONTACT_URL} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-11 items-center gap-2 rounded font-semibold text-teal-800 underline underline-offset-4 ${focus}`}>
                <MessageCircle size={18} className="shrink-0" aria-hidden="true" /> Conversar com Rogério<span className="sr-only"> (WhatsApp, nova aba)</span>
              </a>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">Cadastro no site oficial do Grupo Ozonteck, em nova aba.</p>
          </section>
          <aside aria-labelledby="join-start-title" className="rounded-xl border border-teal-100 bg-teal-50/60 p-6 text-left sm:p-8">
            <h2 id="join-start-title" className="text-xl font-bold text-slate-900">Da primeira conversa ao cadastro</h2>
            <ol className="mt-6 space-y-6">
              {[
                ['Conheça a atividade', 'Converse com Rogério sobre venda direta, produtos e desenvolvimento da rede.'],
                ['Entenda as condições', 'Esclareça custos, kit inicial, ativação e regras atuais de participação antes de aderir.'],
                ['Cadastre-se na rede', 'Use o link oficial desta página, que já leva a indicação de Rogério André.'],
              ].map(([title, text], index) => <li key={title} className="flex items-start gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-teal-200 bg-white text-sm font-bold text-teal-800" aria-hidden="true">{index + 1}</span>
                <div><h3 className="font-bold text-slate-900">{title}</h3><p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p></div>
              </li>)}
            </ol>
          </aside>
        </div>

        <section aria-labelledby="join-work-title" className="py-10 lg:py-14">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-800">Entenda a oportunidade</p>
          <h2 id="join-work-title" className="mt-3 text-2xl font-extrabold text-slate-900 sm:text-3xl">Como atua um distribuidor independente?</h2>
          <div className="mt-7 grid gap-6 md:grid-cols-3 md:gap-8">
            {[
              { icon: ShoppingBag, title: 'Venda direta de produtos', text: 'Apresente os produtos OZONTECK aos clientes e conheça a atividade de revenda nas linhas de cuidados pessoais, perfumaria e bem-estar.' },
              { icon: Users, title: 'Desenvolvimento de rede', text: 'Integre a rede de Rogério e conheça a formação de equipe por indicação de novos distribuidores independentes. O plano relaciona essa atividade às compras e recompras de produtos.' },
              { icon: ChartNoAxesCombined, title: 'Plano de carreira', text: 'Conheça as modalidades de remuneração, a pontuação e os critérios de qualificação. Avalie com Rogério as regras vigentes e as responsabilidades da participação.' },
            ].map(({icon: Icon,title,text}) => <div key={title} className="border-l-2 border-teal-200 pl-5">
              <Icon size={25} className="mb-4 text-teal-700" aria-hidden="true" />
              <h3 className="text-lg font-bold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
            </div>)}
          </div>
        </section>

        <div className="grid items-start gap-8 border-t border-slate-200 pt-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-14">
          <section aria-labelledby="join-questions-title">
            <h2 id="join-questions-title" className="text-2xl font-extrabold text-slate-900">Antes de entrar na rede</h2>
            <p className="mt-3 text-slate-600">Respostas para ajudar você a entender a atuação independente e o cadastro.</p>
            <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
              {JOIN_FAQS.filter(faq => [21,15,16,17,18,19].includes(faq.id)).map(faq => <details key={faq.id} className="group py-1">
                <summary className={`flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded py-4 text-left font-semibold text-slate-800 [&::-webkit-details-marker]:hidden ${focus}`}>
                  {faq.pergunta}<ChevronDown size={18} className="shrink-0 group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-slate-600">{faq.resposta}</p>
              </details>)}
            </div>
            <Link href="/suporte" className={`mt-4 inline-flex min-h-11 items-center gap-2 rounded font-semibold text-teal-800 underline underline-offset-4 ${focus}`}>Mais dúvidas sobre ser distribuidor <ArrowRight size={16} aria-hidden="true" /></Link>
          </section>
          <aside aria-labelledby="join-qr-title" className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-left sm:p-8">
            <h2 id="join-qr-title" className="text-xl font-bold text-slate-900">Seu próximo passo começa aqui</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">Entre no cadastro oficial com a indicação de Rogério. No celular, use o botão. No computador, você também pode escanear o QR Code.</p>
            <a href={JOIN_REGISTRATION_URL} target="_blank" rel="noopener noreferrer" className={`mt-5 inline-flex min-h-12 items-center gap-2 rounded-lg bg-teal-800 px-5 py-3 font-bold text-white transition-colors hover:bg-teal-900 ${focus}`}>Abrir cadastro oficial <ArrowUpRight size={18} className="shrink-0" aria-hidden="true" /><span className="sr-only"> (nova aba)</span></a>
            <Image src="/cadastro-ozonteck-qr.png" alt="QR Code para o cadastro OZONTECK na rede de Rogério. Use também o botão Abrir cadastro oficial." width={270} height={270} unoptimized className="mt-6 h-auto w-full max-w-[216px]" />
            <p className="mt-3 break-all text-xs text-slate-600">office.grupoozonteck.com</p>
          </aside>
        </div>
      </div>
    </main>
  );
}
