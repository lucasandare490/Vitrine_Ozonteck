'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Search, Package, ShoppingBag, Truck, CheckCircle2, Clock, MessageCircle, XCircle, ChevronRight, Star, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { User } from '@supabase/supabase-js';
import { useAccountOrders } from '@/lib/use-account-orders';
import { getOrderStatus, isOpenPayment } from '@/lib/order-status';
import { orderAddressText } from '@/lib/order-contact';
import OrderProductReviews from '@/components/OrderProductReviews';
import OrderPayment from '@/components/OrderPayment';

type TabStatus = 'Todos' | 'pagamentos' | 'preparando' | 'enviado' | 'entregue';

type Profile = {
  nome: string | null;
  telefone: string | null;
};

// OTIMIZAÇÃO: Constantes estáticas e arrays pesados extraídos para fora do componente.
// Evita a recriação destes arrays a cada renderização (ao digitar ou trocar abas), poupando memória do navegador.
const TABS: { id: TabStatus, label: string }[] = [
  { id: 'Todos', label: 'Pedidos confirmados' },
  { id: 'pagamentos', label: 'Pagamentos em aberto' },
  { id: 'preparando', label: 'Preparando' }, 
  { id: 'enviado', label: 'Em Rota' }, 
  { id: 'entregue', label: 'Finalizados' }
];

const TAGS_ELOGIO = ['Entrega super rápida', 'Ótimo atendimento', 'Embalagem bem cuidada', 'Compra fácil', 'Recomendo a loja'];
const TAGS_CRITICA = ['Atraso na entrega', 'Caixa amassada', 'Atendimento lento', 'Tive problemas', 'Não era o esperado'];

