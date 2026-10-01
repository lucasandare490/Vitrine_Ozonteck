'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, ArrowRight, Loader2, CheckCircle2, ArrowLeft, Eye, EyeOff, Award, HeartHandshake, Fingerprint } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/store/useCartStore';
import { serializeA11yPreferences, useAccessibilityStore } from '@/store/useAccessibilityStore';
import { needsSecondFactor } from '@/lib/mfa';
import { syncCartForUser } from '@/lib/cart-session';
import { getPasswordValidationError } from '@/lib/auth';

const OAUTH_PROVIDER_ENABLED = {
  google: process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED !== 'false',
  facebook: process.env.NEXT_PUBLIC_AUTH_FACEBOOK_ENABLED !== 'false',
  azure: process.env.NEXT_PUBLIC_AUTH_AZURE_ENABLED !== 'false',
} as const;

const subscribeToClientMount = () => () => undefined;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível concluir a operação.';
}

export default function Login() {
  const router = useRouter();
  
  const isMounted = useSyncExternalStore(subscribeToClientMount, () => true, () => false);
  const [isLogin, setIsLogin] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    nome: '', email: '', password: ''
  });

  // CORREÇÃO DO BOTÃO CARREGANDO INFINITO
  useEffect(() => {
    const handleFocus = () => setOauthLoading(null);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // ==========================================
  // LÓGICA DE SESSÃO E CRIAÇÃO VIA OAUTH COM FOTO
  // ==========================================
  useEffect(() => {
    const verifySession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && !window.location.hash.includes('type=recovery')) {
        if (await needsSecondFactor()) return;
        // Puxando avatar_url para checar se já existe foto
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('role, nome, avatar_url')
          .eq('id', session.user.id)
          .single();
        let profile = existingProfile;

        const settingsToSave = serializeA11yPreferences(useAccessibilityStore.getState());
        
        const nomeSocial = session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Cliente Ozonteck';
        const fotoSocial = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '';

        if (!profile || profileError) {
          // CONTA NOVA: Salva tudo
          const { data: newProfile, error: upsertError } = await supabase.from('profiles').upsert({
            id: session.user.id,
            nome: nomeSocial,
            email: session.user.email,
            avatar_url: fotoSocial,
            role: 'cliente',
            accessibility_settings: settingsToSave
          }).select('role, nome, avatar_url').single();

          if (!upsertError) profile = newProfile;
        } else {
          // CONTA EXISTENTE: Atualiza o que estiver faltando
          const updates: { avatar_url?: string; nome?: string } = {};
          let precisaAtualizar = false;

          // 2. Atualiza a foto se o perfil estava sem e o Google enviou
          if (!profile.avatar_url && fotoSocial) {
            updates.avatar_url = fotoSocial;
            precisaAtualizar = true;
          }

          // 3. Atualiza o nome se o perfil estava genérico
          if (profile.nome === 'Cliente Ozonteck' && nomeSocial && nomeSocial !== 'Cliente Ozonteck') {
            updates.nome = nomeSocial;
            precisaAtualizar = true;
          }

          if (precisaAtualizar) {
            await supabase.from('profiles').update(updates).eq('id', session.user.id);
          }
        }

        await syncCartForUser(session.user.id);
        const hasSavedCart = useCartStore.getState().items.length > 0;
        if (profile?.role === 'admin') {
          router.push('/admin');
        } else if (hasSavedCart) {
          router.push('/lista'); 
        } else {
          router.push('/conta');
        }
      }
    };
    void verifySession().catch((error: unknown) => setErrorMsg(getErrorMessage(error)));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
        setErrorMsg('');
        setSuccessMsg('Autenticado com segurança! Defina sua nova senha abaixo.');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleOAuthLogin = async (provider: 'google' | 'facebook' | 'azure') => {
    if (!OAUTH_PROVIDER_ENABLED[provider]) {
      setErrorMsg('Este provedor está temporariamente indisponível. Use outra forma de acesso.');
      return;
    }
    setOauthLoading(provider);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/login`, 
        }
      });
      if (error) throw error;
    } catch (error: unknown) {
      setErrorMsg(getErrorMessage(error));
      setOauthLoading(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    let { value } = e.target;
    if (name === 'email') value = value.toLowerCase().trim();
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMsg('');
  };

  const handleResetPassword = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    if (!formData.email) {
      setErrorMsg("Digite o seu e-mail no campo acima para recuperar a senha.");
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
      redirectTo: `${window.location.origin}/login`, 
    });
    setLoading(false);
    
    if (error) {
      setErrorMsg("Erro ao enviar e-mail de recuperação. Tente novamente.");
    } else {
      setSuccessMsg("Enviamos um link de recuperação para o seu e-mail!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || oauthLoading) return;
    
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isRecovery) {
        const passwordError = getPasswordValidationError(formData.password);
        if (passwordError) throw new Error(passwordError);
        const { error } = await supabase.auth.updateUser({ password: formData.password });
        if (error) throw new Error('Erro ao atualizar a senha. O link pode ter expirado.');
        
        setSuccessMsg('Senha atualizada com sucesso! Redirecionando...');
        setTimeout(() => { window.location.assign('/conta'); }, 1500);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) throw new Error('Formato de e-mail inválido.');

      if (isLogin) {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error || !authData.user) throw new Error('E-mail ou senha incorretos.');
        if (await needsSecondFactor()) return;
        
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', authData.user.id).single();
        
        await syncCartForUser(authData.user.id);

        setSuccessMsg('Acesso confirmado! Redirecionando...');
        
        const hasSavedCart = useCartStore.getState().items.length > 0;
        if (profile?.role === 'admin') {
          window.location.assign('/admin');
        } else if (hasSavedCart) {
          window.location.assign('/lista'); 
        } else {
          window.location.assign('/'); 
        }

      } else {
        const passwordError = getPasswordValidationError(formData.password);
        if (passwordError) throw new Error(passwordError);
        if (formData.nome.trim().length < 3) throw new Error('Insira o seu nome completo.');

        const settingsToSave = serializeA11yPreferences(useAccessibilityStore.getState());

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              nome: formData.nome,
              accessibility_settings: settingsToSave,
              carrinho: useCartStore.getState().ownerId === null ? useCartStore.getState().items : [],
            },
          },
        });

        if (signUpError) throw new Error(signUpError.message);
        if (!authData.user) throw new Error('Erro ao criar conta no servidor.');

        if (!authData.session) {
          setSuccessMsg('Conta criada! Confirme seu e-mail para entrar.');
          setLoading(false);
          return;
        }

        await syncCartForUser(authData.user.id);
        setSuccessMsg('Conta criada com sucesso! Redirecionando...');
        
        setTimeout(() => {
          if (useCartStore.getState().items.length > 0) {
            window.location.assign('/lista'); 
          } else {
            window.location.assign('/'); 
          }
        }, 1000);
      }
    } catch (error: unknown) {
      setErrorMsg(getErrorMessage(error));
      setLoading(false);
    }
  };

  if (!isMounted) return <div className="h-screen w-full bg-[#FAFAFC]" />;

  return (
    <main className="h-[calc(100dvh-72px)] sm:h-[calc(100dvh-80px)] w-full flex flex-col lg:flex-row bg-[#FAFAFC] overflow-hidden">
      
      {/* LADO ESQUERDO: APRESENTAÇÃO E ACESSIBILIDADE */}
      <div className="relative hidden lg:flex flex-col lg:w-5/12 xl:w-1/2 bg-teal-950 p-8 lg:p-12 xl:p-16 shadow-2xl z-20 h-full overflow-y-auto no-scrollbar">
        
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes verticalFloat1 {
              0%, 100% { transform: translateY(-30px); }
              50% { transform: translateY(30px); }
            }
            @keyframes verticalFloat2 {
              0%, 100% { transform: translateY(30px); }
              50% { transform: translateY(-30px); }
            }
          `}} />
          <div className="absolute top-[15%] left-[10%] w-[200px] h-[200px] bg-teal-400/20 rounded-full blur-[80px]" style={{ animation: 'verticalFloat1 12s ease-in-out infinite' }}></div>
          <div className="absolute bottom-[20%] right-[10%] w-[250px] h-[250px] bg-cyan-400/10 rounded-full blur-[90px]" style={{ animation: 'verticalFloat2 15s ease-in-out infinite' }}></div>
        </div>

        <div className="relative z-10 flex flex-col w-full max-w-2xl mr-auto gap-8 xl:gap-10">
          
          <div className="flex items-center gap-4 sm:gap-5 w-full">
            <Link href="/" className="inline-flex items-center text-teal-100 hover:text-white font-bold text-[11px] uppercase tracking-wider transition-colors shrink-0">
              <ArrowLeft size={16} className="mr-2" />
              Voltar à Vitrine
            </Link>

            <div className="h-4 w-px bg-teal-600/50 hidden sm:block"></div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-teal-500/30 bg-teal-500/20 text-teal-200 text-[10px] font-bold tracking-widest uppercase shadow-sm shrink-0">
              <Award size={14} className="text-teal-400" />
              <span className="hidden sm:inline">Recursos de acessibilidade</span>
              <span className="sm:hidden">Acessível</span>
            </div>
          </div>
          
          <div>
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-black text-white leading-[1.05] tracking-tight mb-4 mt-0">
              Sua vitrine de<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-300">
                saúde e tecnologia.
              </span>
            </h1>
            
            <p className="text-teal-100/80 text-sm lg:text-[15px] font-medium leading-relaxed max-w-xl">
              Crie a sua conta para acessar o catálogo completo, montar seus pedidos e receber acompanhamento direto e humanizado, com recursos de acessibilidade e inclusão.
            </p>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-center gap-3 text-teal-50 text-sm font-medium">
              <CheckCircle2 size={18} className="text-teal-400 shrink-0" />
              <span>Acompanhamento consultivo especializado</span>
            </div>
            <div className="flex items-center gap-3 text-teal-50 text-sm font-medium">
              <CheckCircle2 size={18} className="text-teal-400 shrink-0" />
              <span>Gerenciamento de pedidos com total agilidade</span>
            </div>
            <div className="flex items-center gap-3 text-teal-50 text-sm font-medium">
              <CheckCircle2 size={18} className="text-teal-400 shrink-0" />
              <span>Rastreamento em tempo real das suas entregas</span>
            </div>
            <div className="flex items-center gap-3 text-teal-50 text-sm font-medium">
              <CheckCircle2 size={18} className="text-teal-400 shrink-0" />
              <span>Autenticação gerenciada com proteção de sessão</span>
            </div>
          </div>

          {/* Card de Acessibilidade */}
          <div className="relative bg-white/5 border border-white/10 rounded-lg p-5 xl:p-6 backdrop-blur-md shadow-2xl overflow-hidden group hover:bg-white/10 transition-colors duration-500 w-full max-w-lg">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl group-hover:bg-teal-500/30 transition-colors"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-teal-300 text-[11px] font-bold uppercase tracking-widest mb-4">
                <HeartHandshake size={18} className="text-teal-400" /> Boas práticas de acessibilidade
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-white/90 text-xs xl:text-[13px] font-medium">
                  <div className="w-1.5 h-1.5 rounded-sm bg-teal-400 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(45,212,191,0.8)]"></div>
                  <p>Perfis cognitivos para <strong>TDAH e Dislexia</strong>.</p>
                </div>
                <div className="flex items-start gap-3 text-white/90 text-xs xl:text-[13px] font-medium">
                  <div className="w-1.5 h-1.5 rounded-sm bg-teal-400 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(45,212,191,0.8)]"></div>
                  <p>Correção de cores nativa para <strong>Daltonismo</strong>.</p>
                </div>
                <div className="flex items-start gap-3 text-white/90 text-xs xl:text-[13px] font-medium">
                  <div className="w-1.5 h-1.5 rounded-sm bg-teal-400 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(45,212,191,0.8)]"></div>
                  <p><strong>Leitura em voz alta (TTS)</strong> para baixa visão.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* LADO DIREITO: FORMULÁRIO DE LOGIN/CADASTRO */}
      <div className="w-full lg:w-7/12 xl:w-1/2 h-full overflow-y-auto relative flex flex-col justify-start bg-[#FAFAFC] no-scrollbar">
        <div className="flex-1 flex flex-col items-center p-4 py-6 sm:py-8 relative z-10 w-full">
          
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm m-auto">
            
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-teal-50 border border-teal-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Fingerprint size={32} strokeWidth={1.5} className="text-teal-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
                {isRecovery ? 'Redefinir Senha' : isLogin ? 'Acessar Conta' : 'Criar Conta'}
              </h2>
            </div>

            {errorMsg && (
              <div className="bg-red-50 text-red-600 text-xs sm:text-sm p-3 rounded-md mb-5 border border-red-100 text-center font-bold">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="bg-teal-50 text-teal-700 text-xs sm:text-sm p-3 rounded-md mb-5 border border-teal-100 text-center font-bold flex items-center justify-center gap-2">
                {successMsg.includes('Redirecionando') && <Loader2 size={16} className="animate-spin" />}
                {successMsg}
              </div>
            )}

            {/* BOTÕES DE LOGIN SOCIAL INTEGRADOS AO LAYOUT ORIGINAL */}
            {!isRecovery && (
              <div className="flex flex-col gap-3 mb-6">
                <button 
                  onClick={() => handleOAuthLogin('google')}
                  disabled={!!oauthLoading || !OAUTH_PROVIDER_ENABLED.google}
                  title={OAUTH_PROVIDER_ENABLED.google ? 'Entrar com Google' : 'Google ainda não configurado'}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {oauthLoading === 'google' ? <Loader2 size={18} className="animate-spin text-slate-400" /> : (
                    <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  <span className="text-[13px]">{isLogin ? 'Entrar com Google' : 'Cadastrar com Google'}</span>
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleOAuthLogin('facebook')}
                    disabled={!!oauthLoading || !OAUTH_PROVIDER_ENABLED.facebook}
                    title={OAUTH_PROVIDER_ENABLED.facebook ? 'Entrar com Facebook' : 'Facebook ainda não configurado'}
                    className="flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {oauthLoading === 'facebook' ? <Loader2 size={18} className="animate-spin" /> : (
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    )}
                    <span className="text-xs">Facebook</span>
                  </button>
                  <button 
                    onClick={() => handleOAuthLogin('azure')}
                    disabled={!!oauthLoading || !OAUTH_PROVIDER_ENABLED.azure}
                    title={OAUTH_PROVIDER_ENABLED.azure ? 'Entrar com Microsoft' : 'Microsoft ainda não configurado'}
                    className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {oauthLoading === 'azure' ? <Loader2 size={18} className="animate-spin text-slate-400" /> : (
                      <svg viewBox="0 0 21 21" width="14" height="14">
                        <rect x="1" y="1" width="9" height="9" fill="#f25022"/><rect x="11" y="1" width="9" height="9" fill="#7fba00"/><rect x="1" y="11" width="9" height="9" fill="#00a4ef"/><rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                      </svg>
                    )}
                    <span className="text-xs">Microsoft</span>
                  </button>
                </div>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="shrink-0 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ou com E-mail</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {!isRecovery && (
                <>
                  {!isLogin && (
                    <div className="animate-in fade-in duration-300 space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">Nome Completo</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User size={16} className="text-slate-400" />
                          </div>
                          <input
                            type="text" name="nome" value={formData.nome} onChange={handleChange} required={!isLogin} autoComplete="name"
                            className="w-full pl-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all placeholder:text-slate-400"
                            placeholder="Como devemos chamá-lo(a)?"
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
                        type="email" name="email" value={formData.email} onChange={handleChange} required autoComplete="email"
                        className="w-full pl-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all placeholder:text-slate-400"
                        placeholder="seu.email@dominio.com"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="animate-in fade-in duration-300">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">
                  {isRecovery ? 'Sua Nova Senha' : 'Senha'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={16} className="text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} required autoComplete={isLogin && !isRecovery ? 'current-password' : 'new-password'}
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all placeholder:text-slate-400"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-teal-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {isLogin && !isRecovery && (
                <div className="flex justify-end pt-1">
                  <button type="button" onClick={handleResetPassword} className="text-[11px] font-bold text-teal-600 hover:text-teal-800 transition-colors cursor-pointer">
                    Esqueceu a senha?
                  </button>
                </div>
              )}

              <button
                type="submit" disabled={loading || !!oauthLoading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <>{isRecovery ? 'Salvar Nova Senha' : isLogin ? 'Entrar com E-mail' : 'Criar minha conta'} <ArrowRight size={16} className="ml-2" /></>}
              </button>
            </form>

            {!isRecovery && (
              <div className="mt-6 text-center pt-6 border-t border-slate-100">
                <p className="text-xs text-slate-500 font-medium">
                  {isLogin ? "Ainda não tem uma conta?" : "Já possui uma conta?"}
                </p>
                <button
                  type="button" onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-teal-600 font-black hover:text-teal-800 transition-colors mt-2 uppercase text-[11px] tracking-wider cursor-pointer"
                >
                  {isLogin ? 'Criar nova conta com e-mail' : 'Fazer login com e-mail'}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}
