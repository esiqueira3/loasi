import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Search, Plus, X, Pencil, Power, BadgeCheck, Clock,
  Users as UsersIcon, Handshake, Trophy, Plane, Loader2,
  LayoutGrid, List, ChevronDown, Check, Trash2, Eye
} from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { useEquipe } from '../hooks/useBlessData';
import { useConfirm } from '../contexts/ConfirmContext';
import { useAuth } from '../contexts/AuthContext';
import { hasWritePermission } from '../components/AccessGuard';
import { supabase } from '../lib/supabase';

const CARGOS = [
  'Diretor Comercial', 'Broker Sênior', 'Broker', 'Consultor de Aquisições',
  'Analista de Documentação RAB', 'Piloto de Demonstração', 'Financeiro & Escrow', 'Marketing',
];

const USUARIO_VAZIO = { nome: '', email: '', telefone: '', cargo: 'Broker', perfil: 'Broker', licenca: '', vendedor: false };

const PERFIL_CORES = {
  'Administrador Master': '#C9A45C',
  'Broker': '#4C5FD5',
  'Operações': '#0d9488',
  'Financeiro': '#8b5cf6',
};
const perfilCor = (nome) => PERFIL_CORES[nome] || '#7d8496';

const fmtUltimoAcesso = (iso) => {
  if (!iso) return 'Nunca acessou';
  const d = new Date(iso);
  return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
};