export default function PedidosPage() {
  const [activeTab, setActiveTab] = useState<TabStatus>('Todos');
  const [orderToCancelId, setOrderToCancelId] = useState<string>('');
  const [detailsOrderId, setDetailsOrderId] = useState<string | null>(null);

  // Estados do Banco de Dados
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Profile | null>(null);
  const { orders: pedidos, loading: ordersLoading, error: ordersError, refresh: refreshOrders } = useAccountOrders();
  const [loading, setLoading] = useState(true);

  // Estados da Avaliação
  const [reviewingOrderId, setReviewingOrderId] = useState<string | null>(null);
  const [nota, setNota] = useState(0);
  const [hoverNota, setHoverNota] = useState(0);
  const [comentario, setComentario] = useState('');
  const [tagsSelecionadas, setTagsSelecionadas] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avaliacoesFeitas, setAvaliacoesFeitas] = useState<string[]>([]);

  useEffect(() => {
    async function carregarDados() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        
        const { data: profileData } = await supabase.from('profiles').select('nome, telefone').eq('id', session.user.id).single();
        if (profileData) setPerfil(profileData);

        const { data: avaliacoesData } = await supabase
          .from('avaliacoes')
          .select('pedido_id')
          .eq('user_id', session.user.id);
          
        if (avaliacoesData) {
          setAvaliacoesFeitas(
            avaliacoesData
              .map((avaliacao) => avaliacao.pedido_id)
              .filter((pedidoId): pedidoId is string => Boolean(pedidoId)),
          );
        }
      }
      setLoading(false);
    }
    carregarDados();
  }, []);

  // OTIMIZAÇÃO: Filtro e seleção memorizados
  const filteredOrders = useMemo(() => {
    return pedidos.filter(order => activeTab === 'pagamentos' ? isOpenPayment(order.status) : activeTab === 'Todos' ? !isOpenPayment(order.status) : order.status === activeTab);
  }, [pedidos, activeTab]);

  const selectedOrder = useMemo(() => {
    return pedidos.find(o => o.id === orderToCancelId);
  }, [pedidos, orderToCancelId]);
  
  const whatsappLink = useMemo(() => {
    if (selectedOrder) {
      const itemsText = selectedOrder.itens?.map((item) => `${item.qtd}x ${item.nome}`).join(', ');
      const text = `Olá, equipe Ozonteck! Gostaria de solicitar o cancelamento de um pedido.\n\n*📦 Pedido:* #${selectedOrder.id.split('-')[0]}\n*💰 Valor:* R$ ${Number(selectedOrder.valor_total).toFixed(2).replace('.', ',')}\n*🛒 Itens:* ${itemsText}\n\nPodem me ajudar com este cancelamento?`;
      return `https://wa.me/5581981472684?text=${encodeURIComponent(text)}`;
    }
    return "https://wa.me/5581981472684?text=Ol%C3%A1!%20Gostaria%20de%20ajuda%20com%20meus%20pedidos.";
  }, [selectedOrder]);

  const handleCancelClick = (e: React.MouseEvent) => {
    if (!orderToCancelId) {
      e.preventDefault();
      toast.error('Selecione um pedido na lista para cancelar.');
    }
  };

  const abrirAvaliacao = (orderId: string) => {
    if (reviewingOrderId === orderId) {
      setReviewingOrderId(null);
    } else {
      setReviewingOrderId(orderId);
      setNota(0);
      setComentario('');
      setTagsSelecionadas([]);
    }
  };

  const toggleTag = (tag: string) => {
    setTagsSelecionadas(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const enviarAvaliacao = async (orderId: string) => {
    if (!user) {
      toast.error('Entre na sua conta para avaliar a experiência de compra.');
      return;
    }

    if (nota === 0) {
      toast.error('Por favor, selecione as estrelas primeiro.');
      return;
    }

    setIsSubmitting(true);

    let textoFinal = comentario.trim();
    if (tagsSelecionadas.length > 0) {
      const tagsTexto = tagsSelecionadas.join(' • ');
      textoFinal = textoFinal ? `${tagsTexto} — ${textoFinal}` : tagsTexto;
    }

    const { error } = await supabase.from('avaliacoes').insert({
      user_id: user.id,
      pedido_id: orderId, 
      nome_cliente: perfil?.nome || 'Cliente Ozonteck',
      nota: nota,
      comentario: textoFinal,
    });

    if (error) {
      if (error.code === '23505') {
        setAvaliacoesFeitas((prev) => prev.includes(orderId) ? prev : [...prev, orderId]);
        setReviewingOrderId(null);
        toast.error('Este pedido já possui uma avaliação.');
      } else if (error.code === '42501') {
        toast.error('Somente pedidos entregues podem ser avaliados.');
      } else {
        toast.error('Não foi possível enviar a avaliação. Tente novamente.');
      }
    } else {
      setAvaliacoesFeitas((prev) => prev.includes(orderId) ? prev : [...prev, orderId]);
      toast.success('Avaliação da loja recebida para análise. Obrigado!');
      setReviewingOrderId(null);
    }
    setIsSubmitting(false);
  };

  if (loading || ordersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFC]">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAFC] text-slate-900 relative overflow-hidden flex flex-col">
      <section className="max-w-[1800px] w-full mx-auto px-5 sm:px-10 lg:px-16 pt-8 sm:pt-10 pb-24 relative z-10">
        
        {/* CABEÇALHO */}
        <div className="mb-8 pb-5 border-b border-slate-200/60">
          <Link href="/conta" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-teal-600 mb-5 transition-colors uppercase tracking-widest">
            <ArrowLeft size={12} /> Voltar para o Painel
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Package className="text-teal-600 w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.5} />
            Meus Pedidos
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">
            Acompanhe o status, rastreie entregas e veja seu histórico completo.
          </p>
        </div>

        <div className="account-workspace grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6">
            <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm border border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-5">
                <MessageCircle size={20} strokeWidth={2} />
              </div>
              <h3 className="text-lg font-bold mb-2 tracking-tight">Dúvidas com a Entrega?</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                Caso o seu pedido esteja com atraso ou o status não tenha atualizado, fale direto com nossa central.
              </p>
              <a 
                href="https://wa.me/5581981472684" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-white hover:bg-teal-50 text-slate-900 text-sm font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                Chamar no WhatsApp
              </a>
            </div>

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
                {pedidos.filter(o => o.status !== 'entregue').map(order => (
                  <option key={order.id} value={order.id}>
                    #{order.id.split('-')[0]} - R$ {Number(order.valor_total).toFixed(2).replace('.', ',')}
                  </option>
                ))}
              </select>

              <a 
                href={whatsappLink} 
                target="_blank"
                rel="noopener noreferrer"
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

          <div className="lg:col-span-8 xl:col-span-9 flex flex-col">
            <div className="w-full border-b border-slate-200/60 mb-6 overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex gap-8 min-w-max px-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-4 text-sm font-bold transition-all relative ${
                      activeTab === tab.id 
                        ? 'text-teal-700' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-teal-600 rounded-t-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full">
              {ordersError && <div role="alert" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4"><p>{ordersError}</p><button onClick={() => void refreshOrders()} className="mt-2 min-h-11 font-bold text-teal-800">Tentar novamente</button></div>}
              {filteredOrders.length > 0 ? (
                <div className="flex flex-col gap-6">
                  {filteredOrders.map((order) => {
                    const isReviewing = reviewingOrderId === order.id;
                    const jaAvaliou = avaliacoesFeitas.includes(order.id);
                    const isEntregue = order.status === 'entregue';

                    return (
                      <div key={order.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden group transition-all relative">
                        
                        <div className="bg-slate-50/70 border-b border-slate-100 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white text-teal-600 rounded-lg flex items-center justify-center border border-slate-200 shadow-sm shrink-0">
                              <ShoppingBag size={20} strokeWidth={2} />
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <h3 className="font-bold text-base text-slate-900 tracking-tight">#{order.id.split('-')[0]}</h3>
                                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border hidden sm:block ${
                                  isEntregue ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-teal-100 text-teal-700 border-teal-200'
                                }`}>
                                  {getOrderStatus(order.status).label}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 font-medium">Realizado em {new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                            </div>
                          </div>
                          <div className="text-left md:text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Valor Total</p>
                            <p className="font-bold text-lg text-slate-900">R$ {Number(order.valor_total).toFixed(2).replace('.', ',')}</p>
                          </div>
                        </div>

                        <div className="p-6 grid grid-cols-1 xl:grid-cols-12 gap-8 items-center">
                          <div className="xl:col-span-5">
                            <h4 className="text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-widest">Itens do Pedido</h4>
                            <OrderProductReviews orderId={order.id} purchasedItems={order.itens || []} delivered={isEntregue} />
                          </div>

                          <div className={`xl:col-span-7 relative pt-4 xl:pt-0 ${isOpenPayment(order.status) ? 'hidden' : ''}`}>
                            <h4 className="text-[10px] font-bold text-slate-400 mb-6 uppercase tracking-widest hidden xl:block">Progresso da Entrega</h4>
                            
                            <div className="flex items-center justify-between relative px-2">
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full"></div>
                              
                              <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-teal-500 rounded-full transition-all`} 
                                style={{ width: order.status === 'preparando' ? '33%' : order.status === 'enviado' ? '66%' : isEntregue ? '100%' : '10%' }}>
                              </div>

                              <div className="relative z-10 flex flex-col items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-sm border-2 border-white ring-1 ring-teal-100">
                                  <Clock size={12} strokeWidth={3} />
                                </div>
                                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider hidden sm:block">{getOrderStatus(order.status).paid ? 'Pago' : 'Recebido'}</span>
                              </div>

                              <div className="relative z-10 flex flex-col items-center gap-2">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 border-white transition-colors ${['preparando', 'enviado', 'entregue'].includes(order.status) ? 'bg-teal-500 text-white ring-1 ring-teal-100' : 'bg-slate-200 text-slate-400'}`}>
                                  <Package size={12} strokeWidth={3} />
                                </div>
                                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider hidden sm:block">Preparo</span>
                              </div>

                              <div className="relative z-10 flex flex-col items-center gap-2">
                                <div className={`flex items-center justify-center border-2 border-white transition-all ${order.status === 'enviado' ? 'w-10 h-10 rounded-full bg-teal-600 text-white shadow-md ring-4 ring-teal-100/50 animate-pulse mt-[-6px]' : isEntregue ? 'w-7 h-7 rounded-full bg-teal-500 text-white ring-1 ring-teal-100' : 'w-7 h-7 rounded-full bg-slate-200 text-slate-400'}`}>
                                  <Truck size={order.status === 'enviado' ? 18 : 12} strokeWidth={2.5} />
                                </div>
                                <span className={`text-[10px] uppercase tracking-wider ${order.status === 'enviado' ? 'font-bold text-teal-700 mt-[-2px]' : 'font-bold text-slate-400 hidden sm:block'}`}>Em Rota</span>
                              </div>

                              <div className="relative z-10 flex flex-col items-center gap-2">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 border-white transition-colors ${isEntregue ? 'bg-teal-500 text-white ring-1 ring-teal-100' : 'bg-slate-200 text-slate-400'}`}>
                                  <CheckCircle2 size={12} strokeWidth={3} />
                                </div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block">Entregue</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-slate-50/30 border-t border-slate-100 p-4 px-6 flex justify-between items-center relative z-20">
                          {isEntregue ? (
                            !jaAvaliou ? (
                              <button 
                                onClick={() => abrirAvaliacao(order.id)} 
                                className={`text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-all ${isReviewing ? 'bg-slate-200 text-slate-700 shadow-inner' : 'text-white bg-teal-600 hover:bg-teal-700 shadow-[0_4px_15px_rgba(13,148,136,0.2)] hover:shadow-[0_4px_20px_rgba(13,148,136,0.4)]'}`}
                              >
                                <Star size={14} fill={isReviewing ? "none" : "currentColor"} /> 
                                {isReviewing ? 'Fechar avaliação da experiência' : 'Avaliar experiência de compra'}
                              </button>
                            ) : (
                              <div className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm">
                                <CheckCircle2 size={14} /> Avaliação da loja enviada
                              </div>
                            )
                          ) : (
                            <div></div>
                          )}

                          <button type="button" aria-expanded={detailsOrderId === order.id} onClick={() => setDetailsOrderId(detailsOrderId === order.id ? null : order.id)} className="min-h-11 text-xs font-bold text-teal-600 hover:text-teal-800 transition-colors flex items-center gap-1.5 uppercase tracking-wider">
                            {detailsOrderId === order.id ? 'Fechar detalhes' : order.status === 'pending' ? 'Ver pagamento e detalhes' : 'Ver detalhes'} <ChevronRight size={14} />
                          </button>
                        </div>

                        {detailsOrderId === order.id && <div className="border-t border-slate-100 px-6 py-4 text-sm space-y-4"><OrderPayment key={order.id} orderId={order.id} /><h4 className="font-semibold">Detalhes do pedido</h4><p className="mt-2 break-all">Referência: {order.id}</p><p>Status: {getOrderStatus(order.status).label}</p><p className="mt-2 break-words">Recebimento: {orderAddressText(order.endereco_entrega) || 'Endereço não informado.'}</p></div>}
                        {isReviewing && !jaAvaliou && (
                          <div className="bg-[#F8FAFC] border-t border-slate-200 p-6 sm:p-8 animate-in slide-in-from-top-4 duration-300 shadow-inner">
                            <h4 className="font-bold text-slate-800 mb-1">Como foi sua experiência com a loja?</h4>
                            <p className="text-xs text-slate-500 mb-5">Conte sobre atendimento, entrega e embalagem. Após análise, sua opinião aparece em Experiências de compra no site. Ela não avalia os produtos e não é enviada ao Google.</p>

                            <div className="flex items-center gap-2 mb-6">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  aria-label={`${star} ${star === 1 ? 'estrela' : 'estrelas'} para a experiência de compra`}
                                  aria-pressed={nota === star}
                                  onClick={() => { setNota(star); setTagsSelecionadas([]); }}
                                  onMouseEnter={() => setHoverNota(star)}
                                  onMouseLeave={() => setHoverNota(0)}
                                  className="p-1 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-teal-700"
                                >
                                  <Star 
                                    size={36} 
                                    fill={(hoverNota || nota) >= star ? (nota <= 3 && (hoverNota || nota) === star ? "#EF4444" : "#F59E0B") : "transparent"} 
                                    strokeWidth={(hoverNota || nota) >= star ? 0 : 2}
                                    className={(hoverNota || nota) >= star ? (nota <= 3 ? "text-red-500" : "text-[#F59E0B]") : "text-slate-300"}
                                  />
                                </button>
                              ))}
                            </div>

                            {nota > 0 && (
                              <div className="mb-6 animate-in fade-in duration-300">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                                  {nota >= 4 ? 'O que mais agradou?' : 'O que deu errado?'}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {(nota >= 4 ? TAGS_ELOGIO : TAGS_CRITICA).map(tag => (
                                    <button
                                      key={tag}
                                      onClick={() => toggleTag(tag)}
                                      className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                                        tagsSelecionadas.includes(tag)
                                          ? nota >= 4 
                                            ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-sm'
                                            : 'bg-red-50 border-red-400 text-red-700 shadow-sm'
                                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                      }`}
                                    >
                                      {tag}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="w-full relative mb-5">
                              <textarea
                                value={comentario}
                                onChange={(e) => setComentario(e.target.value)}
                                placeholder="Escreva um comentário (opcional)..."
                                className="w-full h-24 p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 resize-none focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all placeholder:text-slate-400 shadow-sm"
                                maxLength={300}
                              ></textarea>
                            </div>

                            <div className="flex justify-end gap-3">
                              <button 
                                onClick={() => enviarAvaliacao(order.id)}
                                disabled={isSubmitting || nota === 0}
                                className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md disabled:shadow-none flex items-center justify-center gap-2"
                              >
                                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Enviar Avaliação'}
                              </button>
                            </div>

                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : !ordersError ? (
                <div className="w-full bg-white border border-dashed border-slate-300 rounded-xl p-12 sm:p-16 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-5">
                    <Search size={28} strokeWidth={1.5} />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800 mb-2">Nenhum pedido encontrado</h2>
                  <p className="text-slate-500 text-sm max-w-sm mb-6 leading-relaxed">
                    Você não possui registros na aba atual. Assim que houver atualizações, elas aparecerão aqui.
                  </p>
                  <Link 
                    href="/"
                    className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-3 px-8 rounded-lg transition-colors shadow-sm flex items-center gap-2"
                  >
                    <ShoppingBag size={16} /> Explorar Vitrine
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
