'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, ShieldCheck, Key, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AccountSecurity from '@/components/AccountSecurity';
import { getPasswordValidationError } from '@/lib/auth';

export default function SegurancaPage() {
  const [saving, setSaving] = useState(false);
  const [passwords, setPasswords] = useState({
    atual: '',
    nova: '',
    confirmar: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwords.atual) {
      toast.error('Informe a senha atual.');
      return;
    }
    const passwordError = getPasswordValidationError(passwords.nova);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }
    if (passwords.nova !== passwords.confirmar) {
      toast.error('As senhas não coincidem.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        current_password: passwords.atual,
        password: passwords.nova
      });

      if (error) throw error;

      toast.success('Senha atualizada com segurança!');
      setPasswords({ atual: '', nova: '', confirmar: '' });
      
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar a senha.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFAFC] text-slate-900 relative overflow-hidden flex flex-col">
      <section className="max-w-[1800px] w-full mx-auto px-5 sm:px-10 lg:px-16 pt-8 sm:pt-10 pb-24 relative z-10">
        
        {/* CABEÇALHO PADRONIZADO E ALINHADO */}
        <div className="mb-8 pb-5 border-b border-slate-200/60">
          <Link href="/conta" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-teal-600 mb-5 transition-colors uppercase tracking-widest">
            <ArrowLeft size={12} /> Voltar para o Painel
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-teal-600 w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.5} />
            Central de Segurança
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">
            Gerencie suas credenciais, monitore acessos e proteja sua conta na Ozonteck.
          </p>
        </div>

        {/* GRID PRINCIPAL: 12 Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-slate-900 text-white rounded-xl p-8 shadow-sm border border-slate-800">
              <div className="w-12 h-12 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-6">
                <ShieldCheck size={24} strokeWidth={2} />
              </div>
              
              <h3 className="text-xl font-bold mb-3 tracking-tight">Blindagem Ozonteck</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                A conta utiliza autenticação gerenciada e controles de acesso no banco. Nenhum sistema é imune a riscos, por isso os controles são revisados continuamente.
              </p>

              <div className="space-y-4 pt-6 border-t border-slate-800">
                <div className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 size={18} className="text-teal-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-100 block mb-0.5">Conexão Protegida</span>
                    <span className="text-xs text-slate-400">Dados transmitidos por HTTPS em produção.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 size={18} className="text-teal-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-100 block mb-0.5">Controle de Acesso</span>
                    <span className="text-xs text-slate-400">Dados pessoais protegidos por políticas de acesso.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 size={18} className="text-teal-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-100 block mb-0.5">Privacidade</span>
                    <span className="text-xs text-slate-400">Coleta limitada aos dados necessários para a operação.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Senha Atual</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock size={16} className="text-slate-400" />
                      </div>
                      <input
                        type="password"
                        name="atual"
                        value={passwords.atual}
                        onChange={handleChange}
                        autoComplete="current-password"
                        required
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all shadow-sm placeholder:text-slate-400 text-slate-800"
                      />
                    </div>
                  </div>

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
                        placeholder="Mínimo de 8 caracteres"
                        autoComplete="new-password"
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
                        autoComplete="new-password"
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

            <AccountSecurity />

          </div>
        </div>
      </section>
    </main>
  );
}
