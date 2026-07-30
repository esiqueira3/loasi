import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import TopBarIcons from '../components/TopBarIcons';
import { toast } from '../components/Toast';
import { supabase } from '../lib/supabase';
import { useConfirm } from '../components/ConfirmContext';
import { loggedUser } from '../components/AccessGuard';
import {
  Tag, Plus, Edit2, Trash2, Loader2, X, Check,
  ArrowDownRight, ArrowUpRight, Filter
} from 'lucide-react';

const PALETA_CORES = [
  '#107c42', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#ec4899', '#f97316', '#14b8a6', '#6366f1',
   '#64748b', '#84cc16'
];

export default function Categorias() {
  const confirm = useConfirm();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('todos');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null); // null = criar, obj = editar
  const [form, setForm] = useState({ nome: '', tipo: 'despesa', cor: '#107c42' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategorias();
  }, []);

  async function loadCategorias() {
    setLoading(true);
    const { data, error } = await supabase
      .from('categorias_financeiras')
      .select('*')
      .order('tipo', { ascending: true })
      .order('nome', { ascending: true });

    if (error) {
      if (error.code !== '42P01') {
        toast.error('Erro ao carregar categorias: ' + error.message);
      }
      setCategorias([]);
    } else {
      setCategorias(data || []);
    }
    setLoading(false);
  }

  const openCreateModal = (tipoDefault = 'despesa') => {
    setEditingCat(null);
    setForm({ nome: '', tipo: tipoDefault, cor: tipoDefault === 'despesa' ? '#ef4444' : '#107c42' });
    setModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCat(cat);
    setForm({ nome: cat.nome, tipo: cat.tipo, cor: cat.cor || '#107c42' });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast.error('Informe o nome da categoria.');
      return;
    }

    setSaving(true);

    if (editingCat) {
      // Update
      const { error } = await supabase
        .from('categorias_financeiras')
        .update({
          nome: form.nome.trim(),
          tipo: form.tipo,
          cor: form.cor,
        })
        .eq('id', editingCat.id);

      if (error) {
        toast.error('Erro ao atualizar categoria: ' + error.message);
      } else {
        toast.success('Categoria atualizada com sucesso!');
        setModalOpen(false);
        loadCategorias();
      }
    } else {
      // Create
      const { error } = await supabase
        .from('categorias_financeiras')
        .insert([{
          nome: form.nome.trim(),
          tipo: form.tipo,
          cor: form.cor,
          user_id: loggedUser?.id || null,
        }]);

      if (error) {
        toast.error('Erro ao criar categoria: ' + error.message);
      } else {
        toast.success('Categoria criada com sucesso!');
        setModalOpen(false);
        loadCategorias();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (cat) => {
    const confirmed = await confirm({
      title: 'Excluir Categoria',
      message: `Tem certeza que deseja excluir a categoria "${cat.nome}"? Lançamentos associados a esta categoria continuarão salvos.`,
      confirmText: 'Sim, excluir',
      intent: 'danger',
    });

    if (!confirmed) return;

    const { error } = await supabase
      .from('categorias_financeiras')
      .delete()
      .eq('id', cat.id);

    if (error) {
      toast.error('Erro ao excluir: ' + error.message);
    } else {
      toast.success('Categoria removida.');
      loadCategorias();
    }
  };

  const categoriasFiltradas = useMemo(() => {
    if (filtroTipo === 'todos') return categorias;
    return categorias.filter(c => c.tipo === filtroTipo);
  }, [categorias, filtroTipo]);

  const despesasCount = categorias.filter(c => c.tipo === 'despesa').length;
  const receitasCount = categorias.filter(c => c.tipo === 'receita').length;

  return (
    <Layout>
      <div className="flex flex-col h-full bg-canvas-parchment text-ink font-sans overflow-hidden">
        
        {/* Sticky Header */}
        <header className="h-14 lg:h-20 bg-canvas/80 backdrop-blur-xl border-b border-hairline flex items-center justify-between px-4 lg:px-8 shrink-0 z-40 sticky top-0">
          <div className="flex items-center gap-2 font-body text-ink-muted-48">
            <span className="text-ink font-body-strong flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#107c42]">category</span>
              Categorias Financeiras
            </span>
          </div>
          <div className="flex items-center gap-2 lg:gap-4 text-ink">
            <TopBarIcons />
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-10 fade-in bg-canvas-parchment">
          <div className="max-w-[1200px] mx-auto">
            
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="font-display-lg text-[28px] lg:text-[40px] text-ink tracking-tight font-light mb-2">
                  Categorias
                </h1>
                <p className="font-body text-ink-muted-80 text-[13px] lg:text-[15px]">
                  Crie e personalize as categorias de receitas e despesas do módulo financeiro.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openCreateModal('despesa')}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#107c42] hover:bg-[#107c42]/90 text-white rounded-xl text-[14px] font-bold transition-all shadow-md hover:scale-[0.99] active:scale-95 shrink-0"
              >
                <Plus size={18} /> Nova Categoria
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
              <div className="flex bg-surface-pearl p-1 rounded-xl border border-hairline text-[13px] font-bold shadow-sm">
                <button
                  type="button"
                  onClick={() => setFiltroTipo('todos')}
                  className={`px-4 py-2 rounded-lg transition-all ${filtroTipo === 'todos' ? 'bg-[#107c42] text-white shadow' : 'text-ink-muted-80 hover:text-ink'}`}
                >
                  Todas ({categorias.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroTipo('despesa')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all ${filtroTipo === 'despesa' ? 'bg-[#107c42] text-white shadow' : 'text-ink-muted-80 hover:text-ink'}`}
                >
                  <ArrowDownRight size={15} className="text-red-500" /> Despesas ({despesasCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroTipo('receita')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all ${filtroTipo === 'receita' ? 'bg-[#107c42] text-white shadow' : 'text-ink-muted-80 hover:text-ink'}`}
                >
                  <ArrowUpRight size={15} className="text-emerald-500" /> Receitas ({receitasCount})
                </button>
              </div>
            </div>

            {/* Content Table / Cards */}
            <div className="bg-surface-pearl border border-hairline rounded-2xl overflow-hidden shadow-sm">
              {loading ? (
                <div className="p-12 text-center text-ink-muted-48 flex items-center justify-center gap-2">
                  <Loader2 size={22} className="animate-spin text-[#107c42]" /> Carregando categorias...
                </div>
              ) : categoriasFiltradas.length === 0 ? (
                <div className="p-16 text-center flex flex-col items-center">
                  <Tag size={42} className="text-ink-muted-48 opacity-30 mb-3" />
                  <p className="text-ink font-semibold mb-1">Nenhuma categoria encontrada</p>
                  <p className="text-[13px] text-ink-muted-48 mb-4">Clique no botão abaixo para adicionar sua primeira categoria.</p>
                  <button
                    type="button"
                    onClick={() => openCreateModal('despesa')}
                    className="px-4 py-2 bg-[#107c42] text-white rounded-xl text-[13px] font-bold"
                  >
                    Adicionar Categoria
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-hairline">
                  {categoriasFiltradas.map((cat) => {
                    const isDespesa = cat.tipo === 'despesa';
                    return (
                      <div
                        key={cat.id}
                        className="px-6 py-4 flex items-center justify-between hover:bg-canvas-parchment/50 transition-colors"
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                            style={{ backgroundColor: cat.cor || (isDespesa ? '#ef4444' : '#107c42') }}
                          >
                            <Tag size={17} />
                          </div>
                          <div>
                            <div className="text-[15px] font-bold text-ink flex items-center gap-2">
                              {cat.nome}
                            </div>
                            <div className="text-[12px] text-ink-muted-48 flex items-center gap-1 mt-0.5">
                              {isDespesa ? (
                                <span className="text-red-500 font-semibold flex items-center gap-1">
                                  <ArrowDownRight size={13} /> Despesa
                                </span>
                              ) : (
                                <span className="text-[#107c42] font-semibold flex items-center gap-1">
                                  <ArrowUpRight size={13} /> Receita
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(cat)}
                            className="p-2 rounded-lg border border-hairline text-ink-muted-80 hover:text-ink hover:bg-canvas-parchment transition-all"
                            title="Editar Categoria"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat)}
                            className="p-2 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all"
                            title="Excluir Categoria"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Modal Criar/Editar */}
        {modalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in">
            <div className="w-full max-w-md bg-surface-pearl border border-hairline rounded-2xl p-6 shadow-2xl">
              <div className="flex justify-between items-start mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#107c42]/15 text-[#107c42] flex items-center justify-center">
                    <Tag size={20} />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold text-ink">
                      {editingCat ? 'Editar Categoria' : 'Nova Categoria'}
                    </h3>
                    <p className="text-[12px] text-ink-muted-48">Configure o nome, tipo e cor de exibição</p>
                  </div>
                </div>
                <button type="button" onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-ink-muted-48 hover:text-ink"><X size={18} /></button>
              </div>

              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <div>
                  <label className="text-[12px] font-bold text-ink-muted-80 block mb-1">Nome da Categoria *</label>
                  <input
                    type="text"
                    required
                    value={form.nome}
                    onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                    placeholder="Ex.: Hospedagem AWS, Licenças, Suporte..."
                    className="w-full px-3 py-2 rounded-xl border border-hairline bg-canvas-parchment text-ink text-[13.5px] outline-none focus:border-[#107c42] transition-all"
                  />
                </div>

                <div>
                  <label className="text-[12px] font-bold text-ink-muted-80 block mb-1">Tipo de Lançamento *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, tipo: 'despesa' }))}
                      className={`py-2 rounded-xl border text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                        form.tipo === 'despesa' ? 'border-red-500 bg-red-500/15 text-red-500' : 'border-hairline bg-transparent text-ink-muted-80'
                      }`}
                    >
                      <ArrowDownRight size={15} /> Despesa
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, tipo: 'receita' }))}
                      className={`py-2 rounded-xl border text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                        form.tipo === 'receita' ? 'border-[#107c42] bg-[#107c42]/15 text-[#107c42]' : 'border-hairline bg-transparent text-ink-muted-80'
                      }`}
                    >
                      <ArrowUpRight size={15} /> Receita
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[12px] font-bold text-ink-muted-80 block mb-1.5">Cor da Etiqueta</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {PALETA_CORES.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, cor: c }))}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform hover:scale-110"
                        style={{ backgroundColor: c }}
                      >
                        {form.cor === c && <Check size={14} className="text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 justify-end mt-4 pt-3 border-t border-hairline">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl border border-hairline text-ink-muted-80 hover:text-ink text-[13px] font-semibold">
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-[#107c42] hover:bg-[#107c42]/90 text-white text-[13px] font-bold flex items-center gap-2">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
