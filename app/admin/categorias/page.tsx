'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Tag, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

type Categoria = {
  id: string;
  name: string;
  created_at: string;
};

export default function CategoriasAdmin() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchCategorias = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('categorias')
      .select('id, name, created_at')
      .order('name', { ascending: true });
    if (error) {
      toast.error(`Erro ao carregar categorias: ${error.message}`);
    } else {
      setCategorias(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchCategorias(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleAddCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaCategoria.trim()) return;
    setIsSaving(true);

    try {
      const { error } = await supabase.from('categorias').insert([{ name: novaCategoria.trim() }]);
      if (error) throw error;

      toast.success('Categoria cadastrada com sucesso!');
      setNovaCategoria('');
      fetchCategorias();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Não foi possível adicionar a categoria.';
      toast.error(`Erro: ${message.includes('duplicate') ? 'Essa categoria já existe!' : message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategoria = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a categoria "${name}"?`)) return;

    try {
      const { error } = await supabase.from('categorias').delete().eq('id', id);
      if (error) throw error;

      toast.success('Categoria excluída!');
      fetchCategorias();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Não foi possível excluir a categoria.';
      toast.error(`Erro ao excluir: ${message}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#171717] p-6 rounded-2xl border border-slate-200 dark:border-[#2D2D2D] shadow-sm dark:shadow-none transition-colors">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-[#F0F0F0] flex items-center gap-2">
            <Tag className="text-teal-600 dark:text-teal-500" /> Gestão de Categorias
          </h1>
          <p className="text-slate-500 dark:text-[#A1A1AA] mt-1 text-xs font-medium">Cadastre e organize as categorias dos produtos da vitrine.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="bg-white dark:bg-[#171717] p-6 rounded-2xl border border-slate-200 dark:border-[#2D2D2D] shadow-sm h-fit space-y-4 transition-colors">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-[#F0F0F0]">Nova Categoria</h2>
          <form onSubmit={handleAddCategoria} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-[#A1A1AA] uppercase tracking-widest mb-1">Nome da Categoria</label>
              <input 
                type="text" 
                value={novaCategoria} 
                onChange={(e) => setNovaCategoria(e.target.value)} 
                placeholder="Ex: Óleos Ozonizados..." 
                required
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#202020] border border-slate-200 dark:border-[#2D2D2D] rounded-xl text-sm font-medium text-slate-900 dark:text-[#F0F0F0] focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-colors" 
              />
            </div>
            <button 
              type="submit" 
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-500/20 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Adicionar Categoria
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#2D2D2D] rounded-2xl flex flex-col shadow-sm dark:shadow-none overflow-hidden transition-colors">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-[#2D2D2D] bg-slate-50/50 dark:bg-transparent">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-[#F0F0F0]">Categorias Cadastradas</h2>
          </div>
          <div className="overflow-x-auto min-h-[300px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-[#A1A1AA]">
                <Loader2 size={32} className="animate-spin mb-4 text-teal-500" />
                <p className="text-xs font-bold uppercase tracking-widest">Carregando categorias...</p>
              </div>
            ) : categorias.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                <AlertCircle size={32} className="text-slate-300 dark:text-[#2D2D2D] mb-2" />
                <p className="text-sm font-bold text-slate-400 dark:text-[#A1A1AA] uppercase tracking-widest">Nenhuma categoria cadastrada.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-[#202020] border-b border-slate-200 dark:border-[#2D2D2D] text-slate-500 dark:text-[#A1A1AA]">
                  <tr>
                    <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Nome</th>
                    <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#2D2D2D]">
                  {categorias.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-[#262626] transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-[#F0F0F0] text-xs">{cat.name}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteCategoria(cat.id, cat.name)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors text-[10px] font-bold uppercase tracking-widest cursor-pointer"
                        >
                          <Trash2 size={12} /> Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
