'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, Key, Lock, Loader2, CheckCircle2, Smartphone, Monitor, ShieldAlert, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

// Fundo padronizado da marca mantido
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

export default function SegurancaPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [passwords, setPasswords] = useState({
    nova: '',
    confirmar: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwords.nova.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (passwords.nova !== passwords.confirmar) {
      toast.error('As senhas não coincidem.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.nova
      });

      if (error) throw error;

      toast.success('Senha atualizada com segurança!');
      setPasswords({ nova: '', confirmar: '' });
      
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar a senha.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen text-slate-900 relative overflow-hidden flex flex-col">
      <OzoneBackground />

      <section className="max-w-[1800px] w-full mx-auto px-5 sm:px-10 lg:px-16 pt-8 sm:pt-10 pb-24 relative z-10">
        
        {/* CABEÇALHO PADRONIZADO E ALINHADO */}
        <div className="mb-8 pb-5 border-b border-slate-200/60">
          <Link href="/conta" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-teal-600 mb-5 transition-colors uppercase tracking-widest">
            <ArrowLeft size={12} /> Voltar para o Painel
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-teal-600 w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.5} />
            Central de Segurança
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">
            Gerencie suas credenciais, monitore acessos e proteja sua conta na Ozonteck.
          </p>
        </div>

        {/* GRID PRINCIPAL: 12 Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUNA ESQUERDA: Resumo e Confiança */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-slate-900 text-white rounded-xl p-8 shadow-sm border border-slate-800">
              <div className="w-12 h-12 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-6">
                <ShieldCheck size={24} strokeWidth={2} />
              </div>
              
              <h3 className="text-xl font-bold mb-3 tracking-tight">Blindagem Ozonteck</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                Nossa infraestrutura utiliza os mais altos padrões do mercado para garantir que seus dados de pagamento e informações pessoais estejam sempre protegidos.
              </p>

              <div className="space-y-4 pt-6 border-t border-slate-800">
                <div className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 size={18} className="text-teal-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-100 block mb-0.5">Criptografia de Ponta</span>
                    <span className="text-xs text-slate-400">Dados protegidos com AES-256.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 size={18} className="text-teal-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-100 block mb-0.5">Ambiente Seguro (SSL)</span>
                    <span className="text-xs text-slate-400">Certificação de segurança internacional.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 size={18} className="text-teal-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-100 block mb-0.5">Conformidade LGPD</span>
                    <span className="text-xs text-slate-400">Total controle sobre seus dados.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: Área de Ação */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* BLOCO 1: ALTERAR SENHA (Ativo e Funcional) */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <Key className="text-slate-400" size={20} />
                <div>
                  <h2 className="text-base font-bold text-slate-900">Senha de Acesso</h2>
                  <p className="text-xs text-slate-500 mt-0.5">É recomendável utilizar uma senha forte e não repeti-la em outros sites.</p>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <form onSubmit={handleUpdatePassword} className="flex flex-col gap-5 max-w-xl">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Nova Senha</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock size={16} className="text-slate-400" />
                      </div>
                      <input 
                        type="password" 
                        name="nova"
                        value={passwords.nova}
                        onChange={handleChange}
                        placeholder="Mínimo de 6 caracteres"
                        required
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all shadow-sm placeholder:text-slate-400 text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Confirmar Nova Senha</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock size={16} className="text-slate-400" />
                      </div>
                      <input 
                        type="password" 
                        name="confirmar"
                        value={passwords.confirmar}
                        onChange={handleChange}
                        placeholder="Repita a nova senha"
                        required
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all shadow-sm placeholder:text-slate-400 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="mt-2">
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-2.5 px-6 rounded-lg transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                      {saving ? 'Atualizando...' : 'Atualizar Senha'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* CONTAINER BLOQUEADO: FEATURE TEASERS (Em Desenvolvimento) */}
            <div className="relative">
              
              {/* O overlay de embaçamento e o selo de "Em Desenvolvimento" */}
              <div className="absolute inset-0 z-20 bg-white/40 backdrop-blur-[3px] rounded-xl flex flex-col items-center justify-center border border-white/50">
                <div className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
                  <ShieldAlert size={16} className="text-teal-400" />
                  Em Desenvolvimento
                </div>
                <p className="text-slate-800 text-sm mt-3 font-semibold text-center px-4 max-w-sm drop-shadow-sm">
                  Estes recursos avançados de segurança estarão disponíveis em nossa próxima atualização.
                </p>
              </div>

              {/* O conteúdo por baixo, levemente apagado e não clicável */}
              <div className="flex flex-col gap-6 pointer-events-none select-none opacity-60 grayscale-[20%]">
                
                {/* BLOCO 2: 2FA MOCK */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldAlert className="text-teal-600" size={20} />
                      <h2 className="text-base font-bold text-slate-900">Autenticação em Duas Etapas (2FA)</h2>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 max-w-xl">
                      Adiciona uma camada extra de segurança. Sempre que você fizer login, enviaremos um código de verificação para o seu e-mail.
                    </p>
                  </div>
                  <div className="shrink-0">
                    <ToggleRight size={44} className="text-teal-500" strokeWidth={1.5} />
                  </div>
                </div>

                {/* BLOCO 3: SESSÕES MOCK */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <Monitor className="text-slate-400" size={20} />
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Sessões Ativas</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Gerencie os dispositivos que acessaram sua conta recentemente.</p>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center border border-teal-100">
                          <Monitor size={18} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            Windows Desktop 
                            <span className="bg-teal-100 text-teal-700 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">Sessão Atual</span>
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">Olinda, PE - Brasil • Ativo agora</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center border border-slate-200">
                          <Smartphone size={18} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Smartphone</h4>
                          <p className="text-xs text-slate-500 mt-0.5">São Paulo, SP - Brasil • Último acesso há 3 meses</p>
                        </div>
                      </div>
                      <button className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-md">
                        Desconectar
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}