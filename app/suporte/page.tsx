'use client';

import Link from 'next/link';
import { JOIN_FAQS } from '@/lib/join';

import { useState, useMemo } from 'react';
import { Search, Truck, CreditCard, RefreshCcw, User, Users, HelpCircle, ChevronDown, MessageCircle, MapPin } from 'lucide-react';

// --- DADOS REAIS DA OPERAÇÃO OZONTECK RECIFE ---
// Ordem otimizada seguindo a jornada natural do cliente
const categorias = [
  { id: 'compras', titulo: 'Compras e Pagamentos', icone: CreditCard },
  { id: 'envios', titulo: 'Entregas e Retirada', icone: Truck },
  { id: 'devolucoes', titulo: 'Trocas e Devoluções', icone: RefreshCcw },
  { id: 'produtos', titulo: 'Produtos e Protocolos', icone: HelpCircle },
  { id: 'loja', titulo: 'Loja Física', icone: MapPin },
  { id: 'conta', titulo: 'Minha Conta', icone: User },
  { id: 'rede', titulo: 'Distribuidor independente e rede', icone: Users },
];

const perguntasFrequentes = [
  // --- COMPRAS E PAGAMENTOS ---
  {
    id: 1,
    categoria: 'compras',
    pergunta: 'Quais são as formas de pagamento aceitas?',
    resposta: 'O pagamento é processado pelo Mercado Pago. Confira as opções disponíveis na etapa de pagamento, que podem incluir Pix, boleto e cartão. As condições de parcelamento aparecem no formulário do cartão. A compra depende da confirmação do pagamento; gerar um Pix ou boleto não significa que o pedido foi pago.'
  },
  {
    id: 2,
    categoria: 'compras',
    pergunta: 'É seguro inserir os dados do meu cartão no site?',
    resposta: 'Em produção, o site utiliza HTTPS e o pagamento é processado pelo Mercado Pago. A Ozonteck não armazena os dados completos do seu cartão. Mesmo com esses controles, nenhum sistema pode prometer risco zero.'
  },
  {
    id: 3,
    categoria: 'compras',
    pergunta: 'Posso alterar os itens ou o endereço do meu pedido após a finalização?',
    resposta: 'Em Meus pedidos, abra o pagamento da compra. Quando disponíveis, os botões Alterar pagamento, Alterar endereço e Alterar dados permitem solicitar a reabertura. O sistema verifica se a cobrança ainda pode ser cancelada antes de liberar a edição e confere novamente preços e estoque. Não pague o código antigo. Se houver outros produtos no carrinho, resolva essa compra primeiro. Para pedidos já pagos ou alterações de itens, fale com o suporte pelo WhatsApp (+55 81 98147-2684).'
  },

  // --- ENTREGAS E RETIRADA ---
  {
    id: 4,
    categoria: 'envios',
    pergunta: 'Como funciona o processo de "Retirar na Loja"?',
    resposta: 'Selecione Retirar na loja na etapa de entrega. O endereço informado nessa modalidade é usado para o pagamento, não para entrega. Após a confirmação do pagamento, aguarde o contato da loja para combinar a retirada na Rua da União, 295 - Boa Vista, Recife. Confirme com a equipe antes de se deslocar.'
  },
  {
    id: 5,
    categoria: 'envios',
    pergunta: 'Qual é o prazo estimado e o valor do frete para a minha região?',
    resposta: 'A disponibilidade, o prazo e o valor da entrega precisam ser confirmados com a loja pelo WhatsApp (+55 81 98147-2684). O total apresentado no checkout corresponde aos produtos e não inclui frete. Confirme essas condições antes de pagar.'
  },

  // --- TROCAS E DEVOLUÇÕES ---
  {
    id: 6,
    categoria: 'devolucoes',
    pergunta: 'Direito de Arrependimento: Qual o prazo e as condições para devolver uma compra?',
    resposta: 'Nas compras pela internet, o art. 49 do Código de Defesa do Consumidor prevê sete dias para exercer o arrependimento, contados da assinatura ou do recebimento do produto, conforme o caso. Para solicitar, informe o número do pedido ao suporte pelo WhatsApp (+55 81 98147-2684). Guarde o comprovante da solicitação e peça as orientações de devolução.'
  },
  {
    id: 7,
    categoria: 'devolucoes',
    pergunta: 'Recebi um produto com defeito de fabricação. O que devo fazer?',
    resposta: 'Informe o pedido e descreva o problema ao suporte pelo WhatsApp (+55 81 98147-2684). Fotos podem ajudar na análise. Para vícios aparentes, o art. 26 do CDC prevê 30 dias para produtos não duráveis e 90 dias para duráveis, a partir da entrega. Em vícios ocultos, a contagem começa quando o defeito fica evidente.'
  },
  {
    id: 8,
    categoria: 'devolucoes',
    pergunta: 'Como funciona a Logística Reversa? Terei custos para devolver o produto?',
    resposta: 'Entre em contato com o suporte para combinar a devolução e receber as instruções de envio. No exercício do direito de arrependimento, a devolução ocorre sem ônus para o consumidor. A modalidade de coleta ou postagem deve ser confirmada com a equipe.'
  },
  {
    id: 9,
    categoria: 'devolucoes',
    pergunta: 'Quais são as etapas do Processo de Reembolso e o prazo para pagamento?',
    resposta: 'No arrependimento previsto no art. 49 do CDC, os valores pagos devem ser restituídos de imediato, com atualização monetária. O Decreto nº 7.962/2013 exige comunicação imediata à instituição financeira ou administradora do cartão para impedir a cobrança ou realizar o estorno. Peça ao suporte o comprovante e as informações para acompanhar a restituição.'
  },

  // --- PRODUTOS E PROTOCOLOS ---
  {
    id: 10,
    categoria: 'produtos',
    pergunta: 'Como posso ter certeza de qual é o protocolo ideal para o meu tratamento?',
    resposta: 'A linha Ozonteck foi desenvolvida com alta tecnologia em ozônio para entregar resultados reais em saúde e estética. Como cada organismo responde de forma diferente, oferecemos um serviço de Consultoria Especializada. Se você tem dúvidas sobre qual a dosagem ou o produto ideal para dores musculares, tratamentos capilares ou cuidados dermatológicos, entre em contato com nosso especialista Rogério André pelo WhatsApp (+55 81 98147-2684) para um atendimento personalizado antes de realizar sua compra.'
  },
  {
    id: 11,
    categoria: 'produtos',
    pergunta: 'Garantia de Autenticidade: Os produtos vendidos são originais?',
    resposta: 'Sim. Nós somos Distribuidores Oficiais e Autorizados do Grupo Ozonteck. Todos os produtos comercializados neste site e em nossa loja física são 100% originais, provenientes diretamente da fábrica, e enviados devidamente lacrados, garantindo a sua procedência, segurança e eficácia.'
  },

  // --- MINHA CONTA ---
  {
    id: 12,
    categoria: 'conta',
    pergunta: 'Como faço para rastrear meu pedido ou acompanhar o status da compra?',
    resposta: 'Acesse Minha conta e depois Meus pedidos para consultar suas compras e abrir os detalhes do pagamento. A página mostra o andamento registrado, como Preparando, Em rota e Entregue. Para combinar a retirada ou obter informações adicionais sobre a entrega, fale com a loja pelo WhatsApp (+55 81 98147-2684).'
  },

  // --- LOJA FÍSICA ---
  {
    id: 13,
    categoria: 'loja',
    pergunta: 'Qual o endereço e o horário de funcionamento da loja física Ozonteck Recife?',
    resposta: 'Nossa unidade física está de portas abertas para receber você na Rua da União, 295 - Boa Vista, Recife - PE (CEP: 50050-015). Para confirmar o nosso horário de funcionamento diário ou agendar uma consultoria presencial, por favor, envie uma mensagem para o nosso WhatsApp (+55 81 98147-2684).'
  },
  ...JOIN_FAQS,
];

