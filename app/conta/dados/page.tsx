'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, User, Phone, CreditCard, Mail, Loader2, BadgeCheck, ShieldCheck, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { isValidCpf } from '@/lib/auth';

export default function MeusDadosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cpf: '',
    telefone: ''
  });

  useEffect(() => {
    const fetchDados = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');

      const { data } = await supabase
        .from('profiles')
        .select('nome, email, cpf, telefone')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setFormData({
          nome: data.nome || '',
          email: data.email || session.user.email || '',
          cpf: data.cpf || '',
          telefone: data.telefone || ''
        });
      }
      setLoading(false);
    };

    fetchDados();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    let { value } = e.target;
    if (name === 'cpf') {
      value = value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14);
    }
    if (name === 'telefone') {
      value = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4,5})(\d{4})/, '$1-$2').slice(0, 15);
    }
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nome.trim().length < 3) {
      toast.error('Informe seu nome completo.');
      return;
    }
    if (formData.cpf && !isValidCpf(formData.cpf)) {
      toast.error('Informe um CPF válido.');
      return;
    }
    if (formData.telefone && formData.telefone.replace(/\D/g, '').length < 10) {
      toast.error('Informe um telefone válido.');
      return;
    }
    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada.');

      const { error } = await supabase
        .from('profiles')
        .update({
          nome: formData.nome.trim(),
          cpf: formData.cpf || null,
          telefone: formData.telefone || null,
        })
        .eq('id', session.user.id);

      if (error) throw error;
      toast.success('Dados atualizados com sucesso!');
      
    } catch {
      toast.error('Erro ao salvar os dados.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
            <User className="text-teal-600 w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.5} />
            Meus Dados
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">
            Gerencie sua identidade, dados fiscais e preferências na Ozonteck.
          </p>
        </div>

        {/* GRADE DE 12 COLUNAS (GRID OFFSET) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* COLUNA ESQUERDA (Info e Status) */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6">
            
            {/* Status da Conta */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-500/20 border border-teal-500/30 text-teal-400 rounded-full flex items-center justify-center shrink-0">
                <User size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-white font-bold text-base">Cliente Ozonteck</h3>
                <div className="flex items-center gap-1.5 mt-1 text-teal-400">
                  <BadgeCheck size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Conta Verificada</span>
                </div>
              </div>
            </div>

            {/* Privacidade */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center mb-4">
                <ShieldCheck size={20} strokeWidth={2} />
              </div>
              <h3 className="text-base font-bold mb-2 tracking-tight text-slate-900">Privacidade Garantida</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-5">
                Seus dados pessoais e fiscais são processados sob sigilo e usados exclusivamente para faturamento e entrega.
              </p>
              <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                <Lock size={12} /> Criptografia Ativa (SSL)
              </div>
            </div>

          </div>

          {/* COLUNA DIREITA (Formulários e Teasers) */}
          <div className="lg:col-span-8 xl:col-span-7 xl:col-start-5 flex flex-col gap-6">
            
            {/* BLOCO 1: FORMULÁRIO DE DADOS (Funcional) */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Identidade e Contato</h2>
                <p className="text-sm text-slate-500 mt-1">Mantenha suas informações sempre atualizadas para não ter problemas nas entregas.</p>
              </div>

              <div className="p-6 sm:p-8">
                <form onSubmit={handleSave} className="flex flex-col gap-6">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* NOME COMPLETO */}
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                        Nome Completo
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <User size={16} className="text-slate-400" />
                        </div>
                        <input 
                          type="text" 
                          name="nome"
                          value={formData.nome}
                          onChange={handleChange}
                          required
                          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all shadow-sm placeholder:text-slate-400 text-slate-800"
                        />
                      </div>
                    </div>

                    {/* E-MAIL (Bloqueado) */}
                    <div className="col-span-1 sm:col-span-2">
                      <label className="flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                        <span>E-mail</span>
                        <span className="text-[9px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded font-bold">NÃO EDITÁVEL</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Mail size={16} className="text-slate-400" />
                        </div>
                        <input 
                          type="email" 
                          value={formData.email}
                          disabled
                          className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed shadow-sm"
                        />
                      </div>
                    </div>

                    {/* CPF */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                        CPF
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <CreditCard size={16} className="text-slate-400" />
                        </div>
                        <input 
                          type="text" 
                          name="cpf"
                          value={formData.cpf}
                          onChange={handleChange}
                          placeholder="000.000.000-00"
                          inputMode="numeric"
                          autoComplete="off"
                          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all shadow-sm placeholder:text-slate-400 text-slate-800"
                        />
                      </div>
                    </div>

                    {/* TELEFONE */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                        WhatsApp / Telefone
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Phone size={16} className="text-slate-400" />
                        </div>
                        <input 
                          type="tel" 
                          name="telefone"
                          value={formData.telefone}
                          onChange={handleChange}
                          placeholder="(00) 00000-0000"
                          inputMode="tel"
                          autoComplete="tel"
                          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all shadow-sm placeholder:text-slate-400 text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex justify-end pt-6 border-t border-slate-100">
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-2.5 px-6 rounded-lg transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  </div>
                  
                </form>
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
