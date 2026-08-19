'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Package, User as UserIcon, MapPin, ShieldCheck, ChevronRight, LogOut, Loader2, CheckCircle2 } from 'lucide-react';
const OzoneBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden bg-[#FAFAFC] pointer-events-none">
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes float1 {
        0%, 100% { transform: translate(0px, 0px) scale(1); }
        33% { transform: translate(150px, -100px) scale(1.05); }
        66% { transform: translate(-100px, 120px) scale(0.95); }
      }
    `}} />
    <div className="absolute top-[-10%] left-[-10%] opacity-60" style={{ animation: 'float1 25s ease-in-out infinite' }}>
      <div className="w-96 h-96 bg-teal-300/40 rounded-full blur-[100px]"></div>
    </div>
  </div>
);

export default function PainelConta() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      setUserEmail(session.user.email || '');

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (data) setProfile(data);
      setLoading(false);
    };

    fetchUserData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const cards = [
    {
      title: 'Meus Pedidos',
      description: 'Acompanhe suas compras e histórico.',
      icon: Package,
      action: () => alert('Página de pedidos em construção!'),
    },
    {
      title: 'Dados Pessoais',
      description: 'Gerencie seu nome, CPF e telefone.',
      icon: UserIcon,
      action: () => alert('Página de dados em construção!'),
    },
    {
      title: 'Endereços',
      description: 'Locais de entrega salvos.',
      icon: MapPin,
      action: () => alert('Página de endereços em construção!'),
    },
    {
      title: 'Segurança',
      description: 'Altere sua senha de acesso.',
      icon: ShieldCheck,
      action: () => alert('Página de segurança em construção!'),
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFC]">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    );
  }

  return (
    <main className="min-h-screen text-slate-900 relative pb-20">
      <OzoneBackground />

      <div className="max-w-[1000px] mx-auto px-5 sm:px-10 pt-10 sm:pt-16 relative z-10">
        
        {/* CABEÇALHO DO PERFIL */}
        <div className="bg-white/60 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 sm:p-10 mb-8 sm:mb-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg shrink-0 border-4 border-white">
            <span className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter">
              {profile?.nome ? profile.nome.substring(0, 2) : 'US'}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {profile?.nome || 'Cliente Ozonteck'}
            </h1>
            <p className="text-slate-500 font-medium mt-1">{userEmail}</p>
            <div className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mt-4">
              <CheckCircle2 size={12} /> Conta Ativa
            </div>
          </div>
        </div>

        <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider mb-6 px-2">Gerenciar Conta</h2>

        {/* GRID DE CARTÕES ESTILO MERCADO LIVRE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <button
                key={index}
                onClick={card.action}
                className="group bg-white/80 backdrop-blur-sm border border-slate-200 hover:border-teal-300 rounded-2xl p-6 text-left transition-all duration-300 hover:shadow-[0_8px_30px_rgb(13,148,136,0.1)] flex items-start gap-4 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-50 group-hover:bg-teal-50 flex items-center justify-center shrink-0 transition-colors duration-300">
                  <Icon size={24} className="text-slate-600 group-hover:text-teal-600 transition-colors duration-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">{card.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">{card.description}</p>
                </div>
                <ChevronRight size={20} className="text-slate-300 group-hover:text-teal-500 transition-colors mt-2" />
              </button>
            );
          })}
        </div>

        {/* BOTÃO SAIR */}
        <div className="mt-12 flex justify-center sm:justify-start px-2">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={16} /> Sair da minha conta
          </button>
        </div>

      </div>
    </main>
  );
}