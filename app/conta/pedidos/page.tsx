'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Package, ShoppingBag, Truck, CheckCircle2, Clock, MessageCircle, XCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

type TabStatus = 'Todos' | 'A Pagar' | 'Preparando' | 'A Caminho' | 'Finalizado';

// Fundo padronizado mantido
const OzoneBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden bg-[#FAFAFC] pointer-events-none">
    <div className="absolute top-[5%] left-[-10%] sm:left-[5%] opacity-40">
      <div className="relative flex items-center justify-center scale-100 sm:scale-110">
        <div className="w-64 h-64 bg-teal-300/60 rounded-full blur-[80px] absolute -left-20"></div>
      </div>
    </div>
    <div className="absolute top-[60%] right-[-10%] sm:right-[10%] opacity-30">
      <div className="relative flex items-center justify-center scale-100 sm:scale-110">
        <div className="w-80 h-80 bg-teal-300/60 rounded-full blur-[100px] absolute -right-20"></div>
      </div>
    </div>
  </div>
);

export default function PedidosPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabStatus>('Todos');
  const [orderToCancelId, setOrderToCancelId] = useState<string>('');

  const tabs: TabStatus[] = ['Todos', 'A Pagar', 'Preparando', 'A Caminho', 'Finalizado'];

  // LISTA DE PEDIDOS SIMULADA (Para mostrar como funciona com vários)
  const mockOrders = [
    {
      id: 'OZK-98234-71',
      date: '28 de Agosto de 2026',
      total: 'R$ 349,90',
      status: 'A Caminho',
      items: [
        { name: 'Óleo Ozonizado Girassol 30ml', qtd: 2 },
        { name: 'Sérum Facial Anti-aging', qtd: 1 }
      ]
    },
    {
      id: 'OZK-11223-88',
      date: '15 de Agosto de 2026',
      total: 'R$ 159,90',
      status: 'Preparando',
      items: [
        { name: 'Sabonete Líquido de Ozônio', qtd: 3 }
      ]
    },
    {
      id: 'OZK-55412-12',
      date: '02 de Julho de 2026',
      total: 'R$ 89,90',
      status: 'Finalizado',
      items: [
        { name: 'Creme Hidratante Corporal', qtd: 1 }
      ]
    }
  ];

  // FILTRO DAS ABAS
  const filteredOrders = activeTab === 'Todos' 
    ? mockOrders 
    : mockOrders.filter(order => order.status === activeTab);

  // LÓGICA DA MENSAGEM DINÂMICA DO WHATSAPP
  const selectedOrder = mockOrders.find(o => o.id === orderToCancelId);
  
  let whatsappLink = "https://wa.me/5581900000000?text=Ol%C3%A1!%20Gostaria%20de%20ajuda%20com%20meus%20pedidos.";
  
  if (selectedOrder) {
    const itemsText = selectedOrder.items.map(i => `${i.qtd}x ${i.name}`).join(', ');
    const text = `Olá, equipe Ozonteck! Gostaria de solicitar o cancelamento de um pedido.\n\n*📦 Pedido:* ${selectedOrder.id}\n*💰 Valor:* ${selectedOrder.total}\n*🛒 Itens:* ${itemsText}\n\nPodem me ajudar com este cancelamento?`;
    whatsappLink = `https://wa.me/5581900000000?text=${encodeURIComponent(text)}`;
  }

  const handleCancelClick = (e: React.MouseEvent) => {
    if (!orderToCancelId) {
      e.preventDefault();
      toast.error('Selecione um pedido na lista para cancelar.');
    } else {
      // Opcional: Se quiser que a seleção limpe após clicar, descomente a linha abaixo
      // setOrderToCancelId('');
    }
  };

  return (
    <main className="min-h-screen text-slate-900 relative overflow-hidden flex flex-col">
      <OzoneBackground />

      <section className="max-w-[1800px] w-full mx-auto px-5 sm:px-10 lg:px-16 pt-8 sm:pt-10 pb-24 relative z-10">
        
        {/* CABEÇALHO */}
        <div className="mb-8 pb-5 border-b border-slate-200/60">
          <Link href="/conta" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-teal-600 mb-5 transition-colors uppercase tracking-widest">
            <ArrowLeft size={12} /> Voltar para o Painel
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Package className="text-teal-600 w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.5} />
            Meus Pedidos
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">
            Acompanhe o status, rastreie entregas e veja seu histórico completo.
          </p>
        </div>

        {/* GRID DE DASHBOARD (12 COLUNAS) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* =========================================
              COLUNA ESQUERDA - CONTEXTO E SUPORTE
          ========================================= */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6">
            
            {/* Suporte Ativo */}
            <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm border border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-5">
                <MessageCircle size={20} strokeWidth={2} />
              </div>
              <h3 className="text-lg font-bold mb-2 tracking-tight">Dúvidas com a Entrega?</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                Caso o seu pedido esteja com atraso ou o status não tenha atualizado, fale direto com nossa central.
              </p>
              <a 
                href="https://wa.me/5581900000000" 
                target="_blank"
                className="w-full bg-white hover:bg-teal-50 text-slate-900 text-sm font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                Chamar no WhatsApp
              </a>
            </div>

            {/* AÇÃO MANUAL: Cancelamento com Seletor de Pedido */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center mb-4 border border-red-100">
                <XCircle size={20} strokeWidth={2} />
              </div>
              <h3 className="text-base font-bold mb-2 tracking-tight text-slate-900">Cancelar Pedido</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-5">
                Selecione qual pedido você deseja cancelar. As informações serão enviadas diretamente ao nosso suporte.
              </p>
              
              <select 
                value={orderToCancelId}
                onChange={(e) => setOrderToCancelId(e.target.value)}
                className="w-full mb-4 p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-red-300 focus:ring-1 focus:ring-red-300 text-slate-700 font-semibold cursor-pointer shadow-sm"
              >
                <option value="" disabled>Selecione um pedido...</option>
                {/* Filtra para mostrar apenas pedidos que não foram finalizados, afinal não dá pra cancelar o que já foi entregue */}
                {mockOrders.filter(o => o.status !== 'Finalizado').map(order => (
                  <option key={order.id} value={order.id}>
                    {order.id} - {order.total}
                  </option>
                ))}
              </select>

              <a 
                href={whatsappLink} 
                target="_blank"
                onClick={handleCancelClick}
                className={`w-full text-sm font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm ${
                  orderToCancelId 
                    ? "bg-slate-900 hover:bg-red-600 text-white border border-transparent cursor-pointer" 
                    : "bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed"
                }`}
              >
                Solicitar Cancelamento
              </a>
            </div>

          </div>

          {/* =========================================
              COLUNA DIREITA - ABAS E PEDIDOS
          ========================================= */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col">
            
            {/* NAVEGAÇÃO DE ABAS */}
            <div className="w-full border-b border-slate-200/60 mb-6 overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex gap-8 min-w-max px-1">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 text-sm font-bold transition-all relative ${
                      activeTab === tab 
                        ? 'text-teal-700' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-teal-600 rounded-t-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ÁREA DE CONTEÚDO */}
            <div className="w-full">
              
              {filteredOrders.length > 0 ? (
                <div className="flex flex-col gap-6">
                  
                  {filteredOrders.map((order) => (
                    <div key={order.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden group hover:border-teal-300 hover:shadow-md transition-all">
                      
                      {/* Cabeçalho do Pedido */}
                      <div className="bg-slate-50/70 border-b border-slate-100 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white text-teal-600 rounded-lg flex items-center justify-center border border-slate-200 shadow-sm shrink-0">
                            <ShoppingBag size={20} strokeWidth={2} />
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="font-bold text-base text-slate-900 tracking-tight">{order.id}</h3>
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border hidden sm:block ${
                                order.status === 'Finalizado' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-teal-100 text-teal-700 border-teal-200'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 font-medium">Realizado em {order.date}</p>
                          </div>
                        </div>
                        <div className="text-left md:text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Valor Total</p>
                          <p className="font-black text-lg text-slate-900">{order.total}</p>
                        </div>
                      </div>

                      {/* Corpo do Pedido */}
                      <div className="p-6 grid grid-cols-1 xl:grid-cols-12 gap-8 items-center">
                        
                        {/* Resumo dos Itens */}
                        <div className="xl:col-span-5">
                          <h4 className="text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-widest">Itens do Pedido</h4>
                          <ul className="space-y-3">
                            {order.items.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-3 text-sm font-medium text-slate-700">
                                <span className="w-6 h-6 rounded bg-slate-50 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0 mt-0.5">
                                  {item.qtd}x
                                </span>
                                <span className="leading-snug pt-0.5 line-clamp-2">{item.name}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* A TIMELINE */}
                        <div className="xl:col-span-7 relative pt-4 xl:pt-0">
                          <h4 className="text-[10px] font-bold text-slate-400 mb-6 uppercase tracking-widest hidden xl:block">Progresso da Entrega</h4>
                          
                          <div className="flex items-center justify-between relative px-2">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full"></div>
                            
                            {/* Barra de Progresso Dinâmica Simples */}
                            <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-teal-500 rounded-full transition-all`} 
                              style={{ width: order.status === 'Preparando' ? '33%' : order.status === 'A Caminho' ? '66%' : order.status === 'Finalizado' ? '100%' : '10%' }}>
                            </div>

                            <div className="relative z-10 flex flex-col items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-sm border-2 border-white ring-1 ring-teal-100">
                                <Clock size={12} strokeWidth={3} />
                              </div>
                              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider hidden sm:block">Pago</span>
                            </div>

                            <div className="relative z-10 flex flex-col items-center gap-2">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 border-white transition-colors ${order.status === 'Preparando' || order.status === 'A Caminho' || order.status === 'Finalizado' ? 'bg-teal-500 text-white ring-1 ring-teal-100' : 'bg-slate-200 text-slate-400'}`}>
                                <Package size={12} strokeWidth={3} />
                              </div>
                              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider hidden sm:block">Preparo</span>
                            </div>

                            <div className="relative z-10 flex flex-col items-center gap-2">
                              <div className={`flex items-center justify-center border-2 border-white transition-all ${order.status === 'A Caminho' ? 'w-10 h-10 rounded-full bg-teal-600 text-white shadow-md ring-4 ring-teal-100/50 animate-pulse mt-[-6px]' : order.status === 'Finalizado' ? 'w-7 h-7 rounded-full bg-teal-500 text-white ring-1 ring-teal-100' : 'w-7 h-7 rounded-full bg-slate-200 text-slate-400'}`}>
                                <Truck size={order.status === 'A Caminho' ? 18 : 12} strokeWidth={2.5} />
                              </div>
                              <span className={`text-[10px] uppercase tracking-wider ${order.status === 'A Caminho' ? 'font-black text-teal-700 mt-[-2px]' : 'font-bold text-slate-400 hidden sm:block'}`}>Em Rota</span>
                            </div>

                            <div className="relative z-10 flex flex-col items-center gap-2">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 border-white transition-colors ${order.status === 'Finalizado' ? 'bg-teal-500 text-white ring-1 ring-teal-100' : 'bg-slate-200 text-slate-400'}`}>
                                <CheckCircle2 size={12} strokeWidth={3} />
                              </div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block">Entregue</span>
                            </div>
                          </div>
                        </div>

                      </div>
                      
                      {/* Rodapé do Pedido */}
                      <div className="bg-slate-50/30 border-t border-slate-100 p-4 px-6 flex justify-end">
                        <button className="text-xs font-bold text-teal-600 hover:text-teal-800 transition-colors flex items-center gap-1.5 uppercase tracking-wider">
                          Ver detalhes <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                </div>
              ) : (
                /* ESTADO VAZIO (Aparece se clicar em uma aba que não tem nada) */
                <div className="w-full bg-white border border-dashed border-slate-300 rounded-xl p-12 sm:p-16 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-5">
                    <Search size={28} strokeWidth={1.5} />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800 mb-2">Nenhum pedido encontrado</h2>
                  <p className="text-slate-500 text-sm max-w-sm mb-6 leading-relaxed">
                    Você não possui registros na aba "{activeTab}". Assim que houver atualizações, elas aparecerão aqui.
                  </p>
                  <Link 
                    href="/"
                    className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-3 px-8 rounded-lg transition-colors shadow-sm flex items-center gap-2"
                  >
                    <ShoppingBag size={16} /> Explorar Vitrine
                  </Link>
                </div>
              )}

            </div>
          </div>

        </div>
      </section>
    </main>
  );
}