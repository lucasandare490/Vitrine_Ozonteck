'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, ArrowRight, Loader2, ShieldCheck, CheckCircle2, ArrowLeft, Eye, EyeOff, Phone, CreditCard, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/store/useCartStore';

const LoginOzoneBackground = () => (
  <div className="absolute inset-0 z-0 overflow-hidden bg-slate-50 pointer-events-none fixed">
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
  const items = useCartStore((state) => state.items); 
  
  const [isMounted, setIsMounted] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    nome: '', email: '', password: '', telefone: '', cpf: '', cep: '', endereco: ''
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    if (name === 'email') value = value.toLowerCase().trim();
    if (name === 'cpf') value = value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14);
    if (name === 'telefone') value = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4,5})(\d{4})/, '$1-$2').slice(0, 15);
    if (name === 'cep') value = value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMsg('');
  };

  const buscarCep = async (meuCep: string) => {
    const cepLimpo = meuCep.replace(/\D/g, "");
    if (cepLimpo.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData(prev => ({ ...prev, endereco: `${data.logradouro}, Bairro ${data.bairro}, ${data.localidade} - ${data.uf}` }));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleResetPassword = async () => {
    if (!formData.email) {
      setErrorMsg("Digite o seu e-mail no campo acima para recuperar a senha.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
      redirectTo: `${window.location.origin}/login`, 
    });
    setLoading(false);
    
    if (error) {
      setErrorMsg("Erro ao enviar e-mail de recuperação.");
    } else {
      setSuccessMsg("Enviamos um link de recuperação para o seu e-mail!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) throw new Error('Formato de e-mail inválido.');

      if (isLogin) {
        // ==========================================
        // FLUXO DE LOGIN MANUAL
        // ==========================================
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw new Error('E-mail ou senha incorretos.');
        
        setSuccessMsg('Acesso confirmado! Redirecionando...');
        
        // Roteamento inteligente baseado no carrinho
        if (items.length > 0) {
          window.location.assign('/lista'); 
        } else {
          window.location.assign('/'); 
        }

      } else {
        // ==========================================
        // FLUXO DE CADASTRO COM AUTO-LOGIN E REDIRECIONAMENTO
        // ==========================================
        if (formData.password.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.');
        if (formData.nome.trim().length < 3) throw new Error('Insira o seu nome completo.');
        if (!formData.telefone || !formData.cpf || !formData.cep || !formData.endereco) {
          throw new Error('Preencha todos os campos do endereço.');
        }

        // 1. Cria a conta (Supabase já loga automaticamente aqui)
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { data: { nome: formData.nome } }
        });

        if (signUpError) throw new Error(signUpError.message);
        if (!authData.user) throw new Error('Erro ao criar conta no servidor.');

        // 2. Salva o Perfil
        const { error: profileError } = await supabase.from("profiles").upsert({
            id: authData.user.id,
            nome: formData.nome,
            telefone: formData.telefone,
            cpf: formData.cpf,
            cep: formData.cep,
            endereco_completo: formData.endereco,
            role: "cliente", 
          });

        if (profileError) throw new Error('Erro ao salvar os dados adicionais.');

        // 3. AVISA E JOGA PARA O CARRINHO/VITRINE AUTOMATICAMENTE (Sem deslogar)
        setSuccessMsg('Conta criada com sucesso! Redirecionando...');
        
        // Dá 1 segundinho só pra pessoa ler a mensagem verde de sucesso e já redireciona
        setTimeout(() => {
          if (items.length > 0) {
            window.location.assign('/lista'); 
          } else {
            window.location.assign('/'); 
          }
        }, 1000);
      }
    } catch (error: any) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  // Previne Hydration Error do React (O Escudo Anti-Kaspersky)
  if (!isMounted) return <div className="min-h-screen bg-[#FAFAFC]" />;

  return (
    <main className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row bg-[#FAFAFC] overflow-x-hidden lg:overflow-y-hidden">
      
      {/* LADO ESQUERDO */}
      <div className="relative hidden lg:flex flex-col lg:w-5/12 xl:w-1/2 bg-teal-950 justify-between p-8 lg:p-16 shadow-2xl z-20 h-full">
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
              Crie a sua conta para acessar o catálogo completo, montar seus pedidos e receber acompanhamento direto e humanizado com a nossa unidade.
            </p>
          </div>

          <div className="space-y-4 mt-8 hidden lg:block">
            <div className="flex items-center gap-3 text-teal-50 text-sm font-medium">
              <CheckCircle2 size={20} className="text-teal-400 shrink-0" />
              <span>Acompanhamento consultivo especializado</span>
            </div>
            <div className="flex items-center gap-3 text-teal-50 text-sm font-medium">
              <CheckCircle2 size={20} className="text-teal-400 shrink-0" />
              <span>Gerencie seus pedidos com agilidade</span>
            </div>
          </div>
        </div>
      </div>

      {/* LADO DIREITO */}
      <div className="w-full lg:w-7/12 xl:w-1/2 lg:h-full lg:overflow-y-auto relative flex flex-col justify-center">
        <LoginOzoneBackground />

        <div className="flex-1 flex flex-col items-center justify-center p-4 py-12 relative z-10 w-full">
          <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_40px_rgb(0,0,0,0.06)] relative my-auto">
            
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-teal-50/80 border border-teal-100/80 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={28} className="text-teal-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
                {isLogin ? 'Acessar Conta' : 'Criar Conta'}
              </h2>
            </div>

            {errorMsg && (
              <div className="bg-red-50 text-red-600 text-xs sm:text-sm p-3 rounded-xl mb-6 border border-red-100 text-center font-bold">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="bg-teal-50 text-teal-700 text-xs sm:text-sm p-3 rounded-xl mb-6 border border-teal-100 text-center font-bold flex items-center justify-center gap-2">
                {successMsg.includes('Redirecionando') && <Loader2 size={16} className="animate-spin" />}
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {!isLogin && (
                <div className="animate-in fade-in duration-300 space-y-4">
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
                        placeholder="Como devemos chamá-lo(a)?"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">WhatsApp</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone size={16} className="text-slate-400" />
                        </div>
                        <input
                          type="text"
                          name="telefone"
                          value={formData.telefone}
                          onChange={handleChange}
                          required={!isLogin}
                          className="w-full pl-10 p-3 bg-white/90 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all placeholder:text-slate-400"
                          placeholder="(81) 99999-9999"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">CPF</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <CreditCard size={16} className="text-slate-400" />
                        </div>
                        <input
                          type="text"
                          name="cpf"
                          value={formData.cpf}
                          onChange={handleChange}
                          required={!isLogin}
                          className="w-full pl-10 p-3 bg-white/90 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all placeholder:text-slate-400"
                          placeholder="000.000.000-00"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">CEP</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin size={16} className="text-slate-400" />
                      </div>
                      <input
                        type="text"
                        name="cep"
                        value={formData.cep}
                        onChange={handleChange}
                        onBlur={(e) => buscarCep(e.target.value)}
                        required={!isLogin}
                        className="w-full pl-10 p-3 bg-white/90 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all placeholder:text-slate-400"
                        placeholder="00000-000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">Endereço Completo</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin size={16} className="text-slate-400" />
                      </div>
                      <input
                        type="text"
                        name="endereco"
                        value={formData.endereco}
                        onChange={handleChange}
                        required={!isLogin}
                        className="w-full pl-10 p-3 bg-white/90 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all placeholder:text-slate-400"
                        placeholder="Ex: Av. Principal, 123"
                      />
                    </div>
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
                    placeholder="seu.email@dominio.com"
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
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    className="w-full pl-10 pr-10 p-3 bg-white/90 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all placeholder:text-slate-400"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-teal-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="flex justify-end mt-1">
                  <button 
                    type="button" 
                    onClick={handleResetPassword} 
                    className="text-[11px] font-semibold text-teal-600 hover:text-teal-800 transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              )}

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
                type="button"
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
      </div>
    </main>
  );
}