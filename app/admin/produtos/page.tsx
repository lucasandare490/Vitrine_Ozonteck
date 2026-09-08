'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Package, Plus, Search, Edit, Trash2, Image as ImageIcon, Loader2, AlertCircle, Filter, ArchiveRestore, ArchiveX, UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProdutosAdmin() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]); // Novo estado para as categorias oficiais
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const [viewMode, setViewMode] = useState<'ativos' | 'lixeira'>('ativos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    price: '',
    estoque: '',
    image_url: '',
    category: ''
  });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
    type: 'soft' | 'hard' | null;
  }>({ isOpen: false, id: '', name: '', type: null });

  // Busca PRODUTOS e CATEGORIAS oficiais ao mesmo tempo
  const fetchData = async () => {
    setLoading(true);
    
    const [resProdutos, resCategorias] = await Promise.all([
      supabase.from('produtos').select('*').order('created_at', { ascending: false }),
      supabase.from('categorias').select('name').order('name', { ascending: true })
    ]);

    if (resProdutos.error) toast.error(`Erro produtos: ${resProdutos.error.message}`);
    else setProdutos(resProdutos.data || []);

    if (resCategorias.error) toast.error(`Erro categorias: ${resCategorias.error.message}`);
    else setCategorias(resCategorias.data || []);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const baseProducts = viewMode === 'ativos' 
    ? produtos.filter(p => p.is_deleted !== true) 
    : produtos.filter(p => p.is_deleted === true); 

  const produtosFiltrados = baseProducts.filter(produto => {
    const matchBusca = (produto.name?.toLowerCase().includes(searchTerm.toLowerCase()) || produto.code?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCategoria = selectedCategory === 'Todas' ? true : produto.category === selectedCategory;
    return matchBusca && matchCategoria;
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ code: '', name: '', description: '', price: '', estoque: '', image_url: '', category: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (produto: any) => {
    setEditingId(produto.id); 
    setFormData({
      code: produto.code || '',
      name: produto.name || '',
      description: produto.description || '',
      price: produto.price?.toString() || '',
      estoque: produto.estoque?.toString() || '',
      image_url: produto.image_url || '',
      category: produto.category || ''
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setIsUploadingImage(true);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage.from('produtos').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('produtos').getPublicUrl(fileName);
      
      setFormData({ ...formData, image_url: publicUrl });
      toast.success('Imagem carregada com sucesso!');
    } catch (error: any) {
      toast.error(`Erro ao enviar imagem: ${error.message}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const precoFormatado = parseFloat(formData.price.toString().replace(',', '.'));
      const estoqueFormatado = parseInt(formData.estoque.toString()) || 0;

      if (isNaN(precoFormatado)) throw new Error("Formato de preço inválido.");

      const payload = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        price: precoFormatado,
        estoque: estoqueFormatado,
        image_url: formData.image_url,
        category: formData.category,
      };

      let dbError;

      if (editingId) {
        const { error } = await supabase.from('produtos').update(payload).eq('id', editingId);
        dbError = error;
      } else {
        const { error } = await supabase.from('produtos').insert([{ ...payload, is_deleted: false }]);
        dbError = error;
      }

      if (dbError) throw dbError;

      toast.success(editingId ? 'Produto atualizado!' : 'Produto cadastrado!');
      setIsModalOpen(false);
      fetchData(); 

    } catch (error: any) {
      toast.error(`Falha no Banco: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const triggerSoftDelete = (id: string, name: string) => setDeleteModal({ isOpen: true, id, name, type: 'soft' });
  const triggerHardDelete = (id: string, name: string) => setDeleteModal({ isOpen: true, id, name, type: 'hard' });

  const confirmDeleteAction = async () => {
    const { id, type } = deleteModal;
    setDeleteModal({ isOpen: false, id: '', name: '', type: null });

    if (type === 'soft') {
      try {
        const { error } = await supabase.from('produtos').update({ is_deleted: true }).eq('id', id);
        if (error) throw error;
        toast.success('Produto movido para a Lixeira.');
        fetchData();
      } catch (error: any) { toast.error(`Falha ao excluir: ${error.message}`); }
    } else if (type === 'hard') {
      try {
        const { error } = await supabase.from('produtos').delete().eq('id', id);
        if (error) throw error;
        toast.success('Produto excluído para sempre.');
        fetchData();
      } catch (error: any) { toast.error(`Falha ao excluir permanentemente: ${error.message}`); }
    }
  };

  const handleRestore = async (id: string, name: string) => {
    try {
      const { error } = await supabase.from('produtos').update({ is_deleted: false }).eq('id', id);
      if (error) throw error;
      toast.success(`"${name}" foi restaurado para a vitrine!`);
      fetchData();
    } catch (error: any) { toast.error(`Falha ao restaurar: ${error.message}`); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0f0f11] p-6 rounded-2xl border border-slate-200 dark:border-zinc-800/60 shadow-sm dark:shadow-none">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="text-teal-600 dark:text-teal-500" /> Catálogo e Estoque
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 mt-1 text-xs font-medium">Gerencie os produtos visíveis na vitrine e o estoque atual.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-500/20 cursor-pointer"
        >
          <Plus size={16} /> Cadastrar Produto
        </button>
      </div>

      <div className="bg-white dark:bg-[#0f0f11] border border-slate-200 dark:border-zinc-800/60 rounded-2xl flex flex-col shadow-sm dark:shadow-none overflow-hidden">
        
        <div className="flex items-center gap-6 px-6 pt-4 border-b border-slate-200 dark:border-zinc-800/60 bg-slate-50/30 dark:bg-transparent">
          <button 
            onClick={() => setViewMode('ativos')} 
            className={`pb-3 text-xs sm:text-sm font-black uppercase tracking-widest border-b-2 transition-colors flex items-center gap-2 ${viewMode === 'ativos' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Package size={16} /> Vitrine Ativa ({produtos.filter(p => p.is_deleted !== true).length})
          </button>
          <button 
            onClick={() => setViewMode('lixeira')} 
            className={`pb-3 text-xs sm:text-sm font-black uppercase tracking-widest border-b-2 transition-colors flex items-center gap-2 ${viewMode === 'lixeira' ? 'border-red-500 text-red-600 dark:text-red-500' : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Trash2 size={16} /> Lixeira ({produtos.filter(p => p.is_deleted === true).length})
          </button>
        </div>

        <div className="p-4 border-b border-slate-200 dark:border-zinc-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-transparent">
          <div className="relative w-full md:w-96">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código ou nome..." 
              className="pl-10 pr-4 py-2 text-sm font-medium border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white w-full transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600" 
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter size={16} className="text-slate-400 dark:text-zinc-500 hidden sm:block" />
            {/* O Filtro agora puxa da tabela oficial de Categorias */}
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full md:w-auto px-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-slate-700 dark:text-zinc-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 cursor-pointer"
            >
              <option value="Todas">Todas as Categorias</option>
              {categorias.map((cat, idx) => (
                <option key={idx} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-zinc-600">
              <Loader2 size={32} className="animate-spin mb-4 text-teal-500" />
              <p className="text-xs font-bold uppercase tracking-widest">Sincronizando banco de dados...</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800/60 text-slate-500 dark:text-zinc-400">
                <tr>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Produto</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Código (SKU)</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Preço</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Estoque</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                {produtosFiltrados.map((produto) => (
                  <tr key={produto.id} className={`hover:bg-slate-50 dark:hover:bg-zinc-800/20 transition-colors group ${viewMode === 'lixeira' ? 'opacity-75 grayscale hover:grayscale-0' : ''}`}>
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                        {produto.image_url ? <img src={produto.image_url} alt={produto.name} className="w-full h-full object-cover" /> : <ImageIcon size={16} className="text-slate-400" />}
                      </div>
                      <div>
                        <p className={`font-bold text-xs truncate max-w-[250px] ${viewMode === 'lixeira' ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>{produto.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-semibold mt-0.5">{produto.category || 'Sem Categoria'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-[11px] font-bold text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-md border border-slate-200 dark:border-zinc-700">{produto.code}</span>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900 dark:text-white text-xs">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.price || 0)}
                    </td>
                    <td className="px-6 py-4">
                      {viewMode === 'ativos' ? (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border
                          ${produto.estoque > 10 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' 
                          : produto.estoque > 0 ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                          : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${produto.estoque > 10 ? 'bg-emerald-500' : produto.estoque > 0 ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                          {produto.estoque} un
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Excluído</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {viewMode === 'ativos' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleOpenEdit(produto)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-teal-100 dark:hover:bg-teal-500/20 text-slate-700 dark:text-zinc-300 hover:text-teal-700 dark:hover:text-teal-400 transition-colors text-[10px] font-bold uppercase tracking-widest cursor-pointer">
                            <Edit size={12} /> Editar
                          </button>
                          <button onClick={() => triggerSoftDelete(produto.id, produto.name)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors text-[10px] font-bold uppercase tracking-widest cursor-pointer">
                            <Trash2 size={12} /> Excluir
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleRestore(produto.id, produto.name)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 transition-colors text-[10px] font-bold uppercase tracking-widest cursor-pointer border border-emerald-200 dark:border-emerald-500/20">
                            <ArchiveRestore size={12} /> Restaurar
                          </button>
                          <button onClick={() => triggerHardDelete(produto.id, produto.name)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-red-600 hover:text-white text-slate-500 dark:text-zinc-400 transition-colors text-[10px] font-bold uppercase tracking-widest cursor-pointer">
                            <ArchiveX size={12} /> Apagar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {produtosFiltrados.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <AlertCircle size={40} className="mx-auto mb-4 text-slate-300 dark:text-zinc-700" />
                      <p className="text-sm font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                        {viewMode === 'lixeira' ? 'A lixeira está vazia.' : 'Nenhum produto ativo encontrado.'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0f0f11] w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/30 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                {editingId ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors font-bold text-xl cursor-pointer">&times;</button>
            </div>

            <div className="p-6 overflow-y-auto scrollbar-thin">
              <form id="productForm" onSubmit={handleSave} className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1">CÓDIGO DO PRODUTO (REF)</label>
                    <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50" placeholder="Ex: OZO-123" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Nome do Produto</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50" placeholder="Óleo de Girassol Ozonizado..." />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Preço (R$)</label>
                    <input type="text" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50" placeholder="99,90" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Estoque</label>
                    <input type="number" value={formData.estoque} onChange={e => setFormData({...formData, estoque: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50" placeholder="50" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Categoria</label>
                    {/* Alterado para um Select que puxa da base oficial */}
                    <select 
                      value={formData.category} 
                      onChange={e => setFormData({...formData, category: e.target.value})} 
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 cursor-pointer"
                    >
                      <option value="" disabled>Selecione...</option>
                      {categorias.map((cat, idx) => (
                        <option key={idx} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Imagem do Produto</label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer overflow-hidden min-h-[140px]
                      ${isDragging ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-500/10' : 'border-slate-300 dark:border-zinc-700 hover:border-teal-400 dark:hover:border-teal-500 bg-slate-50 dark:bg-zinc-900/50'}`}
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    <input type="file" id="image-upload" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }} disabled={isUploadingImage} />

                    {isUploadingImage ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="animate-spin text-teal-500 mb-2" size={32} />
                        <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Enviando imagem...</span>
                      </div>
                    ) : formData.image_url ? (
                      <div className="relative w-full h-32 flex items-center justify-center group">
                        <img src={formData.image_url} alt="Preview" className="max-h-full max-w-full object-contain rounded-lg" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                          <span className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2"><UploadCloud size={16}/> Trocar Imagem</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-slate-400 dark:text-zinc-500">
                        <UploadCloud size={32} className="mb-3 text-slate-300 dark:text-zinc-600" />
                        <p className="text-sm font-bold text-slate-600 dark:text-zinc-300">Clique ou arraste a imagem aqui</p>
                        <p className="text-[10px] mt-1 font-medium uppercase tracking-widest opacity-70">Suporta PNG, JPG ou WEBP</p>
                      </div>
                    )}
                  </div>
                </div>

              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/30 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                Cancelar
              </button>
              <button form="productForm" type="submit" disabled={isSaving || isUploadingImage} className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-500/20 disabled:opacity-50 cursor-pointer">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
                {editingId ? 'Salvar Alterações' : 'Finalizar Cadastro'}
              </button>
            </div>

          </div>
        </div>
      )}

      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0f0f11] w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col">
            <div className="p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-5 border border-red-100 dark:border-red-500/20">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
                {deleteModal.type === 'soft' ? 'Mover para a Lixeira?' : 'Excluir Definitivamente?'}
              </h3>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 leading-relaxed">
                {deleteModal.type === 'soft' 
                  ? `O produto "${deleteModal.name}" será removido da loja, mas poderá ser restaurado pela aba Lixeira.` 
                  : `Tem certeza que deseja apagar "${deleteModal.name}" para sempre? Esta ação não tem volta.`}
              </p>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/30 flex gap-3">
              <button 
                onClick={() => setDeleteModal({ isOpen: false, id: '', name: '', type: null })} 
                className="flex-1 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDeleteAction} 
                className="flex-1 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-md shadow-red-500/20 cursor-pointer"
              >
                {deleteModal.type === 'soft' ? 'Mover p/ Lixeira' : 'Sim, Excluir Tudo'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}