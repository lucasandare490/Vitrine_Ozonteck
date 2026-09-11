'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, User, ArrowRight, Loader2, X, Phone, CreditCard, MapPin, ShieldCheck, Info } from 'lucide-react';
import toast from 'react-hot-toast';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  message?: string;
}

export default function LoginModal({ isOpen, onClose, onSuccess, message }: LoginModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '', email: '', password: '', telefone: '', cpf: '', cep: '', endereco: ''
  });

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setIsLogin(true), 300);
      setFormData({ nome: '', email: '', password: '', telefone: '', cpf: '', cep: '', endereco: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    if (name === 'email') value = value.toLowerCase().trim();
    if (name === 'cpf') value = value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14);
    if (name === 'telefone') value = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4,5})(\d{4})/, '$1-$2').slice(0, 15);
    if (name === 'cep') value = value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) throw new Error('Formato de e-mail inválido.');

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw new Error('E-mail ou senha incorretos.');
        
        toast.success('Acesso confirmado!');
        onSuccess();

      } else {
        if (formData.password.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.');
        if (formData.nome.trim().length < 3) throw new Error('Insira o seu nome completo.');
        if (!formData.telefone || !formData.cpf || !formData.cep || !formData.endereco) {
          throw new Error('Preencha todos os campos do endereço.');
        }

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { data: { nome: formData.nome } }
        });

        if (signUpError) throw new Error(signUpError.message);
        if (!authData.user) throw new Error('Erro ao criar conta.');

        const { error: profileError } = await supabase.from("profiles").upsert({
            id: authData.user.id,
            nome: formData.nome,
            email: formData.email,
            telefone: formData.telefone,
            cpf: formData.cpf,
            cep: formData.cep,
            endereco_completo: formData.endereco,
            role: "cliente", 
          });

        if (profileError) throw new Error('Erro ao salvar os dados.');

        toast.success('Conta criada com sucesso!');
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white/90 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-200/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 border border-teal-100 rounded-xl flex items-center justify-center">
              <ShieldCheck size={20} className="text-teal-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none">
                {isLogin ? 'Acesso Rápido' : 'Criar Conta'}
              </h3>
              <p className="text-[10px] text-teal-600 font-bold tracking-widest uppercase mt-1">Ambiente Seguro</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto no-scrollbar">
          {message && (
            <div className="mb-6 bg-teal-50/80 border border-teal-100 p-3.5 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <Info size={20} className="text-teal-600 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-teal-800 font-medium leading-relaxed">{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="animate-in fade-in duration-300 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">Nome Completo</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User size={16} className="text-slate-400" /></div>
                    <input type="text" name="nome" value={formData.nome} onChange={handleChange} required={!isLogin} className="w-full pl-10 p-2.5 bg-white/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all placeholder:text-slate-400" placeholder="Seu nome" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">WhatsApp</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone size={16} className="text-slate-400" /></div>
                      <input type="text" name="telefone" value={formData.telefone} onChange={handleChange} required={!isLogin} className="w-full pl-10 p-2.5 bg-white/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all placeholder:text-slate-400" placeholder="(81) 99999-9999" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">CPF</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><CreditCard size={16} className="text-slate-400" /></div>
                      <input type="text" name="cpf" value={formData.cpf} onChange={handleChange} required={!isLogin} className="w-full pl-10 p-2.5 bg-white/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all placeholder:text-slate-400" placeholder="000.000.000-00" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">CEP</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MapPin size={16} className="text-slate-400" /></div>
                    <input type="text" name="cep" value={formData.cep} onChange={handleChange} onBlur={(e) => buscarCep(e.target.value)} required={!isLogin} className="w-full pl-10 p-2.5 bg-white/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all placeholder:text-slate-400" placeholder="00000-000" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">Endereço</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MapPin size={16} className="text-slate-400" /></div>
                    <input type="text" name="endereco" value={formData.endereco} onChange={handleChange} required={!isLogin} className="w-full pl-10 p-2.5 bg-white/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all placeholder:text-slate-400" placeholder="Logradouro, número, bairro..." />
                  </div>
                </div>
              </div>
            )}

            <div className={!isLogin ? "pt-1" : ""}>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={16} className="text-slate-400" />
                </div>
                <input
                  type="email" name="email" value={formData.email} onChange={handleChange} required
                  className="w-full pl-10 p-2.5 bg-white/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all placeholder:text-slate-400"
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
                  type="password" name="password" value={formData.password} onChange={handleChange} required
                  className="w-full pl-10 p-2.5 bg-white/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all placeholder:text-slate-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center mt-6 disabled:opacity-70">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <>{isLogin ? 'Entrar e Continuar' : 'Criar Conta e Continuar'} <ArrowRight size={16} className="ml-2" /></>}
            </button>
          </form>

          <div className="mt-6 text-center pt-5 border-t border-slate-100">
            <p className="text-xs text-slate-500 font-medium">{isLogin ? "Primeira vez na loja?" : "Já tem cadastro?"}</p>
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-teal-600 font-black hover:text-teal-800 transition-colors mt-1.5 uppercase text-[10px] tracking-widest">
              {isLogin ? 'Criar uma conta' : 'Fazer login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}