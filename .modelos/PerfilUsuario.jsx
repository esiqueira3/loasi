import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Shield, Plus, X, Users as UsersIcon, Save, Lock, Eye, CheckCircle2,
  TowerControl, Tags, BarChart2, Settings, Crown, Loader2, Plane,
  Pencil, Trash2, TrendingUp, Wallet, User, FileText, Radar
} from 'lucide-react';
import { SYSTEM_MODULES } from '../data/blessMockData';
import { usePerfis } from '../hooks/useBlessData';
import { useAuth } from '../contexts/AuthContext';
import { useConfirm } from '../contexts/ConfirmContext';

function OwnOnlyToggle({ checked, disabled, onChange }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      title={
        disabled
          ? 'Disponível para os níveis de acesso leitura ou total'
          : checked
          ? 'Restrito: O usuário visualiza apenas os seus próprios registros'
          : 'Amplo: O usuário visualiza os registros de toda a equipe'
      }
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '9px',
        padding: '6px 14px 6px 10px',
        borderRadius: '9999px',
        border: checked
          ? '1px solid rgba(201, 164, 92, 0.45)'
          : '1px solid var(--color-hairline)',
        backgroundColor: checked
          ? 'rgba(201, 164, 92, 0.08)'
          : 'var(--color-canvas)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: 'none',
        outline: 'none',
        boxShadow: checked
          ? '0 2px 8px -2px rgba(201, 164, 92, 0.25)'
          : 'none',
      }}
    >
      <User
        size={13}
        style={{
          color: checked ? 'var(--color-gold)' : 'var(--color-ink-muted-48)',
          transition: 'color 0.2s ease',
          flexShrink: 0,
        }}
      />

      <div
        style={{
          width: '28px',
          height: '16px',
          borderRadius: '9999px',
          backgroundColor: checked ? '#C9A45C' : 'var(--color-hairline)',
          position: 'relative',
          transition: 'background-color 0.2s ease',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            position: 'absolute',
            top: '2px',
            left: checked ? '14px' : '2px',
            transition: 'left 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          }}
        />
      </div>

      <span
        style={{
          fontSize: '12px',
          color: checked ? 'var(--color-ink)' : 'var(--color-ink-muted-80)',
          fontWeight: checked ? 700 : 500,
          letterSpacing: '-0.1px',
          whiteSpace: 'nowrap',
        }}
      >
        Apenas seus registros
      </span>
    </button>
  );
}

const NIVEIS = [
  { key: 'nenhum', label: 'Sem acesso', icon: <Lock size={13} />, cor: '#dc2626' },
  { key: 'leitura', label: 'Somente leitura', icon: <Eye size={13} />, cor: '#d97706' },
  { key: 'total', label: 'Acesso total', icon: <CheckCircle2 size={13} />, cor: '#107c42' },
];

const MODULE_ICONS = {
  'Torre de Controle': <TowerControl size={16} />,
  'Aeronaves': <Plane size={16} />,
  'Categorias': <Tags size={16} />,
  'Vendas': <TrendingUp size={16} />,
  'Agente RAB': <Radar size={16} />,
  'Financeiro': <Wallet size={16} />,
  'Clientes': <UsersIcon size={16} />,
  'Relatórios': <BarChart2 size={16} />,
  'Usuários': <UsersIcon size={16} />,
  'Perfis de Acesso': <Shield size={16} />,
  'Logs do Sistema': <FileText size={16} />,
  'Configurações': <Settings size={16} />,
};

