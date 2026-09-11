'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Package, User as UserIcon, MapPin, ShieldCheck, LogOut, Loader2, Camera, CheckCircle2, MessageCircle, ChevronRight, Heart, ExternalLink, ShieldAlert, Truck, Clock, ArrowRight, Lock, ShoppingBag, Motorbike } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function PainelConta() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [userEmail, setUserEmail] = useState('');
  
  const [recentOrder, setRecentOrder] = useState<any>({
    id: 'OZK-98234-71',
    status: 'Em Rota'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');

      setUserEmail(session.user.email || '');

      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (data) setProfile(data);
      setLoading(false);
    };
    fetchUserData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) throw new Error('Selecione uma imagem.');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada.');
      
      const userId = session.user.id;
      const file = event.target.files[0];
      const filePath = `${userId}-${Math.random()}.${file.name.split('.').pop()}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase.from('profiles').upsert({ 
          id: userId, 
          avatar_url: publicUrl,
          nome: profile?.nome || 'Cliente Ozonteck',
          role: profile?.role || 'cliente',
          email: userEmail
        });

      if (updateError) throw updateError;

      setProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }));
      toast.success('Foto atualizada com sucesso.');
      
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar a imagem.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFC]">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    );
  }

  const initials = profile?.nome && profile.nome !== 'Cliente Ozonteck' ? profile.nome.substring(0, 2).toUpperCase() : 'US';

  return (
    <main className="min-h-screen bg-[#FAFAFC] relative pb-24 font-sans text-slate-900 overflow-hidden">
      <div className="max-w-[1800px] w-full mx-auto px-5 sm:px-10 lg:px-16 pt-8 sm:pt-10 relative z-10">
        
        {/* CABEÇALHO */}
        <div className="mb-8 pb-5 border-b border-slate-200/60">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Visão Geral</h1>
          <p className="text-slate-500 mt-1.5 text-sm font-medium">Bem-vindo(a) à sua central de controle Ozonteck.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-8 flex flex-col items-center text-center border-b border-slate-100 relative">
                <div className="relative w-24 h-24 rounded-full border-4 border-white shadow-lg bg-slate-50 flex items-center justify-center overflow-hidden mb-5 group ring-1 ring-slate-200">
                  {uploading ? (
                    <Loader2 className="animate-spin text-teal-600" size={24} />
                  ) : profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-slate-400">{initials}</span>
                  )}
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()} 
                    className="absolute inset-0 bg-slate-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm"
                    title="Alterar Foto"
                  >
                    <Camera size={20} className="text-white" />
                  </div>
                </div>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={uploadAvatar} disabled={uploading}/>

                <h2 className="text-lg font-bold text-slate-900 truncate w-full tracking-tight">{profile?.nome || 'Cliente Ozonteck'}</h2>
                <p className="text-xs font-medium text-slate-500 mt-1 truncate w-full">{userEmail}</p>
                
                <div className="mt-4 inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-teal-100">
                  <CheckCircle2 size={14} /> Verificado
                </div>
              </div>

              <div className="p-4 flex flex-col gap-1">
                <Link href="/" className="flex items-center justify-between p-3 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-teal-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <ExternalLink size={18} className="text-slate-400" /> Ir para Vitrine
                  </div>
                </Link>
                <Link href="/conta/favoritos" className="flex items-center justify-between p-3 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-teal-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <Heart size={18} className="text-slate-400" /> Meus Favoritos
                  </div>
                </Link>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100">
                <button 
                  onClick={handleLogout} 
                  className="w-full flex items-center justify-center gap-2 text-xs font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 py-3 rounded-lg transition-colors border border-red-100 hover:border-red-600"
                >
                  <LogOut size={16} strokeWidth={2.5} /> Sair da Conta
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-8">
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              
              <div className="bg-slate-900 rounded-xl p-8 shadow-sm border border-slate-800 text-white flex flex-col justify-between relative overflow-hidden group min-h-[220px]">
                <div className="absolute -right-8 -top-8 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl group-hover:bg-teal-500/20 transition-all pointer-events-none"></div>
                
                <div>
                  <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center border border-white/10 mb-5">
                    <Package size={24} className="text-teal-400" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight mb-2">Painel de Pedidos</h3>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                    Acompanhe o status do seu pedido, envio via Uber/Motoboy e seu histórico de compras.
                  </p>
                </div>
                
                <div className="mt-8">
                  <button 
                    onClick={() => router.push('/conta/pedidos')}
                    className="bg-teal-500 hover:bg-teal-400 text-slate-900 text-sm font-bold py-2.5 px-6 rounded-lg transition-colors flex items-center gap-2 w-fit shadow-sm"
                  >
                    Acessar Pedidos <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {recentOrder ? (
                <div className="relative bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-h-[220px] flex flex-col">
                  <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center">
                    <div className="bg-slate-900 text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl flex items-center gap-2">
                      <ShieldAlert size={14} className="text-teal-400" /> Em Desenvolvimento
                    </div>
                  </div>

                  <div className="p-6 border-b border-slate-100 flex items-center justify-between opacity-50 grayscale select-none">
                    <div>
                      <h3 className="font-bold text-slate-900">Último Pedido</h3>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{recentOrder.id}</p>
                    </div>
                    <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-md">{recentOrder.status}</span>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col justify-center opacity-50 grayscale select-none">
                    <div className="relative flex items-center justify-between px-2">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full"></div>
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2/3 h-1 bg-teal-500 rounded-full"></div>
                      <div className="relative z-10 w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center border-2 border-white"><CheckCircle2 size={14} /></div>
                      <div className="relative z-10 w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center border-2 border-white ring-4 ring-teal-50"><Package size={18} /></div>
                      <div className="relative z-10 w-8 h-8 rounded-full bg-white text-slate-300 border-2 border-slate-200"><CheckCircle2 size={14} className="m-auto mt-1.5" /></div>
                    </div>
                    <div className="flex justify-between mt-3 px-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase">Aprovado</span>
                      <span className="text-[10px] font-bold text-teal-700 uppercase translate-x-1">Em Rota (Uber/Moto)</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Entregue</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center min-h-[220px]">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-slate-100">
                    <ShoppingBag size={20} className="text-slate-300" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1">Nenhum pedido recente</h3>
                  <p className="text-xs text-slate-500 max-w-[200px] mb-4 leading-relaxed">
                    Sua vitrine está cheia de novidades esperando por você.
                  </p>
                  <Link href="/" className="text-[11px] font-bold text-teal-600 uppercase tracking-widest hover:text-teal-800 transition-colors">
                    Fazer primeira compra
                  </Link>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={16} className="text-slate-400" /> Configurações da Conta
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div onClick={() => router.push('/conta/dados')} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 bg-slate-50 text-slate-600 border border-slate-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-teal-50 group-hover:text-teal-600 group-hover:border-teal-100 transition-colors">
                      <UserIcon size={20} strokeWidth={2} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">Identidade</h4>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">Gerencie CPF, nome e telefone de contato oficial.</p>
                  </div>
                  <div className="mt-4 flex items-center text-[11px] font-bold text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 duration-300">
                    Editar Dados <ArrowRight size={14} className="ml-1" />
                  </div>
                </div>

                <div onClick={() => router.push('/conta/enderecos')} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 bg-slate-50 text-slate-600 border border-slate-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-teal-50 group-hover:text-teal-600 group-hover:border-teal-100 transition-colors">
                      <MapPin size={20} strokeWidth={2} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">Endereços</h4>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">Adicione ou remova locais de entrega e faturamento.</p>
                  </div>
                  <div className="mt-4 flex items-center text-[11px] font-bold text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 duration-300">
                    Gerenciar Locais <ArrowRight size={14} className="ml-1" />
                  </div>
                </div>

                <div onClick={() => router.push('/conta/seguranca')} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 bg-slate-50 text-slate-600 border border-slate-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-teal-50 group-hover:text-teal-600 group-hover:border-teal-100 transition-colors">
                      <Lock size={20} strokeWidth={2} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">Segurança</h4>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">Altere senhas, ative 2FA e blinde sua conta.</p>
                  </div>
                  <div className="mt-4 flex items-center text-[11px] font-bold text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 duration-300">
                    Central de Segurança <ArrowRight size={14} className="ml-1" />
                  </div>
                </div>

              </div>
            </div>

            <div className="bg-teal-50/50 border border-teal-100/50 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="flex items-center gap-5 text-center sm:text-left flex-col sm:flex-row">
                <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center shrink-0">
                  <MessageCircle size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Precisa de ajuda com seu pedido?</h3>
                  <p className="text-sm text-slate-600 mt-1">Nossa equipe humanizada está pronta para resolver qualquer dúvida no WhatsApp.</p>
                </div>
              </div>
              <a 
                href="https://wa.me/5581900000000" 
                target="_blank"
                className="shrink-0 bg-white border border-slate-200 hover:border-teal-500 hover:text-teal-600 text-slate-700 text-sm font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                Falar com Rogério
              </a>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}