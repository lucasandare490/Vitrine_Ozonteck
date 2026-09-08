'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, MapPin, Loader2, Home, Briefcase, Map, Building, AlertTriangle, Truck, Store, ShieldAlert, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

// Fundo padronizado da marca
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

export default function EnderecosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [enderecos, setEnderecos] = useState<any[]>([]);
  
  // Modais
  const [showModal, setShowModal] = useState(false);
  const [enderecoToDelete, setEnderecoToDelete] = useState<string | null>(null);
  
  // Loaders de ação
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [tipoEndereco, setTipoEndereco] = useState<'Casa' | 'Trabalho' | 'Outro'>('Casa');
  const [nomePersonalizado, setNomePersonalizado] = useState('');
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const [novoEnd, setNovoEnd] = useState({
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: ''
  });

  useEffect(() => {
    fetchEnderecos();
  }, []);

  const fetchEnderecos = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return router.push('/login');

    const { data } = await supabase
      .from('enderecos')
      .select('*')
      .eq('user_id', session.user.id)
      .order('principal', { ascending: false });

    if (data) setEnderecos(data);
    setLoading(false);
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    if (value.length > 5) value = value.replace(/^(\d{5})(\d)/, '$1-$2');
    
    setNovoEnd(prev => ({ ...prev, cep: value }));

    if (value.replace('-', '').length === 8) {
      setIsFetchingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${value.replace('-', '')}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setNovoEnd(prev => ({
            ...prev,
            rua: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            estado: data.uf || '' 
          }));
        }
      } catch (error) {
        toast.error("Não foi possível buscar o CEP.");
      } finally {
        setIsFetchingCep(false);
      }
    }
  };

  const handleAddEndereco = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoEnd.cep || !novoEnd.rua || !novoEnd.numero) {
      toast.error('Preencha os campos obrigatórios (CEP, Rua, Número).');
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada.');

      const isFirst = enderecos.length === 0;
      const apelidoFinal = tipoEndereco === 'Outro' ? (nomePersonalizado || 'Outro') : tipoEndereco;

      const { error } = await supabase.from('enderecos').insert({
        user_id: session.user.id,
        apelido: apelidoFinal,
        cep: novoEnd.cep,
        rua: novoEnd.rua,
        numero: novoEnd.numero,
        bairro: novoEnd.bairro,
        cidade: novoEnd.cidade,
        estado: novoEnd.estado,
        principal: isFirst ? true : false
      });

      if (error) throw error;

      toast.success('Endereço salvo com sucesso!');
      setShowModal(false);
      setNovoEnd({ cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' });
      setTipoEndereco('Casa');
      setNomePersonalizado('');
      fetchEnderecos();
    } catch (err: any) {
      toast.error('Erro ao adicionar endereço.');
    } finally {
      setSaving(false);
    }
  };

  const executeDelete = async () => {
    if (!enderecoToDelete) return;
    
    setIsDeleting(true);
    const { error } = await supabase.from('enderecos').delete().eq('id', enderecoToDelete);
    
    if (!error) {
      toast.success('Endereço removido.');
      fetchEnderecos();
    } else {
      toast.error('Erro ao remover o endereço.');
    }
    
    setIsDeleting(false);
    setEnderecoToDelete(null); 
  };

  const handleSetPrincipal = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from('enderecos').update({ principal: false }).eq('user_id', session.user.id);
    await supabase.from('enderecos').update({ principal: true }).eq('id', id);
    toast.success('Endereço principal atualizado!');
    fetchEnderecos();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFC]">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    );
  }

  return (
    <main className="min-h-screen text-slate-900 relative overflow-hidden flex flex-col">
      <OzoneBackground />

      {/* CONTAINER GLOBAL DE 1800px: Mantém a coerência das margens */}
      <section className="max-w-[1800px] w-full mx-auto px-5 sm:px-10 lg:px-16 pt-8 sm:pt-10 pb-24 relative z-10">
        
        {/* CABEÇALHO */}
        <div className="mb-8 pb-5 border-b border-slate-200/60">
          <Link href="/conta" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-teal-600 mb-5 transition-colors uppercase tracking-widest">
            <ArrowLeft size={12} /> Voltar para o Painel
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <MapPin className="text-teal-600 w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.5} />
                Meus Endereços
              </h1>
              <p className="text-slate-500 text-sm mt-1.5 font-medium">
                Gerencie seus locais de entrega e faturamento.
              </p>
            </div>
            
            {/* O botão principal de adicionar vai para o topo, um padrão de Web Design muito mais limpo */}
            <button 
              onClick={() => setShowModal(true)}
              className="hidden sm:flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-2.5 px-6 rounded-lg transition-colors shadow-sm"
            >
              <Plus size={16} /> Adicionar Endereço
            </button>
          </div>
        </div>

        {/* GRADE DE 12 COLUNAS (GRID OFFSET) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* COLUNA ESQUERDA: Contexto de Logística */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6">
            
            {/* Info de Entregas */}
            <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm border border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-5">
                <Truck size={20} strokeWidth={2} />
              </div>
              <h3 className="text-lg font-bold mb-2 tracking-tight">Logística Ozonteck</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                O endereço marcado como "Principal" será selecionado automaticamente na hora do seu Checkout. Mantenha os dados precisos para evitar devoluções.
              </p>
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center gap-2.5 text-xs font-medium text-slate-300">
                  <CheckCircle2 size={16} className="text-teal-500 shrink-0" />
                  Entrega Nacional Garantida
                </div>
                <div className="flex items-center gap-2.5 text-xs font-medium text-slate-300">
                  <CheckCircle2 size={16} className="text-teal-500 shrink-0" />
                  Rastreamento em Tempo Real
                </div>
              </div>
            </div>

            {/* FEATURE TEASER: Retirada em Loja */}
            <div className="relative bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="absolute inset-0 z-20 bg-slate-50/50 backdrop-blur-[2px] flex flex-col items-center justify-center">
                <div className="bg-white border border-slate-200 text-slate-800 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                  <ShieldAlert size={14} className="text-teal-600" />
                  Em Breve
                </div>
              </div>

              <div className="p-6 opacity-60 grayscale-[30%] select-none pointer-events-none">
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center mb-4">
                  <Store size={20} strokeWidth={2} />
                </div>
                <h3 className="text-base font-bold mb-2 tracking-tight text-slate-900">Pontos de Retirada</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Em breve você poderá selecionar pontos de coleta autorizados para retirar seus pedidos de forma mais rápida e com frete reduzido.
                </p>
              </div>
            </div>

          </div>

          {/* COLUNA DIREITA: Área de Cartões de Endereço (Limita o estiramento) */}
          <div className="lg:col-span-8 xl:col-span-8 xl:col-start-5">
            
            {enderecos.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-xl py-16 px-6 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <MapPin size={24} className="text-slate-300" strokeWidth={2} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhum endereço salvo</h3>
                <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
                  Você ainda não cadastrou nenhum local para entrega. Adicione seu primeiro endereço para facilitar suas futuras compras.
                </p>
                <button 
                  onClick={() => setShowModal(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-3 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Plus size={16} /> Cadastrar Endereço
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* O Cartão Dashed de "Adicionar" vira parte orgânica da grade no Desktop */}
                <button 
                  onClick={() => setShowModal(true)}
                  className="min-h-[240px] rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 hover:bg-teal-50/50 hover:border-teal-400 transition-all duration-300 flex flex-col items-center justify-center gap-4 group cursor-pointer"
                >
                  <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-400 group-hover:text-teal-600 group-hover:scale-110 transition-all duration-300">
                    <Plus size={24} />
                  </div>
                  <span className="font-bold text-sm text-slate-500 group-hover:text-teal-700 transition-colors">
                    Adicionar Novo Local
                  </span>
                </button>

                {enderecos.map((end) => (
                  <div key={end.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col relative overflow-hidden group hover:shadow-md hover:border-teal-200 transition-all min-h-[240px]">
                    
                    {end.principal && (
                      <div className="absolute top-0 left-0 w-full h-1 bg-teal-500"></div>
                    )}

                    <div className="flex justify-between items-start mb-4 mt-1">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${end.principal ? 'bg-teal-50 text-teal-600 border border-teal-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                          {end.apelido.toLowerCase().includes('trabalho') ? <Briefcase size={18} /> : end.apelido.toLowerCase().includes('casa') ? <Home size={18} /> : <Map size={18} />}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm tracking-tight">{end.apelido}</h3>
                          {end.principal && (
                            <span className="text-[9px] font-black uppercase tracking-widest text-teal-600 mt-0.5 block">
                              Padrão de Entrega
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 mt-2">
                      <p className="text-slate-800 font-semibold text-sm mb-1 line-clamp-1">
                        {end.rua}, {end.numero} {end.complemento && `- ${end.complemento}`}
                      </p>
                      <p className="text-slate-500 text-xs leading-relaxed mb-3">
                        {end.bairro}<br />
                        {end.cidade} - {end.estado}
                      </p>
                      <p className="text-slate-400 text-[11px] font-bold font-mono tracking-widest uppercase">CEP: {end.cep}</p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                      {!end.principal ? (
                        <button 
                          onClick={() => handleSetPrincipal(end.id)} 
                          className="text-[11px] font-bold text-slate-500 hover:text-teal-600 transition-colors uppercase tracking-wider"
                        >
                          Tornar Principal
                        </button>
                      ) : (
                        <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 cursor-default">
                          <CheckCircle2 size={14} /> Selecionado
                        </div>
                      )}

                      <button 
                        onClick={() => setEnderecoToDelete(end.id)} 
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Excluir Endereço"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
          </div>
        </div>

        {/* MODAL DE CADASTRO: Agora com design corporativo e estruturado */}
        {showModal && (
          <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MapPin size={18} className="text-teal-600" />
                  Cadastrar Novo Endereço
                </h3>
              </div>
              
              <form onSubmit={handleAddEndereco} className="p-6">
                <div className="mb-6">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Identificação do Local</label>
                  <div className="flex flex-wrap gap-3">
                    {['Casa', 'Trabalho', 'Outro'].map((tipo) => (
                      <button
                        key={tipo} type="button" onClick={() => setTipoEndereco(tipo as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          tipoEndereco === tipo ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {tipo === 'Casa' ? <Home size={16} /> : tipo === 'Trabalho' ? <Briefcase size={16} /> : <Building size={16} />}
                        {tipo}
                      </button>
                    ))}
                  </div>
                  {tipoEndereco === 'Outro' && (
                    <input 
                      type="text" value={nomePersonalizado} onChange={(e) => setNomePersonalizado(e.target.value)}
                      placeholder="Ex: Casa de Praia, Apartamento da Mãe..." autoFocus required
                      className="mt-3 w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all placeholder:text-slate-400"
                    />
                  )}
                </div>

                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 sm:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex justify-between">
                      <span>CEP</span>
                      {isFetchingCep && <Loader2 size={12} className="animate-spin text-teal-500"/>}
                    </label>
                    <input type="text" value={novoEnd.cep} onChange={handleCepChange} placeholder="00000-000" maxLength={9} required className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all placeholder:text-slate-400" />
                  </div>
                  <div className="col-span-12 sm:col-span-6">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Rua / Logradouro</label>
                    <input type="text" value={novoEnd.rua} onChange={(e) => setNovoEnd({...novoEnd, rua: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all" />
                  </div>
                  <div className="col-span-12 sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nº</label>
                    <input type="text" value={novoEnd.numero} onChange={(e) => setNovoEnd({...novoEnd, numero: e.target.value.replace(/\D/g, '')})} placeholder="123" required className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all placeholder:text-slate-400" />
                  </div>

                  <div className="col-span-12 sm:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex justify-between">
                      <span>Complemento</span>
                      <span className="text-[9px] text-slate-400">(Opcional)</span>
                    </label>
                    <input type="text" value={novoEnd.complemento} onChange={(e) => setNovoEnd({...novoEnd, complemento: e.target.value})} placeholder="Apto, Bloco..." className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all placeholder:text-slate-400" />
                  </div>
                  <div className="col-span-12 sm:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Bairro</label>
                    <input type="text" value={novoEnd.bairro} onChange={(e) => setNovoEnd({...novoEnd, bairro: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all" />
                  </div>
                  <div className="col-span-12 sm:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Cidade</label>
                    <input type="text" value={novoEnd.cidade} onChange={(e) => setNovoEnd({...novoEnd, cidade: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all" />
                  </div>
                  <div className="col-span-12 sm:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 text-center">UF</label>
                    <input type="text" value={novoEnd.estado} onChange={(e) => setNovoEnd({...novoEnd, estado: e.target.value.toUpperCase()})} maxLength={2} required className="w-full px-2 py-2.5 border border-slate-300 rounded-lg text-sm uppercase text-center focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all" />
                  </div>
                </div>

                <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-lg text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />} 
                    {saving ? 'Salvando...' : 'Salvar Endereço'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL DE EXCLUSÃO (Estilo Corporativo) */}
        {enderecoToDelete && (
          <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Remover Endereço?</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Tem certeza que deseja excluir este endereço da sua conta? Você não poderá desfazer essa ação.
                </p>
              </div>
              <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center gap-3">
                <button 
                  onClick={() => setEnderecoToDelete(null)} 
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={executeDelete} 
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  {isDeleting ? 'Removendo...' : 'Sim, remover'}
                </button>
              </div>
            </div>
          </div>
        )}

      </section>
    </main>
  );
}