function CustomDropdown({ label, value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-ink)', display: 'block', marginBottom: '6px' }}>
        {label}
      </label>
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid var(--color-hairline)',
          backgroundColor: 'var(--color-canvas)',
          color: 'var(--color-ink)',
          fontSize: '14px',
          textAlign: 'left',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          outline: 'none',
          transition: 'border-color 0.2s',
          height: '46px'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value}
        </span>
        <ChevronDown size={15} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--color-ink-muted-48)' }} />
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <>
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 9999 }} 
            onClick={() => setIsOpen(false)} 
          />
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--color-canvas)',
            border: '1px solid var(--color-hairline)',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            zIndex: 10000,
            overflowY: 'auto',
            maxHeight: '220px',
            padding: '4px'
          }}>
            {options.map(opt => {
              const isSelected = opt === value;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isSelected ? 'var(--color-surface-pearl)' : 'transparent',
                    color: isSelected ? 'var(--color-primary)' : 'var(--color-ink)',
                    fontSize: '13.5px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontWeight: isSelected ? 700 : 500
                  }}
                  onMouseOver={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--color-surface-pearl)'; }}
                  onMouseOut={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <span>{opt}</span>
                  {isSelected && <Check size={14} style={{ color: 'var(--color-gold)' }} />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function UserModal({ initial, perfisNomes = [], cargos = [], isMasterAdmin = false, onSave, onClose }) {
  const availablePerfis = useMemo(() => {
    if (isMasterAdmin) return perfisNomes;
    return perfisNomes.filter(p => p !== 'Administrador Master');
  }, [perfisNomes, isMasterAdmin]);

  const [form, setForm] = useState(() => {
    const base = initial ? { ...initial } : { ...USUARIO_VAZIO, cargo: cargos[0] || 'Broker' };
    let initialPerfil = base.perfil || availablePerfis[0] || 'Broker';
    if (!isMasterAdmin && initialPerfil === 'Administrador Master') {
      initialPerfil = availablePerfis[0] || 'Broker';
    }
    return { ...base, perfil: initialPerfil };
  });
  const isEdit = Boolean(initial?.id);
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const labelStyle = { fontSize: '12.5px', fontWeight: 700, color: 'var(--color-ink)', display: 'block', marginBottom: '6px' };

  const handleSave = () => {
    if (!form.nome.trim()) { toast.error('Informe o nome do usuário.'); return; }
    if (!/\S+@\S+\.\S+/.test(form.email)) { toast.error('Informe um e-mail válido.'); return; }
    onSave(form);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(10,13,22,0.55)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: '560px', backgroundColor: 'var(--color-canvas)', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)', overflow: 'hidden' }}>
        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '19px', fontWeight: 700, margin: 0, color: 'var(--color-ink)' }}>
            {isEdit ? 'Editar Usuário' : 'Novo Usuário'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-ink-muted-48)', cursor: 'pointer', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Nome completo *</label>
            <input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex.: Larissa Fontes" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={labelStyle}>E-mail corporativo *</label>
            <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="nome@blessaviation.com.br" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={labelStyle}>Telefone</label>
            <input value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(11) 90000-0000" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={labelStyle}>Cargo</label>
            <input 
              value={form.cargo} 
              onChange={e => set('cargo', e.target.value)} 
              placeholder="Ex.: Broker Sênior" 
              style={{ width: '100%' }} 
              list="cargos-list"
            />
            <datalist id="cargos-list">
              {cargos.map(opt => (
                <option key={opt} value={opt} />
              ))}
            </datalist>
          </div>
          <div>
            <CustomDropdown
              label="Perfil de acesso"
              value={form.perfil}
              options={availablePerfis}
              onChange={val => set('perfil', val)}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Licença / habilitação aeronáutica (opcional)</label>
            <input value={form.licenca} onChange={e => set('licenca', e.target.value)} placeholder="Ex.: PC/IFR · 2.400h" style={{ width: '100%' }} />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'flex-start', gap: '12px', backgroundColor: 'var(--color-surface-pearl)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--color-hairline)' }}>
            <input
              type="checkbox"
              id="vendedor-checkbox"
              checked={Boolean(form.vendedor)}
              onChange={e => set('vendedor', e.target.checked)}
              style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#C9A45C', cursor: 'pointer' }}
            />
            <label htmlFor="vendedor-checkbox" style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-ink)', cursor: 'pointer', margin: 0 }}>
              🎯 Vendedor / Equipe Comercial
              <span style={{ display: 'block', fontSize: '11.5px', color: 'var(--color-ink-muted-80)', fontWeight: 400, marginTop: '2px' }}>
                Habilita a listagem deste usuário na seleção "Atribuir Vendedor" dos leads e agendamentos.
              </span>
            </label>
          </div>
        </div>

        <div style={{ padding: '20px 28px', borderTop: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-gold" onClick={handleSave}>
            {isEdit ? 'Salvar alterações' : 'Convidar usuário'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Users() {
  const { user, profile, rbacProfilesData } = useAuth();
  const canEdit = hasWritePermission(user, profile, rbacProfilesData, 'Usuários');
  const isMasterAdmin = Boolean(profile?.is_god || profile?.is_master || profile?.perfil === 'Administrador Master');
  const { equipe: team, perfisNomes, loading, convidar, atualizar, alternarAtivo, cancelarConvite, excluirUsuario } = useEquipe();
  const confirm = useConfirm();
  const [searchTerm, setSearchTerm] = useState('');
  const [perfilFilter, setPerfilFilter] = useState('Todos');
  const [modal, setModal] = useState(null);
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'list'

  const visibleTeam = useMemo(() => {
    if (isMasterAdmin) return team;
    return team.filter(u => u.perfil !== 'Administrador Master');
  }, [team, isMasterAdmin]);

  const availablePerfisNomes = useMemo(() => {
    if (isMasterAdmin) return perfisNomes;
    return perfisNomes.filter(p => p !== 'Administrador Master');
  }, [perfisNomes, isMasterAdmin]);

  const filtered = useMemo(() => {
    let list = visibleTeam;
    if (perfilFilter !== 'Todos') list = list.filter(u => u.perfil === perfilFilter);
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(u => u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.cargo.toLowerCase().includes(q));
    }
    return list;
  }, [visibleTeam, searchTerm, perfilFilter]);

  const stats = useMemo(() => ({
    total: visibleTeam.length,
    ativos: visibleTeam.filter(u => u.status === 'Ativo').length,
    pendentes: visibleTeam.filter(u => u.pendente).length,
    brokers: visibleTeam.filter(u => u.perfil === 'Broker' || (u.cargo && u.cargo.toLowerCase().includes('broker'))).length
  }), [visibleTeam]);

  const cargosSugestoes = useMemo(() => {
    const defaultCargos = [
      'Diretor Comercial', 'Broker Sênior', 'Broker', 'Consultor de Aquisições',
      'Analista de Documentação RAB', 'Piloto de Demonstração', 'Financeiro & Escrow', 'Marketing'
    ];
    const existing = visibleTeam.map(u => u.cargo).filter(Boolean);
    const combined = [...defaultCargos, ...existing];
    return Array.from(new Set(combined)).sort();
  }, [visibleTeam]);

  const handleSave = async (form) => {
    let res;
    if (form.id) {
      res = await atualizar(form);
      if (!res.error) toast.success('Usuário atualizado!');
    } else {
      res = await convidar(form);
      if (!res.error) toast.success(`Convite enviado para ${form.email}!`);
    }
    if (!res.error) setModal(null);
  };

  const toggleStatus = async (usr) => {
    if (usr.pendente) {
      const ok = await confirm({
        title: 'Cancelar Convite',
        message: `Tem certeza que deseja cancelar e excluir o convite de ${usr.nome}? Esta ação removerá o acesso permanentemente do Supabase.`,
        confirmText: 'Excluir Convite',
        cancelText: 'Manter',
        intent: 'danger'
      });
      if (!ok) return;

      const { error } = await cancelarConvite(usr.conviteId);
      if (!error) toast.success('Convite cancelado com sucesso.');
    } else {
      const { error } = await alternarAtivo(usr);
      if (!error) toast.success(`Usuário ${usr.status === 'Ativo' ? 'desativado' : 'reativado'} com sucesso.`);
    }
  };

  const handleDelete = async (usr) => {
    if (usr.pendente) {
      const ok = await confirm({
        title: 'Excluir Convite',
        message: `Tem certeza que deseja excluir o convite pendente de ${usr.nome}? Esta ação removerá o acesso permanentemente do Supabase.`,
        confirmText: 'Excluir Convite',
        cancelText: 'Manter',
        intent: 'danger'
      });
      if (!ok) return;

      const { error } = await cancelarConvite(usr.conviteId);
      if (!error) toast.success('Convite excluído com sucesso.');
    } else {
      const ok = await confirm({
        title: 'Excluir Usuário',
        message: `Tem certeza que deseja excluir permanentemente o usuário ${usr.nome}? Esta ação removerá o acesso permanentemente e não pode ser desfeita.`,
        confirmText: 'Excluir Usuário',
        cancelText: 'Cancelar',
        intent: 'danger'
      });
      if (!ok) return;

      const { error } = await excluirUsuario(usr.id);
      if (error) {
        toast.error(error.message || 'Erro ao excluir usuário.');
      } else {
        toast.success('Usuário excluído com sucesso.');
      }
    }
  };

  const handleImpersonate = async (usr) => {
    if (usr.email === user?.email) {
      toast.error('Você não pode simular você mesmo.');
      return;
    }

    const ok = await confirm({
      title: 'Simular Acesso de Usuário',
      message: `Tem certeza que deseja simular o acesso de ${usr.nome}? Você verá o sistema exatamente como ele o vê. Um backup da sua sessão atual será salvo para que você possa retornar a qualquer momento.`,
      confirmText: 'Simular Acesso',
      cancelText: 'Cancelar',
      intent: 'warning'
    });
    if (!ok) return;

    const promise = new Promise(async (resolve, reject) => {
      try {
        const { data, error } = await supabase.functions.invoke('impersonate', {
          body: { email: usr.email }
        });

        if (error || !data?.token) {
          let msg = error?.message || 'Falha ao gerar token de simulação';
          if (error?.context) {
            try {
              const body = await error.context.json();
              if (body?.error) msg = body.error;
            } catch (_) {}
          }
          throw new Error(msg);
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          window.localStorage.setItem('bless_admin_session_backup', JSON.stringify(session));
        }

        const { error: authError } = await supabase.auth.verifyOtp({
          email: usr.email,
          token: data.token,
          type: 'magiclink'
        });

        if (authError) {
          throw authError;
        }

        resolve(usr.nome);
      } catch (err) {
        reject(err);
      }
    });

    toast.promise(promise, {
      loading: 'Gerando sessão de simulação...',
      success: (nome) => {
        setTimeout(() => { window.location.href = '/'; }, 1000);
        return `Simulando acesso de ${nome}! Redirecionando...`;
      },
      error: (err) => `Erro ao simular: ${err.message}`
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center', color: 'var(--color-ink-muted-48)' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#C9A45C' }} />
        <span style={{ marginLeft: '10px', fontSize: '15px' }}>Carregando tripulação...</span>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="eyebrow-gold" style={{ marginBottom: '8px' }}>Administração</div>
          <h1 style={{ fontSize: '44px', fontWeight: 500, letterSpacing: '-0.5px', color: 'var(--color-ink)', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>
            Usuários
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--color-ink-muted-80)' }}>
            A tripulação da Bless — brokers, operações, documentação e financeiro.
          </p>
        </div>
        {canEdit && (
          <button className="btn-gold" onClick={() => setModal('new')}>
            <Plus size={16} /> Novo Usuário
          </button>
        )}
      </div>

      {/* Mini-stats */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '28px' }}>
        {[
          { label: 'Total de usuários', value: stats.total, cor: 'var(--color-ink)' },
          { label: 'Tripulação ativa', value: stats.ativos, cor: '#107c42' },
          { label: 'Convites pendentes', value: stats.pendentes, cor: '#d97706' },
          { label: 'Brokers comerciais', value: stats.brokers, cor: '#C9A45C' },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span style={{ fontSize: '28px', fontWeight: 800, color: s.cor, lineHeight: 1 }}>{s.value}</span>
            <span style={{ fontSize: '13px', color: 'var(--color-ink-muted-48)', fontWeight: 600 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Busca + filtro */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ flex: '1 1 320px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-ink-muted-48)' }} />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '13px 16px 13px 46px', borderRadius: '12px', border: '1px solid var(--color-hairline)', fontSize: '14px', backgroundColor: 'var(--color-canvas)', color: 'var(--color-ink)' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['Todos', ...availablePerfisNomes].map(p => (
              <button
                key={p}
                className={`filter-pill ${perfilFilter === p ? 'active' : ''}`}
                onClick={() => setPerfilFilter(p)}
                style={perfilFilter === p ? { background: 'linear-gradient(135deg, #D8BC85, #B08D45)', border: '1px solid transparent', color: '#17130A', fontWeight: 700 } : { border: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas)' }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="segmented-control" style={{ display: 'flex', padding: '4px', backgroundColor: 'var(--color-surface-pearl)', borderRadius: '10px', border: '1px solid var(--color-hairline)' }}>
          <button
            type="button"
            onClick={() => setViewMode('card')}
            title="Cards"
            style={{
              padding: '6px 12px',
              borderRadius: '7px',
              backgroundColor: viewMode === 'card' ? 'var(--color-canvas)' : 'transparent',
              color: viewMode === 'card' ? 'var(--color-primary)' : 'var(--color-ink-muted-48)',
              boxShadow: viewMode === 'card' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer'
            }}
          >
            <LayoutGrid size={15} /> Cards
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            title="Lista"
            style={{
              padding: '6px 12px',
              borderRadius: '7px',
              backgroundColor: viewMode === 'list' ? 'var(--color-canvas)' : 'transparent',
              color: viewMode === 'list' ? 'var(--color-primary)' : 'var(--color-ink-muted-48)',
              boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer'
            }}
          >
            <List size={15} /> Lista
          </button>
        </div>
      </div>

      {/* Tabela ou Cards */}
      {viewMode === 'card' ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '20px' }}>
            {filtered.map(usr => (
              <div
                key={usr.id}
                className="utility-card"
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  position: 'relative',
                  opacity: usr.status === 'Ativo' ? 1 : 0.6,
                  border: '1px solid var(--color-hairline)',
                  borderRadius: '16px',
                  backgroundColor: 'var(--color-canvas)'
                }}
              >
                {/* Info do Usuário */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <Avatar name={usr.nome} size={48} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-ink)', fontSize: '15.5px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {usr.nome}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-ink-muted-80)', marginTop: '2px' }}>
                      {usr.cargo}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)', marginTop: '4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {usr.email}
                    </div>
                  </div>
                </div>

                {/* Badges de Licença e Nível de Acesso */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 800,
                    color: perfilCor(usr.perfil), backgroundColor: `${perfilCor(usr.perfil)}14`,
                    borderRadius: '9999px', padding: '3px 10px',
                  }}>
                    <BadgeCheck size={12} /> {usr.perfil}
                  </span>
                  {usr.licenca && usr.licenca !== '—' && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700,
                      color: 'var(--color-primary)', backgroundColor: 'var(--color-surface-pearl)',
                      borderRadius: '9999px', padding: '3px 10px', border: '1px solid var(--color-hairline)'
                    }}>
                      <Plane size={11} /> {usr.licenca}
                    </span>
                  )}
                  <button
                    onClick={() => toggleStatus(usr)}
                    title={usr.pendente ? 'Cancelar convite' : usr.status === 'Ativo' ? 'Desativar' : 'Reativar'}
                    style={{
                      border: 'none',
                      cursor: canEdit ? 'pointer' : 'default',
                      pointerEvents: canEdit ? 'auto' : 'none',
                      fontFamily: 'inherit',
                      fontSize: '11px',
                      fontWeight: 800,
                      borderRadius: '9999px',
                      padding: '3px 10px',
                      color: usr.status === 'Ativo' ? '#107c42' : '#dc2626',
                      backgroundColor: usr.status === 'Ativo' ? 'rgba(16,124,66,0.1)' : 'rgba(220,38,38,0.08)',
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.filter = 'brightness(0.9)';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.filter = 'none';
                    }}
                  >
                    {usr.status}
                  </button>
                </div>

                {/* Negociações e Performance */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  backgroundColor: 'var(--color-surface-pearl)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--color-hairline)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-ink-muted-48)', fontWeight: 700 }}>Negociações</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 700, color: 'var(--color-primary)', fontSize: '13.5px' }}>
                      <Handshake size={14} /> {usr.negociacoes} ativas
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-ink-muted-48)', fontWeight: 700 }}>Vendas</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 700, color: '#107c42', fontSize: '13.5px' }}>
                      <Trophy size={14} /> {usr.vendasAno} no ano
                    </span>
                  </div>
                </div>

                {/* Rodapé: Ações e Acesso */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 'auto',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--color-divider-soft)'
                }}>
                  <div style={{ fontSize: '11.5px', color: 'var(--color-ink-muted-48)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={12} />
                    <span>{fmtUltimoAcesso(usr.ultimoAcesso)}</span>
                  </div>
                  <div style={{ display: canEdit ? 'flex' : 'none', gap: '4px' }}>
                    {usr.email !== user?.email && !usr.pendente && (
                      <button
                        onClick={() => handleImpersonate(usr)}
                        title="Simular Usuário"
                        style={{ padding: '6px', borderRadius: '8px', color: 'var(--color-ink-muted-48)', display: 'flex', border: 'none', background: 'none', cursor: 'pointer' }}
                        onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--color-surface-pearl)'; e.currentTarget.style.color = 'var(--color-gold)'; }}
                        onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-ink-muted-48)'; }}
                      >
                        <Eye size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => setModal(usr)}
                      title="Editar"
                      style={{ padding: '6px', borderRadius: '8px', color: 'var(--color-ink-muted-48)', display: 'flex', border: 'none', background: 'none', cursor: 'pointer' }}
                      onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--color-surface-pearl)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                      onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-ink-muted-48)'; }}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => toggleStatus(usr)}
                      title={usr.status === 'Ativo' ? 'Desativar' : 'Reativar'}
                      style={{ padding: '6px', borderRadius: '8px', color: 'var(--color-ink-muted-48)', display: 'flex', border: 'none', background: 'none', cursor: 'pointer' }}
                      onMouseOver={e => { e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.06)'; e.currentTarget.style.color = '#dc2626'; }}
                      onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-ink-muted-48)'; }}
                    >
                      <Power size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(usr)}
                      title="Excluir"
                      style={{ padding: '6px', borderRadius: '8px', color: 'var(--color-ink-muted-48)', display: 'flex', border: 'none', background: 'none', cursor: 'pointer' }}
                      onMouseOver={e => { e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.06)'; e.currentTarget.style.color = '#dc2626'; }}
                      onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-ink-muted-48)'; }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="utility-card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-ink-muted-48)', border: '1px solid var(--color-hairline)', borderRadius: '16px' }}>
              <UsersIcon size={40} style={{ marginBottom: '16px', opacity: 0.4, color: 'var(--color-ink-muted-48)' }} />
              <p style={{ fontSize: '15px', margin: 0 }}>Nenhum usuário encontrado.</p>
            </div>
          )}
        </>
      ) : (
        <div className="utility-card" style={{ padding: '8px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '900px' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--color-ink-muted-48)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  <th style={{ padding: '16px', fontWeight: 800 }}>Usuário</th>
                  <th style={{ padding: '16px', fontWeight: 800 }}>Cargo</th>
                  <th style={{ padding: '16px', fontWeight: 800 }}>Licença</th>
                  <th style={{ padding: '16px', fontWeight: 800 }}>Perfil</th>
                  <th style={{ padding: '16px', fontWeight: 800, textAlign: 'center' }}>Negociações</th>
                  <th style={{ padding: '16px', fontWeight: 800 }}>Último acesso</th>
                  <th style={{ padding: '16px', fontWeight: 800 }}>Status</th>
                  <th style={{ padding: '16px', fontWeight: 800, textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(usr => (
                  <tr key={usr.id} style={{ borderTop: '1px solid var(--color-divider-soft)', opacity: usr.status === 'Ativo' ? 1 : 0.55 }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Avatar name={usr.nome} size={38} />
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--color-ink)' }}>{usr.nome}</div>
                          <div style={{ fontSize: '12.5px', color: 'var(--color-ink-muted-48)' }}>{usr.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--color-ink-muted-80)' }}>{usr.cargo}</td>
                    <td style={{ padding: '14px 16px' }}>
                      {usr.licenca && usr.licenca !== '—' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700, color: 'var(--color-primary)' }}>
                          <Plane size={13} /> {usr.licenca}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-ink-muted-48)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 800,
                        color: perfilCor(usr.perfil), backgroundColor: `${perfilCor(usr.perfil)}14`,
                        borderRadius: '9999px', padding: '4px 11px',
                      }}>
                        <BadgeCheck size={12} /> {usr.perfil}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                        <span title="Negociações ativas" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'var(--color-primary)' }}>
                          <Handshake size={13} /> {usr.negociacoes}
                        </span>
                        <span title="Vendas no ano" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#107c42' }}>
                          <Trophy size={13} /> {usr.vendasAno}
                        </span>
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--color-ink-muted-80)' }}>
                        <Clock size={13} style={{ color: 'var(--color-ink-muted-48)' }} />
                        {fmtUltimoAcesso(usr.ultimoAcesso)}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => toggleStatus(usr)}
                        title={usr.pendente ? 'Cancelar convite' : usr.status === 'Ativo' ? 'Desativar' : 'Reativar'}
                        style={{
                          border: 'none',
                          cursor: canEdit ? 'pointer' : 'default',
                          pointerEvents: canEdit ? 'auto' : 'none',
                          fontFamily: 'inherit',
                          fontSize: '12px',
                          fontWeight: 800,
                          borderRadius: '9999px',
                          padding: '4px 11px',
                          color: usr.status === 'Ativo' ? '#107c42' : '#dc2626',
                          backgroundColor: usr.status === 'Ativo' ? 'rgba(16,124,66,0.10)' : 'rgba(220,38,38,0.08)',
                          transition: 'all 0.2s',
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.filter = 'brightness(0.9)';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.filter = 'none';
                        }}
                      >
                        {usr.status}
                      </button>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: canEdit ? 'inline-flex' : 'none', gap: '4px' }}>
                        {usr.email !== user?.email && !usr.pendente && (
                          <button
                            onClick={() => handleImpersonate(usr)}
                            title="Simular Usuário"
                            style={{ padding: '6px', borderRadius: '6px', color: 'var(--color-ink-muted-48)', border: 'none', background: 'none', cursor: 'pointer' }}
                            onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--color-surface-pearl)'; e.currentTarget.style.color = 'var(--color-gold)'; }}
                            onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-ink-muted-48)'; }}
                          >
                            <Eye size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => setModal(usr)}
                          title="Editar"
                          style={{ padding: '7px', borderRadius: '8px', color: 'var(--color-ink-muted-48)', display: 'flex', border: 'none', background: 'none', cursor: 'pointer' }}
                          onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--color-surface-pearl)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                          onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-ink-muted-48)'; }}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => toggleStatus(usr)}
                          title={usr.status === 'Ativo' ? 'Desativar' : 'Reativar'}
                          style={{ padding: '7px', borderRadius: '8px', color: 'var(--color-ink-muted-48)', display: 'flex', border: 'none', background: 'none', cursor: 'pointer' }}
                          onMouseOver={e => { e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.06)'; e.currentTarget.style.color = '#dc2626'; }}
                          onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-ink-muted-48)'; }}
                        >
                          <Power size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(usr)}
                          title="Excluir"
                          style={{ padding: '7px', borderRadius: '8px', color: 'var(--color-ink-muted-48)', display: 'flex', border: 'none', background: 'none', cursor: 'pointer' }}
                          onMouseOver={e => { e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.06)'; e.currentTarget.style.color = '#dc2626'; }}
                          onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-ink-muted-48)'; }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-ink-muted-48)' }}>
              <UsersIcon size={40} style={{ marginBottom: '16px', opacity: 0.4 }} />
              <p style={{ fontSize: '15px', margin: 0 }}>Nenhum usuário encontrado.</p>
            </div>
          )}
        </div>
      )}

      {modal && (
        <UserModal
          initial={modal === 'new' ? null : modal}
          perfisNomes={availablePerfisNomes}
          cargos={cargosSugestoes}
          isMasterAdmin={isMasterAdmin}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
