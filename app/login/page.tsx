'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, ArrowRight, Loader2, ShieldCheck, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Criamos uma versão exclusiva da animação para o fundo do formulário
const LoginOzoneBackground = () => (
  <div className="absolute inset-0 z-0 overflow-hidden bg-slate-50 pointer-events-none">
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes float1 {
        0%, 100% { transform: translate(0px, 0px) scale(1); }
        33% { transform: translate(100px, -50px) scale(1.05); }
        66% { transform: translate(-50px, 80px) scale(0.95); }
      }
      @keyframes float2 {
        0%, 100% { transform: translate(0px, 0px) scale(1); }
        50% { transform: translate(-100px, 100px) scale(1.05); }
      }
    `}} />

    <div className="absolute top-[5%] left-[-10%] sm:left-[5%] opacity-80" style={{ animation: 'float1 25s ease-in-out infinite' }}>
      <div className="relative flex items-center justify-center scale-100 sm:scale-110">
        <div className="w-64 h-64 bg-teal-300/60 rounded-full blur-[80px] absolute -left-20 animate-[pulse_8s_ease-in-out_infinite]"></div>
        <div className="w-56 h-56 bg-cyan-300/60 rounded-full blur-[80px] absolute top-20 animate-[pulse_10s_ease-in-out_infinite_alternate]"></div>
      </div>
    </div>
    
    <div className="absolute top-[60%] right-[-10%] sm:right-[10%] opacity-70" style={{ animation: 'float2 30s ease-in-out infinite' }}>
      <div className="relative flex items-center justify-center scale-100 sm:scale-110">
        <div className="w-72 h-72 bg-cyan-300/50 rounded-full blur-[90px] absolute -left-10 animate-[pulse_12s_ease-in-out_infinite_alternate]"></div>
        <div className="w-80 h-80 bg-teal-300/60 rounded-full blur-[100px] absolute -right-20 animate-[pulse_9s_ease-in-out_infinite]"></div>
      </div>
    </div>
  </div>
);

export default function Login() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isLogin) {
        // FLUXO DE LOGIN
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw new Error('E-mail ou senha incorretos.');
        router.push('/lista'); // Redireciona para o checkout

      } else {
        // FLUXO DE CADASTRO
        if (formData.password.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.');
        if (formData.nome.trim().length < 3) throw new Error('Por favor, insira seu nome completo.');

        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              nome: formData.nome,
            }
          }
        });

        if (error) throw new Error(error.message);

        setSuccessMsg('Conta criada com sucesso! Você já pode fazer login.');
        setIsLogin(true); // Volta para a aba de login
      }
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-5rem)] lg:h-[calc(100vh-5rem)] flex flex-col lg:flex-row bg-[#FAFAFC] overflow-hidden">
      
      {/* LADO ESQUERDO: Apresentação (Hero) */}
      <div className="relative w-full lg:w-5/12 xl:w-1/2 bg-teal-950 flex flex-col justify-between p-8 lg:p-16 lg:overflow-hidden shadow-2xl z-20">
        {/* Efeitos de Luz de fundo */}
        <div className="absolute top-[-10%] left-[-20%] w-96 h-96 bg-teal-500/30 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center text-teal-100 hover:text-white font-bold text-xs uppercase tracking-wider mb-12 transition-colors">
            <ArrowLeft size={16} className="mr-2" />
            Voltar à Vitrine
          </Link>

          <div className="mb-6">
            <div className="inline-block px-3 py-1 mb-4 rounded-full border border-teal-500/30 bg-teal-500/20 text-teal-200 text-[10px] font-black tracking-widest uppercase">
              Acesso Exclusivo
            </div>
            <h1 className="text-3xl lg:text-5xl font-black text-white leading-[1.1] tracking-tight mb-4">
              Sua vitrine de<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-emerald-300">
                saúde e tecnologia.
              </span>
            </h1>
            <p className="text-teal-100/80 text-sm lg:text-base font-medium max-w-md leading-relaxed">
              Crie sua conta para acessar o catálogo completo, montar seus pedidos e receber acompanhamento direto e humanizado com a nossa unidade.
            </p>
          </div>

          <div className="space-y-4 mt-8">
            <div className="flex items-center gap-3 text-teal-50 text-sm font-medium">
              <CheckCircle2 size={20} className="text-teal-400 shrink-0" />
              <span>Acompanhamento consultivo especializado</span>
            </div>
            <div className="flex items-center gap-3 text-teal-50 text-sm font-medium">
              <CheckCircle2 size={20} className="text-teal-400 shrink-0" />
              <span>Gerencie seus pedidos com agilidade</span>
            </div>
            <div className="flex items-center gap-3 text-teal-50 text-sm font-medium">
              <CheckCircle2 size={20} className="text-teal-400 shrink-0" />
              <span>Produtos à pronta entrega na Boa Vista</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-12 lg:mt-0">
          <p className="text-teal-600 font-bold text-xs uppercase tracking-widest">
            Ozonteck • Unidade Recife
          </p>
        </div>
      </div>

      {/* LADO DIREITO: O Formulário */}
      <div className="w-full lg:w-7/12 xl:w-1/2 flex items-center justify-center p-6 lg:p-12 relative lg:overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        
        {/* A nova animação azul/verde aplicada apenas ao fundo do lado direito */}
        <LoginOzoneBackground />

        <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/60 rounded-[2rem] p-8 shadow-[0_8px_40px_rgb(0,0,0,0.06)] relative z-10">
          
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-teal-50/80 border border-teal-100/80 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={28} className="text-teal-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
              {isLogin ? 'Acessar Conta' : 'Criar Conta'}
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              {isLogin ? 'Bem-vindo de volta! Insira seus dados.' : 'Preencha os dados abaixo para começar.'}
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 text-red-600 text-xs sm:text-sm p-3 rounded-xl mb-6 border border-red-100 text-center font-bold">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-teal-50 text-teal-700 text-xs sm:text-sm p-3 rounded-xl mb-6 border border-teal-100 text-center font-bold">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {!isLogin && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">Nome Completo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={16} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    required={!isLogin}
                    className="w-full pl-10 p-3 bg-white/90 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all placeholder:text-slate-400"
                    placeholder="Como devemos te chamar?"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={16} className="text-slate-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 p-3 bg-white/90 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all placeholder:text-slate-400"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-slate-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 p-3 bg-white/90 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all placeholder:text-slate-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Entrar no Sistema' : 'Criar minha conta'}
                  <ArrowRight size={16} className="ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center pt-6">
            <p className="text-xs text-slate-500 font-medium">
              {isLogin ? "Ainda não tem uma conta?" : "Já possui uma conta?"}
            </p>
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="text-teal-600 font-black hover:text-teal-800 transition-colors mt-2 uppercase text-[11px] tracking-wider"
            >
              {isLogin ? 'Criar nova conta agora' : 'Fazer login'}
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}