import { useState, useEffect } from 'react'
import { PageHeader } from '../components/ui/PageHeader'
import { Table } from '../components/ui/Table'
import { ControlBar } from '../components/ui/ControlBar'
import { Pagination } from '../components/ui/Pagination'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Membros() {
  const [membros, setMembros] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterFaixaEtaria, setFilterFaixaEtaria] = useState('')
  const [filterEscolaridade, setFilterEscolaridade] = useState('')
  const [filterCPF, setFilterCPF] = useState('')
  const [filterStatus, setFilterStatus] = useState('') // '' = todos, 'ativo', 'inativo'
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('membros_view_mode') || 'list')
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12
  const navigate = useNavigate()

  useEffect(() => {
    localStorage.setItem('membros_view_mode', viewMode)
  }, [viewMode])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterTipo, filterFaixaEtaria, filterEscolaridade, filterCPF, filterStatus])

  useEffect(() => {
    async function fetchMembros() {
      const { data, error } = await supabase
        .from('membros')
        .select(`
          id, nome_completo, telefone_principal, email, matricula, status, tipo_membro,
          idade, data_nascimento, faixa_etaria, escolaridade, cpf, departamentos ( nome )
        `)
        .order('nome_completo', { ascending: true })
      
      if (!error && data) {
        setMembros(data)
      }
      setLoading(false)
    }
    fetchMembros()
  }, [])

  // Lógica de Filtragem (Computed)
  const membrosFiltrados = membros.filter(m => {
    const matchesNome = m.nome_completo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTipo = filterTipo === '' || m.tipo_membro === filterTipo
    const matchesFaixa = filterFaixaEtaria === '' || m.faixa_etaria === filterFaixaEtaria
    const matchesEscolaridade = filterEscolaridade === '' || m.escolaridade === filterEscolaridade
    const matchesCPF = filterCPF === '' || (m.cpf && m.cpf.replace(/\D/g, '').includes(filterCPF.replace(/\D/g, '')))
    const matchesStatus = filterStatus === '' || (filterStatus === 'ativo' ? m.status === true : m.status === false)
    return matchesNome && matchesTipo && matchesFaixa && matchesEscolaridade && matchesCPF && matchesStatus
  })

  // Função Inteligente: Calcula a idade real em tempo real
  const calcularIdade = (dataNasc) => {
    if (!dataNasc) return null
    const hoje = new Date()
    const nascimento = new Date(dataNasc)
    
    let idade = hoje.getFullYear() - nascimento.getFullYear()
    const m = hoje.getMonth() - nascimento.getMonth()
    
    // Ajuste se ainda não fez aniversário no ano corrente
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--
    }
    return idade
  }

  const paginatedMembros = membrosFiltrados.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleDelete = async (row) => {
    if(window.confirm(`Tem certeza que deseja excluir o membro: ${row.nome_completo}?`)) {
      setLoading(true)
      const { error } = await supabase.from('membros').delete().eq('id', row.id)
      
      if (error) {
        alert("❌ Erro ao excluir do banco de dados:\n\n" + error.message)
        setLoading(false)
      } else {
        setMembros(prev => prev.filter(m => m.id !== row.id))
        setLoading(false)
        alert("✅ Membro excluído com sucesso!")
      }
    }
  }

  const handleToggleStatus = async (row) => {
    const newStatus = !row.status
    const { error } = await supabase.from('membros').update({ status: newStatus }).eq('id', row.id)
    if (!error) {
      setMembros(prev => prev.map(m => m.id === row.id ? { ...m, status: newStatus } : m))
    } else {
      alert("❌ Erro ao alterar status:\n\n" + error.message)
    }
  }

  const columns = [
    { label: 'Matrícula', key: 'matricula', render: (row) => <span className="font-mono text-xs font-bold text-on-surface-variant bg-surface-variant/50 px-2 py-1 rounded">{row.matricula}</span> },
    { label: 'Nome', key: 'nome_completo', render: (row) => <span className="font-bold text-primary">{row.nome_completo}</span> },
    { label: 'Perfil', key: 'faixa_etaria', render: (row) => {
      const idadeReal = calcularIdade(row.data_nascimento) || row.idade
      return (
        <div className="flex flex-col">
          <span className="text-xs font-black text-on-surface-variant leading-none">{row.faixa_etaria || '-'}</span>
          <span className="text-[10px] font-bold text-tertiary-fixed-dim italic">
            {idadeReal ? `${idadeReal} anos` : ''}
          </span>
        </div>
      )
    }},
    { label: 'Tipo', key: 'tipo_membro', render: (row) => <span className="text-xs font-semibold uppercase">{row.tipo_membro}</span> },
    { label: 'Departamento', key: 'departamento', render: (row) => row.departamentos?.nome || '-' },
    { label: 'Contato', key: 'telefone_principal', render: (row) => <span className="text-secondary tracking-wider text-sm">{row.telefone_principal}</span> },
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

  const handleClearFilters = () => {
    setSearchTerm('')
    setFilterTipo('')
    setFilterFaixaEtaria('')
    setFilterEscolaridade('')
    setFilterCPF('')
    setFilterStatus('')
  }

  const hasActiveFilters = searchTerm || filterTipo || filterFaixaEtaria || filterEscolaridade || filterCPF || filterStatus

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-1">
      <PageHeader 
        title="Membros" 
        description="Cadastro dos membros da igreja."
        icon="groups"
        buttonLabel="Novo Membro"
        buttonLink="/membros/novo"
      />

      <ControlBar 
        searchPlaceholder="Buscar membros por nome..."
        onSearch={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showFilters={true}
        onFiltersClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
      >
        <div className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 whitespace-nowrap">
           {membrosFiltrados.length} MEMBROS
        </div>
      </ControlBar>

      {/* GAVETA DE FILTROS AVANÇADOS */}
      {showFiltersDrawer && (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-4 duration-500 mb-6 space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">filter_alt</span>
              Filtros Avançados
            </h4>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-[10px] font-black uppercase text-red-500 hover:text-red-700 transition-colors"
              >
                Limpar Tudo
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Filtro de Status — Pill Toggle Premium */}
            <div className="flex flex-col gap-1.5">
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

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Membro</label>
              <select 
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="w-full p-3 bg-white dark:bg-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-xs"
              >
                <option value="">Todos</option>
                <option value="Membro">Membro</option>
                <option value="Congregado">Congregado</option>
                <option value="Afastado">Afastado</option>
                <option value="Visitante">Visitante</option>
                <option value="Pastor">Pastor</option>
                <option value="Pastor Presidente">Pastor Presidente</option>
                <option value="Vice Presidente">Vice Presidente</option>
                <option value="Diretoria">Diretoria</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Faixa Etária</label>
              <select 
                value={filterFaixaEtaria}
                onChange={(e) => setFilterFaixaEtaria(e.target.value)}
                className="w-full p-3 bg-white dark:bg-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-xs"
              >
                <option value="">Todas</option>
                <option value="Criança">Criança (0-11 anos)</option>
                <option value="Adolescente">Adolescente (12-17 anos)</option>
                <option value="Jovem">Jovem (18-29 anos)</option>
                <option value="Adulto">Adulto (30-59 anos)</option>
                <option value="Idoso(a)">Idoso(a) (60+)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Escolaridade</label>
              <select 
                value={filterEscolaridade}
                onChange={(e) => setFilterEscolaridade(e.target.value)}
                className="w-full p-3 bg-white dark:bg-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-xs"
              >
                <option value="">Todas</option>
                <option value="Educação Infantil">Educação Infantil</option>
                <option value="Ensino Fundamental">Ensino Fundamental</option>
                <option value="Ensino Médio">Ensino Médio</option>
                <option value="Ensino Superior - Tecnólogo">Superior - Tecnólogo</option>
                <option value="Ensino Superior - Licenciatura">Superior - Licenciatura</option>
                <option value="Ensino Superior - Bacharelado">Superior - Bacharelado</option>
                <option value="Ensino Superior - Especialização (Pós-graduação / MBA)">Especialização</option>
                <option value="Ensino Superior - Mestrado">Mestrado</option>
                <option value="Ensino Superior - Doutorado">Doutorado</option>
                <option value="Ensino Superior - PhD">PhD</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF</label>
              <input 
                type="text" 
                placeholder="000.000.000-00" 
                value={filterCPF}
                onChange={(e) => setFilterCPF(e.target.value)}
                className="w-full p-3 bg-white dark:bg-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-xs"
              />
            </div>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center p-12">
           <span className="material-symbols-outlined animate-spin text-tertiary-fixed-dim text-4xl">refresh</span>
        </div>
      ) : membrosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] text-center space-y-4 shadow-sm animate-in fade-in zoom-in-95 duration-500">
           <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-2 border-8 border-primary/10">
              <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
           </div>
           <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Nenhum membro encontrado</h3>
           <p className="text-sm font-bold text-slate-500 dark:text-slate-400 max-w-sm">
              Você ainda não tem membros cadastrados ou a sua busca não retornou nenhum resultado.
           </p>
           <button 
             onClick={() => navigate('/membros/novo')}
             className="mt-6 px-6 py-3 bg-primary text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/30 flex items-center gap-2"
           >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Cadastrar Membro
           </button>
        </div>
      ) : viewMode === 'list' ? (
        <Table 
          columns={columns} 
          data={membrosFiltrados} 
          onDelete={handleDelete}
          onEdit={(row) => navigate(`/membros/editar/${row.id}`)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
           {paginatedMembros.map(membro => (
              <div 
                key={membro.id}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden"
              >
                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-colors" />
                 
                 <div className="relative z-10 space-y-4">
                    <div className="flex items-start justify-between">
                       <div className="relative">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br transition-all duration-500 ${membro.status ? 'from-primary to-primary-fixed-dim' : 'from-slate-300 to-slate-400'}`}>
                             <span className="material-symbols-outlined text-3xl">person</span>
                          </div>
                       </div>
                       <div className="flex items-center gap-1">
                          <button onClick={() => navigate(`/membros/editar/${membro.id}`)} className="w-9 h-9 rounded-lg flex items-center justify-center text-primary bg-primary/5 dark:bg-primary/10 hover:bg-primary/15 active:scale-90 transition-all">
                             <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button onClick={() => handleDelete(membro)} className="w-9 h-9 rounded-lg flex items-center justify-center text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 active:scale-90 transition-all">
                             <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                       </div>
                    </div>

                    <div>
                       <div className="flex items-center gap-2 mb-1">
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                             {membro.matricula || 'SEM MATRIC.'}
                          </span>
                          <span className="bg-primary/10 text-primary text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                             {membro.tipo_membro || 'Membro'}
                          </span>
                       </div>
                       <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight truncate group-hover:text-primary transition-colors">
                          {membro.nome_completo}
                       </h3>
                       <p className="text-[11px] font-bold text-slate-400 leading-none mt-1">
                          {membro.faixa_etaria} • {calcularIdade(membro.data_nascimento) || membro.idade ? `${calcularIdade(membro.data_nascimento) || membro.idade} anos` : 'Idade não inf.'}
                       </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                       <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <span className="material-symbols-outlined text-sm opacity-50">hub</span>
                          <span className="text-[11px] font-bold truncate">{membro.departamentos?.nome || 'Sem Departamento'}</span>
                       </div>
                       
                       <div className="flex items-center justify-between pt-1">
                          <button 
                            onClick={() => handleToggleStatus(membro)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${
                              membro.status 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700/30' 
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700/30'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${membro.status ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                            {membro.status ? 'Ativo' : 'Inativo'}
                          </button>
                          
                          <div className="flex items-center gap-1 text-slate-400">
                             <span className="material-symbols-outlined text-sm">call</span>
                             <span className="text-[10px] font-bold">{membro.telefone_principal || '--'}</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           ))}
        </div>
      )}

      {viewMode === 'grid' && !loading && membrosFiltrados.length > itemsPerPage && (
        <Pagination 
          totalItems={membrosFiltrados.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}
