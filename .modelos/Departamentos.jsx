import { useState, useEffect } from 'react'
import { PageHeader } from '../components/ui/PageHeader'
import { Table } from '../components/ui/Table'
import { ControlBar } from '../components/ui/ControlBar'
import { Pagination } from '../components/ui/Pagination'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Departamentos() {
  const [departamentos, setDepartamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('departamentos_view_mode') || 'list')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6
  const navigate = useNavigate()

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterStatus])

  useEffect(() => {
    localStorage.setItem('departamentos_view_mode', viewMode)
  }, [viewMode])

  useEffect(() => {
    async function fetchDepartamentos() {
      const { data, error } = await supabase
        .from('departamentos')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setDepartamentos(data)
      }
      setLoading(false)
    }
    fetchDepartamentos()
  }, [])

  const handleDelete = async (row) => {
    if(window.confirm(`Tem certeza que deseja excluir o departamento: ${row.nome}?`)) {
      setLoading(true)
      const { error } = await supabase.from('departamentos').delete().eq('id', row.id)
      
      if (error) {
        alert("❌ Erro ao excluir do banco de dados:\n\n" + error.message)
        setLoading(false)
      } else {
        setDepartamentos(prev => prev.filter(d => d.id !== row.id))
        setLoading(false)
        alert("✅ Departamento excluído com sucesso!")
      }
    }
  }

  const handleToggleStatus = async (row) => {
    const newStatus = !row.status
    const { error } = await supabase.from('departamentos').update({ status: newStatus }).eq('id', row.id)
    if (!error) {
      setDepartamentos(prev => prev.map(m => m.id === row.id ? { ...m, status: newStatus } : m))
    } else {
      alert("❌ Erro ao alterar status:\n\n" + error.message)
    }
  }

  const columns = [
    { label: 'Nome', key: 'nome', render: (row) => (
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full shrink-0 shadow-sm"
          style={{ backgroundColor: row.cor || '#3B82F6' }}
        />
        <span className="font-bold text-primary">{row.nome}</span>
      </div>
    )},
    { label: 'Cor', key: 'cor', render: (row) => (
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg shadow-sm border border-white/60"
          style={{ backgroundColor: row.cor || '#3B82F6' }}
        />
        <span className="font-mono text-[11px] font-bold text-on-surface-variant">
          {(row.cor || '#3B82F6').toUpperCase()}
        </span>
      </div>
    )},
    { label: 'Tipo', key: 'tipo_departamento', render: (row) => <span className="bg-surface-container text-primary text-[10px] uppercase font-bold px-2 py-1 rounded">{row.tipo_departamento}</span> },
    { label: 'Público', key: 'publico_alvo' },
    { label: 'Status', key: 'status', render: (row) => (
      <button 
        onClick={(e) => {
          e.stopPropagation();
          handleToggleStatus(row);
        }}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${
          row.status 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700/30' 
            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700/30'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${row.status ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
        {row.status ? 'Ativo' : 'Inativo'}
      </button>
    )}
  ]

  const filteredDepartamentos = departamentos.filter(d => {
    const matchesSearch = d.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.tipo_departamento?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === '' || (filterStatus === 'ativo' ? d.status === true : d.status === false)
    return matchesSearch && matchesStatus
  })

  const paginatedDepartamentos = filteredDepartamentos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-1">
      <PageHeader 
        title="Departamentos" 
        description="Gerencie os ministérios, grupos e células da sua igreja."
        icon="groups"
        buttonLabel="Novo Departamento"
        buttonLink="/departamentos/novo"
        buttonIcon="group_add"
      />

      <ControlBar 
        searchPlaceholder="Buscar departamentos..."
        onSearch={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showFilters={true}
        onFiltersClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
      >
        <div className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 whitespace-nowrap">
          {filteredDepartamentos.length} DEPARTAMENTOS
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
              <button
                onClick={() => setFilterStatus('')}
                className="text-[10px] font-black uppercase text-red-500 hover:text-red-700 transition-colors"
              >
                Limpar
              </button>
            )}
          </div>
          <div className="flex flex-col gap-1.5 max-w-xs">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
            <div className="flex gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              {[{ value: '', label: 'Todos', icon: 'filter_list' }, { value: 'ativo', label: 'Ativos', icon: 'check_circle' }, { value: 'inativo', label: 'Inativos', icon: 'cancel' }].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilterStatus(opt.value)}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                    filterStatus === opt.value
                      ? opt.value === 'ativo'
                        ? 'bg-green-500 text-white shadow-sm shadow-green-500/30'
                        : opt.value === 'inativo'
                        ? 'bg-red-500 text-white shadow-sm shadow-red-500/30'
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
      ) : filteredDepartamentos.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] text-center space-y-4 shadow-sm animate-in fade-in zoom-in-95 duration-500">
           <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-2 border-8 border-primary/10">
              <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
           </div>
           <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Nenhum departamento encontrado</h3>
           <p className="text-sm font-bold text-slate-500 dark:text-slate-400 max-w-sm">
              Você ainda não tem departamentos cadastrados ou a sua busca não retornou nenhum resultado.
           </p>
           <button 
             onClick={() => navigate('/departamentos/novo')}
             className="mt-6 px-6 py-3 bg-primary text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/30 flex items-center gap-2"
           >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Cadastrar Departamento
           </button>
        </div>
      ) : viewMode === 'list' ? (
        <Table 
          columns={columns} 
          data={filteredDepartamentos} 
          onDelete={handleDelete}
          onEdit={(row) => navigate(`/departamentos/editar/${row.id}`)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
           {paginatedDepartamentos.map(dept => (
              <div 
                key={dept.id}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                 <div 
                   className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity"
                   style={{ backgroundColor: dept.cor || '#3B82F6' }}
                 />
                 
                 <div className="relative z-10 space-y-4">
                    <div className="flex items-start justify-between">
                       <div 
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg"
                          style={{ background: `linear-gradient(135deg, ${dept.cor || '#3B82F6'}, ${dept.cor ? dept.cor + 'dd' : '#2563EB'})` }}
                       >
                          <span className="material-symbols-outlined text-3xl">hub</span>
                       </div>
                       <div className="flex items-center gap-1">
                          <button onClick={() => navigate(`/departamentos/editar/${dept.id}`)} className="w-9 h-9 rounded-lg flex items-center justify-center text-primary bg-primary/5 dark:bg-primary/10 hover:bg-primary/15 active:scale-90 transition-all">
                             <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button onClick={() => handleDelete(dept)} className="w-9 h-9 rounded-lg flex items-center justify-center text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 active:scale-90 transition-all">
                             <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                       </div>
                    </div>

                    <div>
                       <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/60 mb-1 block">
                          {dept.tipo_departamento || 'Departamento'}
                       </span>
                       <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-2">
                          {dept.nome}
                       </h3>
                       <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dept.cor || '#3B82F6' }} />
                          <span className="font-mono text-[10px] font-bold text-on-surface-variant/40">{(dept.cor || '#3B82F6').toUpperCase()}</span>
                       </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                       <div className="flex items-center gap-2 text-on-surface-variant">
                          <span className="material-symbols-outlined text-sm opacity-50">groups</span>
                          <span className="text-[11px] font-bold uppercase tracking-wider">
                             Público: {dept.publico_alvo || 'Geral'}
                          </span>
                       </div>

                       <div className="flex items-center justify-between pt-1">
                          <button 
                            onClick={() => handleToggleStatus(dept)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${
                              dept.status 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700/30' 
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700/30'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${dept.status ? 'bg-green-500 animate-pulse' : 'bg-red-50'}`}></span>
                            {dept.status ? 'Ativo' : 'Inativo'}
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
           ))}
        </div>
      )}

      {viewMode === 'grid' && !loading && filteredDepartamentos.length > itemsPerPage && (
        <Pagination 
          totalItems={filteredDepartamentos.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}