export default function SuportePage() {
  const [busca, setBusca] = useState('');
  const [faqAberto, setFaqAberto] = useState<number | null>(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null);

  const perguntasFiltradas = useMemo(() => {
    return perguntasFrequentes.filter(faq => {
      const matchBusca = faq.pergunta.toLowerCase().includes(busca.toLowerCase()) || faq.resposta.toLowerCase().includes(busca.toLowerCase());
      const matchCategoria = categoriaSelecionada ? faq.categoria === categoriaSelecionada : true;

      if (busca.trim() !== '') {
        return matchBusca;
      }

      return matchBusca && matchCategoria;
    });
  }, [busca, categoriaSelecionada]);

  const toggleCategoria = (id: string) => {
    setCategoriaSelecionada(prev => prev === id ? null : id);
    setBusca('');
    setFaqAberto(null);
  };

  return (
    <main className="min-h-screen bg-[#FAFAFC] pb-20">

      <section className="bg-teal-600 pt-20 md:pt-28 pb-16 md:pb-20 px-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute top-10 -right-10 w-72 h-72 bg-cyan-200 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto relative z-10 text-center mt-8 md:mt-0">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-6 md:mb-8 tracking-tight">
            Oi, como podemos ajudar?
          </h1>

          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Digite sua dúvida (ex: prazo de entrega, devolução, pagamento...)"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setCategoriaSelecionada(null);
              }}
              className="w-full bg-white text-slate-800 rounded-full pl-6 pr-14 py-4 md:py-5 shadow-[0_10px_40px_rgba(0,0,0,0.1)] focus:outline-none focus:ring-4 focus:ring-teal-400/30 text-sm md:text-base transition-all"
            />
            <button className="absolute right-2 top-2 bottom-2 bg-teal-600 hover:bg-teal-700 text-white w-10 md:w-12 rounded-full flex items-center justify-center transition-colors shadow-sm">
              <Search size={20} />
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-5 -mt-8 relative z-20">

        {!busca && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-10 mb-8 md:mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg md:text-xl font-bold text-slate-800">Selecione um assunto</h2>
              {categoriaSelecionada && (
                <button
                  onClick={() => setCategoriaSelecionada(null)}
                  className="text-xs font-bold text-teal-600 hover:underline"
                >
                  Ver todas as dúvidas
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
              {categorias.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategoria(cat.id)}
                  className={`flex flex-col md:flex-row items-center gap-3 md:gap-4 p-4 md:p-5 rounded-xl border transition-all text-center md:text-left group cursor-pointer ${cat.id === 'rede' ? 'col-span-2 md:col-span-3' : ''} ${
                    categoriaSelecionada === cat.id
                      ? 'bg-teal-50 border-teal-400 ring-1 ring-teal-400 shadow-sm'
                      : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform ${
                    categoriaSelecionada === cat.id
                      ? 'bg-teal-600 text-white scale-110'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-teal-600 group-hover:shadow-sm group-hover:scale-110'
                  }`}>
                    <cat.icone size={20} strokeWidth={2.5} />
                  </div>
                  <span className={`text-xs md:text-sm font-bold transition-colors ${
                    categoriaSelecionada === cat.id ? 'text-teal-800' : 'text-slate-600 group-hover:text-slate-900'
                  }`}>
                    {cat.titulo}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-10">
          <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-6">
            {busca
              ? `Resultados para "${busca}"`
              : categoriaSelecionada
                ? `Dúvidas sobre ${categorias.find(c => c.id === categoriaSelecionada)?.titulo}`
                : 'Central de Políticas e Dúvidas Frequentes'
            }
          </h2>

          {perguntasFiltradas.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
              <Search size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium mb-1">Não encontramos nenhuma resposta exata.</p>
              <p className="text-xs text-slate-400 mb-4">Tente usar outras palavras ou fale com nosso suporte técnico.</p>
              <button
                onClick={() => { setBusca(''); setCategoriaSelecionada(null); }}
                className="text-teal-600 font-bold text-xs uppercase tracking-widest hover:bg-teal-50 px-4 py-2 rounded-full transition-colors"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {perguntasFiltradas.map((faq) => (
                <div key={faq.id} className={`border rounded-xl overflow-hidden transition-all duration-300 ${faqAberto === faq.id ? 'border-teal-200 bg-teal-50/30' : 'border-slate-100 bg-white'}`}>
                  <button
                    onClick={() => setFaqAberto(faqAberto === faq.id ? null : faq.id)}
                    aria-expanded={faqAberto === faq.id}
                    aria-controls={`faq-answer-${faq.id}`}
                    className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-slate-50"
                  >
                    <span className={`font-bold text-sm md:text-base pr-4 transition-colors ${faqAberto === faq.id ? 'text-teal-800' : 'text-slate-700'}`}>
                      {faq.pergunta}
                    </span>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${faqAberto === faq.id ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-400'}`}>
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-300 ${faqAberto === faq.id ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </button>

                  <div
                    id={`faq-answer-${faq.id}`}
                    aria-hidden={faqAberto !== faq.id}
                    className={`px-5 overflow-hidden transition-all duration-300 ease-in-out ${faqAberto === faq.id ? 'max-h-[800px] pb-5 opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    <p className="text-slate-600 text-sm leading-relaxed pt-2 whitespace-pre-wrap">
                      {faq.resposta}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {perguntasFiltradas.some(faq => faq.categoria === 'devolucoes') && <p className="mt-4 text-sm text-slate-600">Referências sobre direitos do consumidor: <a href="https://www2.camara.leg.br/legin/fed/lei/1990/lei-8078-11-setembro-1990-365086-normaatualizada-pl.html" target="_blank" rel="noopener noreferrer" className="underline">CDC, arts. 26 e 49</a> e <a href="https://www2.camara.leg.br/legin/fed/decret/2013/decreto-7962-15-marco-2013-775557-publicacaooriginal-139266-pe.html" target="_blank" rel="noopener noreferrer" className="underline">Decreto nº 7.962/2013, art. 5º</a>.</p>}

        <section aria-labelledby="support-join-title" className="mt-12 rounded-xl border border-teal-200 bg-teal-50 p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-800">Construa seu negócio com a OZONTECK</p>
          <h2 id="support-join-title" className="mt-3 text-xl font-bold text-slate-900">Quer entrar na rede de Rogério?</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">Entenda a atuação como distribuidor independente, tire suas dúvidas sobre vendas e desenvolvimento de rede e veja como iniciar seu cadastro com a indicação de Rogério André.</p>
          <Link href="/junte-se-a-nos" className="mt-4 inline-flex min-h-11 items-center rounded-md font-bold text-teal-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700">Conhecer a oportunidade e o cadastro</Link>
        </section>

        <div className="mt-12 text-center flex flex-col items-center">
          <p className="text-slate-500 text-sm mb-4 font-medium">Não encontrou o que procurava ou precisa de uma análise técnica?</p>
          <a
            href="https://wa.me/5581981472684"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white font-bold text-sm py-3.5 px-8 rounded-full transition-all shadow-[0_8px_25px_rgba(37,211,102,0.3)] hover:shadow-[0_8px_35px_rgba(37,211,102,0.4)] hover:-translate-y-1"
          >
            <MessageCircle size={20} />
            Entrar em contato via WhatsApp
          </a>
        </div>

      </div>
    </main>
  );
}