export function PerfilUsuario() {
  const { perfis: profiles, loading, salvarPermissoes, criar, atualizar, excluir } = usePerfis();
  const { profile, retryProfile } = useAuth();
  const confirm = useConfirm();
  const [selectedId, setSelectedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [profileForm, setProfileForm] = useState({ id: null, nome: '', descricao: '', oldNome: '' });
  const [localPermissoes, setLocalPermissoes] = useState({});
  const [showInfo, setShowInfo] = useState(false);

  const loggedInIsMaster = Boolean(profile?.is_god || profile?.is_master || profile?.perfil === 'Administrador Master');

  const visibleProfiles = useMemo(() => {
    if (loggedInIsMaster) return profiles;
    return profiles.filter(p => !p.sistema && p.nome !== 'Administrador Master');
  }, [profiles, loggedInIsMaster]);

  useEffect(() => {
    if (visibleProfiles.length > 0 && (!selectedId || !visibleProfiles.some(p => p.id === selectedId))) {
      setSelectedId(visibleProfiles[0].id);
    }
  }, [visibleProfiles, selectedId]);

  const selected = visibleProfiles.find(p => p.id === selectedId) || visibleProfiles[0];

  useEffect(() => {
    if (selected) {
      setLocalPermissoes(selected.permissoes || {});
    }
  }, [selectedId, selected]);

  const setPermission = (modulo, nivel) => {
    if (selected?.sistema) {
      toast.error('O perfil Administrador Master é do sistema e não pode ser alterado.');
      return;
    }
    setLocalPermissoes(prev => ({ ...prev, [modulo]: nivel }));
  };

  const toggleOwnOnly = (modulo, val) => {
    if (selected?.sistema) {
      toast.error('O perfil Administrador Master é do sistema e não pode ser alterado.');
      return;
    }
    setLocalPermissoes(prev => ({ ...prev, [`${modulo}_apenas_seus`]: val }));
  };

  const handleSave = async () => {
    if (!selected) return;
    const res = await salvarPermissoes(selected.id, localPermissoes);
    if (!res.error) {
      toast.success('Permissões salvas!');
      if (selected.nome === profile?.perfil) {
        await retryProfile();
      }
    } else {
      toast.error('Erro ao salvar permissões.');
    }
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setProfileForm({ id: null, nome: '', descricao: '', oldNome: '' });
    setModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setModalMode('edit');
    setProfileForm({ id: p.id, nome: p.nome, descricao: p.descricao || '', oldNome: p.nome });
    setModalOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!profileForm.nome.trim()) { toast.error('Informe o nome do perfil.'); return; }

    if (modalMode === 'create') {
      const initialPermissoes = Object.fromEntries(SYSTEM_MODULES.map(m => [m, m === 'Torre de Controle' ? 'leitura' : 'nenhum']));
      const CORES = ['#0891b2', '#d97706', '#dc2626', '#4C5FD5', '#8b5cf6'];
      const cor = CORES[profiles.length % CORES.length];

      const res = await criar(profileForm.nome.trim(), cor, initialPermissoes, profileForm.descricao.trim());
      if (!res.error) {
        toast.success(`Perfil "${profileForm.nome.trim()}" criado!`);
        setModalOpen(false);
      } else {
        toast.error('Erro ao criar perfil.');
      }
    } else {
      const res = await atualizar(profileForm.id, profileForm.oldNome, profileForm.nome.trim(), profileForm.descricao.trim());
      if (!res.error) {
        toast.success('Perfil atualizado com sucesso!');
        if (profileForm.oldNome === profile?.perfil) {
          await retryProfile();
        }
        setModalOpen(false);
      } else {
        toast.error('Erro ao atualizar perfil.');
      }
    }
  };

  const handleDelete = async (perfil) => {
    if (perfil.sistema) { toast.error('Perfis do sistema não podem ser excluídos.'); return; }
    
    if (perfil.usuarios > 0) {
      await confirm({
        title: 'Não é possível excluir este perfil',
        message: `O perfil "${perfil.nome}" está atualmente atrelado a ${perfil.usuarios} usuário(s)/convite(s). Para excluí-lo, altere o perfil desses usuários primeiro.`,
        confirmText: 'Entendido',
        cancelText: null,
        intent: 'warning'
      });
      return;
    }

    const ok = await confirm({
      title: 'Excluir Perfil de Acesso',
      message: `Tem certeza que deseja excluir o perfil "${perfil.nome}"? Esta ação é irreversível e removerá todas as configurações de permissões associadas a ele.`,
      confirmText: 'Excluir Perfil',
      cancelText: 'Cancelar',
      intent: 'danger'
    });
    if (!ok) return;

    const res = await excluir(perfil.id);
    if (!res.error) {
      toast.success('Perfil excluído com sucesso.');
      setSelectedId(null);
    } else {
      toast.error(res.error?.message || 'Erro ao excluir perfil.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center', color: 'var(--color-ink-muted-48)' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#C9A45C' }} />
        <span style={{ marginLeft: '10px', fontSize: '15px' }}>Carregando perfis...</span>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="eyebrow-gold" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>Administração</span>
            <button
              type="button"
              onClick={() => setShowInfo(true)}
              style={{
                height: '24px',
                padding: '0 10px',
                borderRadius: '6px',
                backgroundColor: '#1E1E1E',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Info
            </button>
          </div>
          <h1 style={{ fontSize: '44px', fontWeight: 500, letterSpacing: '-0.5px', color: 'var(--color-ink)', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>
            Perfis de Acesso
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--color-ink-muted-80)' }}>
            Defina o que cada função da equipe pode ver e fazer em cada módulo do sistema.
          </p>
        </div>
        <button className="btn-gold" onClick={handleOpenCreate}>
          <Plus size={16} /> Novo Perfil
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '24px', alignItems: 'start' }}>

        {/* Lista de perfis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {visibleProfiles.map(p => (
            <div
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              style={{
                textAlign: 'left',
                padding: '18px',
                borderRadius: '16px',
                border: selectedId === p.id ? `1.5px solid ${p.cor}` : '1px solid var(--color-hairline)',
                backgroundColor: selectedId === p.id ? `${p.cor}0d` : 'var(--color-canvas)',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: `${p.cor}16`, color: p.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {p.sistema ? <Crown size={20} /> : <Shield size={20} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nome}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: p.cor, backgroundColor: `${p.cor}14`, borderRadius: '9999px', padding: '2px 9px', whiteSpace: 'nowrap' }}>
                      {p.usuarios} {p.usuarios === 1 ? 'usr' : 'usrs'}
                    </span>
                    {!p.sistema && (
                      <div style={{ display: 'flex', gap: '2px' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenEdit(p); }}
                          title="Editar Perfil"
                          style={{ border: 'none', background: 'none', padding: '4px', cursor: 'pointer', color: 'var(--color-ink-muted-48)', display: 'flex', borderRadius: '4px' }}
                          onMouseOver={e => { e.currentTarget.style.color = p.cor; e.currentTarget.style.backgroundColor = `${p.cor}12`; }}
                          onMouseOut={e => { e.currentTarget.style.color = 'var(--color-ink-muted-48)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(p); }}
                          disabled={p.usuarios > 0}
                          title={p.usuarios > 0 ? `Não é possível excluir: perfil atrelado a ${p.usuarios} usuário(s)` : "Excluir Perfil"}
                          style={{ 
                            border: 'none', 
                            background: 'none', 
                            padding: '4px', 
                            cursor: p.usuarios > 0 ? 'not-allowed' : 'pointer', 
                            color: p.usuarios > 0 ? 'var(--color-hairline)' : 'var(--color-ink-muted-48)', 
                            opacity: p.usuarios > 0 ? 0.35 : 1,
                            display: 'flex', 
                            borderRadius: '4px',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseOver={e => {
                            if (p.usuarios === 0) {
                              e.currentTarget.style.color = '#dc2626';
                              e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.08)';
                            }
                          }}
                          onMouseOut={e => {
                            if (p.usuarios === 0) {
                              e.currentTarget.style.color = 'var(--color-ink-muted-48)';
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--color-ink-muted-80)', lineHeight: 1.5, marginTop: '4px' }}>
                  {p.descricao}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Matriz de permissões */}
        {selected && (() => {
          const isMasterSystem = Boolean(selected.sistema || selected.nome === 'Administrador Master');

          return (
            <div className="utility-card" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '13px', backgroundColor: `${selected.cor}16`, color: selected.cor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isMasterSystem ? <Crown size={22} /> : <Shield size={22} />}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>{selected.nome}</h3>
                    <span style={{ fontSize: '12.5px', color: 'var(--color-ink-muted-48)' }}>
                      {isMasterSystem ? 'Perfil nativo do sistema — acesso total e irrestrito a todos os módulos' : 'Clique nos níveis para ajustar as permissões'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {isMasterSystem ? (
                    <span style={{ fontSize: '12px', fontWeight: 700, padding: '7px 14px', borderRadius: '8px', backgroundColor: 'rgba(16, 124, 66, 0.12)', color: '#107c42', border: '1px solid rgba(16, 124, 66, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Crown size={14} /> Acesso Irrestrito
                    </span>
                  ) : (
                    <>
                      <button 
                        className="btn-cancel" 
                        onClick={() => handleDelete(selected)} 
                        disabled={selected.usuarios > 0}
                        title={selected.usuarios > 0 ? `Não é possível excluir: perfil atrelado a ${selected.usuarios} usuário(s)` : "Excluir perfil"}
                        style={{ 
                          padding: '8px 14px', 
                          fontSize: '13px',
                          opacity: selected.usuarios > 0 ? 0.4 : 1,
                          cursor: selected.usuarios > 0 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <X size={14} /> Excluir
                      </button>
                      <button className="btn-gold" onClick={handleSave} style={{ padding: '8px 16px', fontSize: '13px' }}>
                        <Save size={14} /> Salvar
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Legenda */}
              <div style={{ display: 'flex', gap: '18px', margin: '18px 0 22px', flexWrap: 'wrap' }}>
                {NIVEIS.map(n => (
                  <span key={n.key} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600, color: n.cor }}>
                    {n.icon} {n.label}
                  </span>
                ))}
              </div>

              {/* Módulos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {SYSTEM_MODULES.map(modulo => {
                  const nivelAtual = isMasterSystem ? 'total' : (localPermissoes[modulo] || 'nenhum');
                  const apenasSeus = isMasterSystem ? false : Boolean(localPermissoes[`${modulo}_apenas_seus`]);

                  return (
                    <div key={modulo} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', padding: '14px 16px', borderRadius: '13px', border: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-surface-pearl)', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-ink)', fontWeight: 700, fontSize: '14px' }}>
                        <span style={{ color: 'var(--color-primary)', display: 'flex' }}>{MODULE_ICONS[modulo]}</span>
                        {modulo}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <OwnOnlyToggle
                          checked={apenasSeus}
                          disabled={isMasterSystem || nivelAtual === 'nenhum'}
                          onChange={(val) => toggleOwnOnly(modulo, val)}
                        />

                        <div className="segmented-control" style={{ boxShadow: 'none' }}>
                          {NIVEIS.map(n => {
                            const ativo = nivelAtual === n.key;
                            return (
                              <button
                                key={n.key}
                                onClick={() => setPermission(modulo, n.key)}
                                title={n.label}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                                  fontSize: '12px', fontWeight: 700, padding: '7px 13px',
                                  backgroundColor: ativo ? n.cor : 'transparent',
                                  color: ativo ? '#fff' : 'var(--color-ink-muted-48)',
                                  cursor: isMasterSystem ? 'not-allowed' : 'pointer',
                                  opacity: isMasterSystem && !ativo ? 0.4 : 1,
                                }}
                              >
                                {n.icon}
                                <span className="perm-label">{n.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Modal Novo / Editar Perfil */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(10,13,22,0.55)', backdropFilter: 'blur(4px)' }} onClick={() => setModalOpen(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: '460px', backgroundColor: 'var(--color-canvas)', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)', padding: '28px' }}>
            <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--color-ink)', marginBottom: '6px' }}>
              {modalMode === 'create' ? 'Novo Perfil de Acesso' : 'Editar Perfil de Acesso'}
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--color-ink-muted-80)', marginBottom: '20px' }}>
              {modalMode === 'create' 
                ? 'Crie um perfil e ajuste as permissões módulo a módulo em seguida.' 
                : 'Altere o nome e a descrição do perfil de acesso. As alterações serão refletidas em todos os usuários vinculados.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-ink)', display: 'block', marginBottom: '6px' }}>Nome do perfil *</label>
                <input
                  value={profileForm.nome}
                  onChange={e => setProfileForm({ ...profileForm, nome: e.target.value })}
                  placeholder="Ex.: Marketing, Estagiário, Auditor..."
                  autoFocus
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-ink)', display: 'block', marginBottom: '6px' }}>Descrição</label>
                <textarea
                  value={profileForm.descricao}
                  onChange={e => setProfileForm({ ...profileForm, descricao: e.target.value })}
                  placeholder="Ex.: Responsável pelas campanhas e análise de métricas."
                  rows={3}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    borderRadius: '10px', 
                    border: '1px solid var(--color-hairline)', 
                    backgroundColor: 'var(--color-canvas)', 
                    color: 'var(--color-ink)', 
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'none',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button className="btn-gold" onClick={handleSaveProfile}>
                {modalMode === 'create' ? 'Criar perfil' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showInfo && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(10,13,22,0.55)', backdropFilter: 'blur(4px)' }} onClick={() => setShowInfo(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: '640px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-canvas)', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)', overflow: 'hidden' }}>
            
            {/* Header */}
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Shield size={20} style={{ color: 'var(--color-gold)' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--color-ink)' }}>
                  Sobre os Perfis de Acesso (RBAC)
                </h3>
              </div>
              <button onClick={() => setShowInfo(false)} style={{ background: 'none', border: 'none', color: 'var(--color-ink-muted-48)', cursor: 'pointer', display: 'flex' }}>
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '14.5px', color: 'var(--color-ink)', lineHeight: 1.6 }}>
              <p style={{ margin: 0 }}>
                O módulo de <strong>Perfis de Acesso</strong> implementa a arquitetura de controle de permissões baseada em funções (RBAC - Role-Based Access Control). Ele define com precisão cirúrgica o nível de visibilidade de cada membro da tripulação Bless Aviation.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <strong style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-ink-muted-80)' }}>Níveis de Acesso</strong>
                
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(220,38,38,0.1)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                    <Lock size={12} />
                  </div>
                  <div>
                    <strong style={{ color: 'var(--color-ink)' }}>Sem acesso:</strong>
                    <span style={{ fontSize: '13.5px', color: 'var(--color-ink-muted-80)', display: 'block', marginTop: '2px' }}>O módulo fica invisível no menu lateral e qualquer tentativa de acesso via URL é bloqueada.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(217,119,6,0.1)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                    <Eye size={12} />
                  </div>
                  <div>
                    <strong style={{ color: 'var(--color-ink)' }}>Somente leitura:</strong>
                    <span style={{ fontSize: '13.5px', color: 'var(--color-ink-muted-80)', display: 'block', marginTop: '2px' }}>O usuário pode visualizar os dados e listagens do módulo, mas todos os botões de ação (Criar, Editar, Excluir) são removidos.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(16,124,66,0.1)', color: '#107c42', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                    <CheckCircle2 size={12} />
                  </div>
                  <div>
                    <strong style={{ color: 'var(--color-ink)' }}>Acesso total:</strong>
                    <span style={{ fontSize: '13.5px', color: 'var(--color-ink-muted-80)', display: 'block', marginTop: '2px' }}>Controle operacional completo. Permite criar registros, alterar configurações e realizar exclusões.</span>
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px 20px', borderRadius: '14px', backgroundColor: 'rgba(201,164,92,0.06)', border: '1px solid rgba(201,164,92,0.15)', marginTop: '8px' }}>
                <span style={{ fontSize: '16px', display: 'block', marginBottom: '6px' }}>🛡️ <strong>Regra de Segurança Master</strong></span>
                O perfil <strong>Administrador Master</strong> é um perfil de sistema autoprotegido. Suas permissões não podem ser alteradas ou excluídas, garantindo que o sistema sempre possua ao menos um operador com controle total ativo.
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 28px', borderTop: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'flex-end', backgroundColor: 'var(--color-surface-pearl)' }}>
              <button className="btn-gold" style={{ padding: '8px 24px', cursor: 'pointer' }} onClick={() => setShowInfo(false)}>Entendido</button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
