'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Search, Loader2, AlertCircle, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CarteiraClientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchClientes = async () => {
    setLoading(true);
    // Busca na tabela profiles apenas quem tem a role 'cliente'
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'cliente')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(`Erro ao carregar clientes: ${error.message}`);
    } else {
      setClientes(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const clientesFiltrados = clientes.filter((cliente) => {
    const busca = searchTerm.toLowerCase();
    const nomeMatch = cliente.nome?.toLowerCase().includes(busca);
    const emailMatch = cliente.email?.toLowerCase().includes(busca);
    const telefoneMatch = cliente.telefone?.includes(busca);
    
    return nomeMatch || emailMatch || telefoneMatch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0f0f11] p-6 rounded-2xl border border-slate-200 dark:border-zinc-800/60 shadow-sm dark:shadow-none">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="text-teal-600 dark:text-teal-500" /> Carteira de Clientes
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 mt-1 text-xs font-medium">Faça a gestão dos clientes registados na sua loja.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0f0f11] border border-slate-200 dark:border-zinc-800/60 rounded-2xl flex flex-col shadow-sm dark:shadow-none overflow-hidden">
        
        {/* Barra de Pesquisa */}
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800/60 bg-slate-50/50 dark:bg-transparent">
          <div className="relative w-full md:w-96">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por nome, email ou telemóvel..." 
              className="pl-10 pr-4 py-2 text-sm font-medium border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white w-full transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600" 
            />
          </div>
        </div>

        {/* Grelha de Clientes */}
        <div className="p-6 min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-zinc-600">
              <Loader2 size={32} className="animate-spin mb-4 text-teal-500" />
              <p className="text-xs font-bold uppercase tracking-widest">A carregar a base de dados...</p>
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <AlertCircle size={32} className="text-slate-300 dark:text-zinc-700 mb-4" />
              <p className="text-sm font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Nenhum cliente encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {clientesFiltrados.map((cliente) => (
                <div key={cliente.id} className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/30 hover:border-teal-500/30 transition-colors group">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 flex items-center justify-center font-black text-lg shrink-0">
                      {cliente.nome ? cliente.nome.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-bold text-slate-900 dark:text-white truncate">{cliente.nome || 'Nome não definido'}</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5 flex items-center gap-1">
                        <Calendar size={10} /> Registado a {new Date(cliente.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-zinc-400">
                      <Mail size={14} className="text-slate-400" />
                      <span className="truncate">{cliente.email || 'Sem email'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-zinc-400">
                      <Phone size={14} className="text-slate-400" />
                      <span>{cliente.telefone || 'Sem telemóvel'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-zinc-400">
                      <MapPin size={14} className="text-slate-400 shrink-0" />
                      <span className="truncate">{cliente.endereco_completo || 'Sem morada registada'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}