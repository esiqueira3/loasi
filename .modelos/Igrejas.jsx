import { useState, useEffect } from 'react'
import { PageHeader } from '../components/ui/PageHeader'
import { Table } from '../components/ui/Table'
import { ControlBar } from '../components/ui/ControlBar'
import { Pagination } from '../components/ui/Pagination'
import { OrganogramaView } from '../components/ui/OrganogramaView'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useTenant } from '../context/TenantContext'
import { usePermissions } from '../context/PermissionsContext'

// ── Modal de confirmação premium ─────────────────────────────────────────────
function ConfirmModal({ isOpen, title, message, icon = 'delete', iconColor = 'text-red-500', iconBg = 'bg-red-500/10', confirmLabel = 'Excluir', confirmClass = 'bg-red-600 hover:bg-red-700 shadow-red-600/20', onConfirm, onCancel, loading }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md border border-outline-variant/10 animate-in zoom-in-95 duration-300 overflow-hidden">
        <div className="p-8 text-center space-y-4">
          <div className={`w-16 h-16 mx-auto rounded-2xl ${iconBg} flex items-center justify-center`}>
            <span className={`material-symbols-outlined text-3xl ${iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
          </div>
          <div>
            <h3 className="font-black text-on-surface uppercase tracking-tight text-lg">{title}</h3>
            <p className="text-sm text-on-surface-variant font-medium mt-2 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="px-8 pb-8 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${confirmClass}`}
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><span className="material-symbols-outlined text-[16px]">{icon}</span>{confirmLabel}</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal de aviso premium ────────────────────────────────────────────────────
function AlertModal({ isOpen, title, message, icon = 'warning', iconColor = 'text-amber-500', iconBg = 'bg-amber-500/10', onClose }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md border border-outline-variant/10 animate-in zoom-in-95 duration-300 overflow-hidden">
        <div className="p-8 text-center space-y-4">
          <div className={`w-16 h-16 mx-auto rounded-2xl ${iconBg} flex items-center justify-center`}>
            <span className={`material-symbols-outlined text-3xl ${iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
          </div>
          <div>
            <h3 className="font-black text-on-surface uppercase tracking-tight text-lg">{title}</h3>
            <p className="text-sm text-on-surface-variant font-medium mt-2 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="px-8 pb-8">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Igrejas() {
  const [igrejas, setIgrejas] = useState([])
  const [loading, setLoading] = useState(true)
  const { tenant } = useTenant()
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('igrejas_view_mode') || 'list')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6
  const navigate = useNavigate()
  const { isMaster } = usePermissions()

  // Modais
  const [confirmModal, setConfirmModal] = useState({ open: false, row: null, loading: false })
  const [alertModal, setAlertModal] = useState({ open: false, title: '', message: '', icon: 'warning', iconColor: 'text-amber-500', iconBg: 'bg-amber-500/10' })

  const showAlert = (title, message, opts = {}) => {
    setAlertModal({ open: true, title, message, icon: 'warning', iconColor: 'text-amber-500', iconBg: 'bg-amber-500/10', ...opts })
  }

  useEffect(() => { setCurrentPage(1) }, [searchTerm, filterStatus])
  useEffect(() => { localStorage.setItem('igrejas_view_mode', viewMode) }, [viewMode])

  useEffect(() => {
    async function fetchIgrejas() {
      const { data, error } = await supabase
        .from('igrejas')
        .select('*, matriz:matriz_id(descricao)')
        .order('created_at', { ascending: false })
      
      if (error) {
        setLoading(false)
        showAlert('Erro ao carregar', error.message, { icon: 'error', iconColor: 'text-red-500', iconBg: 'bg-red-500/10' })
        return
      }
      
      if (data) setIgrejas(data)
      setLoading(false)
    }
    fetchIgrejas()
  }, [])

  const handleDeleteClick = (row) => {
    // Verifica se é a igreja matriz do usuário logado
    // Busca se algum perfil master usa essa igreja como principal
    if (row.id === tenant?.id) {
      showAlert(
        'Ação não permitida',
        'Esta é a Igreja Matriz vinculada ao seu perfil Master. Para excluí-la, primeiro vincule seu perfil a outra igreja.',
        { icon: 'shield_locked', iconColor: 'text-amber-600', iconBg: 'bg-amber-500/10' }
      )
      return
    }
    setConfirmModal({ open: true, row, loading: false })
  }

  const handleDeleteConfirm = async () => {
    const row = confirmModal.row
    setConfirmModal(prev => ({ ...prev, loading: true }))
    
    const { error } = await supabase.from('igrejas').delete().eq('id', row.id)
    
    if (error) {
      setConfirmModal({ open: false, row: null, loading: false })
      showAlert('Erro ao excluir', error.message, { icon: 'error', iconColor: 'text-red-500', iconBg: 'bg-red-500/10' })
    } else {
      setIgrejas(prev => prev.filter(m => m.id !== row.id))
      setConfirmModal({ open: false, row: null, loading: false })
    }
  }

  const handleToggleStatus = async (row) => {
    const newStatus = !row.status
    const { error } = await supabase.from('igrejas').update({ status: newStatus }).eq('id', row.id)
    if (!error) {
      setIgrejas(prev => prev.map(m => m.id === row.id ? { ...m, status: newStatus } : m))
    } else {
      showAlert('Erro ao alterar status', error.message, { icon: 'error', iconColor: 'text-red-500', iconBg: 'bg-red-500/10' })
    }
  }

  const columns = [
    { label: 'Unidade', key: 'codigo', render: (row) => <span className="font-mono text-xs font-bold text-on-surface-variant bg-surface-variant/50 px-2 py-1 rounded">{row.codigo || 'S/N'}</span> },
    { label: 'Nome', key: 'descricao', render: (row) => <span className="font-bold text-primary">{row.descricao}</span> },
    { label: 'Tipo', key: 'is_filial', render: (row) => row.is_filial ? <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded uppercase">Filial</span> : <span className="bg-tertiary-fixed text-tertiary-container text-xs font-bold px-2 py-1 rounded uppercase">Matriz SEDE</span>},
    { label: 'Vinculação (Matriz)', key: 'matriz', render: (row) => row.matriz?.descricao || '-' },
    { label: 'Status', key: 'status', render: (row) => (
      <button 
        onClick={(e) => { e.stopPropagation(); handleToggleStatus(row) }}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${
          row.status 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700/30' 
            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700/30'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${row.status ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
        {row.status ? 'Ativa' : 'Inativa'}
      </button>
    )}
  ]

  const filteredIgrejas = igrejas.filter(i => {
    const matchesSearch = i.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === '' || (filterStatus === 'ativo' ? i.status === true : i.status === false)
    return matchesSearch && matchesStatus
  })

  const paginatedIgrejas = filteredIgrejas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Modais */}
      <ConfirmModal
        isOpen={confirmModal.open}
        loading={confirmModal.loading}
        title="Excluir Igreja"
        message={`Tem certeza que deseja excluir "${confirmModal.row?.descricao}"? Esta ação não pode ser desfeita.`}
        icon="delete"
        confirmLabel="Sim, Excluir"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmModal({ open: false, row: null, loading: false })}
      />
      <AlertModal
        isOpen={alertModal.open}
        title={alertModal.title}
        message={alertModal.message}
        icon={alertModal.icon}
        iconColor={alertModal.iconColor}
        iconBg={alertModal.iconBg}
        onClose={() => setAlertModal(prev => ({ ...prev, open: false }))}
      />

      <PageHeader 
        title="Igrejas e Unidades" 
        description="Gerencie a sede e as congregações do seu ministério."
        icon="church"
        buttonLabel="Nova Unidade"
        buttonLink="/igrejas/novo"
        buttonIcon="add_home"
      >
        <button 
          onClick={() => setViewMode(viewMode === 'organograma' ? 'list' : 'organograma')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold shadow-lg transition-all active:scale-95 text-[13px] tracking-wide bg-amber-500 text-white shadow-amber-500/20 hover:shadow-amber-500/40 hover:-translate-y-0.5"
        >
          <span className="material-symbols-outlined text-[18px]">account_tree</span> 
          {viewMode === 'organograma' ? 'Ver Lista' : 'Estruturação'}
        </button>
      </PageHeader>

      <ControlBar 
        searchPlaceholder="Buscar por nome ou código..."
        onSearch={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showFilters={true}
        onFiltersClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
      >
        <div className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 whitespace-nowrap">
          {filteredIgrejas.length} UNIDADES
        </div>
      </ControlBar>

      {/* GAVETA DE FILTROS */}
      {showFiltersDrawer && (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-4 duration-500 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h4 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">filter_alt</span>
              Filtros
            </h4>
            {filterStatus && (
              <button onClick={() => setFilterStatus('')} className="text-[10px] font-black uppercase text-red-500 hover:text-red-700 transition-colors">
                Limpar
              </button>
            )}
          </div>
          <div className="flex flex-col gap-1.5 max-w-xs">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
            <div className="flex gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              {[{ value: '', label: 'Todos', icon: 'filter_list' }, { value: 'ativo', label: 'Ativas', icon: 'check_circle' }, { value: 'inativo', label: 'Inativas', icon: 'cancel' }].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilterStatus(opt.value)}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                    filterStatus === opt.value
                      ? opt.value === 'ativo' ? 'bg-green-500 text-white shadow-sm shadow-green-500/30'
                        : opt.value === 'inativo' ? 'bg-red-500 text-white shadow-sm shadow-red-500/30'
                        : 'bg-primary text-white shadow-sm shadow-primary/30'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-[12px]">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center p-12">
          <span className="material-symbols-outlined animate-spin text-tertiary-fixed-dim text-4xl">refresh</span>
        </div>
      ) : filteredIgrejas.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] text-center space-y-4 shadow-sm animate-in fade-in zoom-in-95 duration-500">
           <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-2 border-8 border-primary/10">
              <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>church</span>
           </div>
           <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Nenhuma unidade encontrada</h3>
           <p className="text-sm font-bold text-slate-500 dark:text-slate-400 max-w-sm">
              Você ainda não tem igrejas cadastradas ou a sua busca não retornou nenhum resultado.
           </p>
           <button 
             onClick={() => navigate('/igrejas/novo')}
             className="mt-6 px-6 py-3 bg-primary text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/30 flex items-center gap-2"
           >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Cadastrar Unidade
           </button>
        </div>
      ) : viewMode === 'organograma' ? (
        <OrganogramaView igrejas={igrejas} />
      ) : viewMode === 'list' ? (
        <Table columns={columns} data={filteredIgrejas} onDelete={isMaster ? handleDeleteClick : undefined} onEdit={(row) => navigate(`/igrejas/editar/${row.id}`)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
           {paginatedIgrejas.map(igreja => (
              <div 
                key={igreja.id}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                 <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                 
                 <div className="relative z-10 space-y-4">
                    <div className="flex items-start justify-between">
                       <div className={`p-3 rounded-2xl bg-gradient-to-br transition-all duration-500 ${igreja.status ? 'from-primary/10 to-primary/20 text-primary' : 'from-slate-100 to-slate-200 text-slate-400'}`}>
                          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>church</span>
                       </div>
                       <div className="flex items-center gap-1">
                          <button 
                            onClick={() => navigate(`/igrejas/editar/${igreja.id}`)}
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-primary bg-primary/5 dark:bg-primary/10 hover:bg-primary/15 active:scale-90 transition-all"
                          >
                             <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                           {isMaster && (
                           <button 
                             onClick={() => handleDeleteClick(igreja)}
                             className="w-9 h-9 rounded-lg flex items-center justify-center text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 active:scale-90 transition-all"
                           >
                              <span className="material-symbols-outlined text-lg">delete</span>
                           </button>
                           )}
                       </div>
                    </div>

                    <div>
                       <div className="flex items-center gap-2 mb-1">
                          <p className="font-mono text-[9px] font-black text-on-surface-variant bg-surface-variant/50 px-2 py-0.5 rounded uppercase tracking-tighter">
                            {igreja.codigo || 'S/N'}
                          </p>
                          {igreja.is_filial ? (
                            <span className="bg-blue-500/10 text-blue-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Filial</span>
                          ) : (
                            <span className="bg-amber-600/10 text-amber-700 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Matriz Sede</span>
                          )}
                       </div>
                       <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                          {igreja.descricao}
                       </h3>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                       <div className="flex items-center gap-2 text-on-surface-variant">
                          <span className="material-symbols-outlined text-sm opacity-50">account_tree</span>
                          <span className="text-[11px] font-bold uppercase tracking-wider">
                             {igreja.matriz?.descricao || 'Unidade Independente'}
                          </span>
                       </div>

                       <div className="flex items-center justify-between pt-2">
                          <button 
                            onClick={() => handleToggleStatus(igreja)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${
                              igreja.status 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700/30' 
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700/30'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${igreja.status ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                            {igreja.status ? 'Ativa' : 'Inativa'}
                          </button>

                          <div className="flex -space-x-1.5 opacity-40">
                             <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900" />
                             <div className="w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-600 border-2 border-white dark:border-slate-900" />
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           ))}
        </div>
      )}

      {viewMode === 'grid' && !loading && filteredIgrejas.length > itemsPerPage && (
        <Pagination 
          totalItems={filteredIgrejas.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}
