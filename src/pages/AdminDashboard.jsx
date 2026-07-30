import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { uploadImageToStorage } from '../lib/r2'
import { Image, Calendar, MessageSquare, Church, Users, LogOut, Globe, Plus, Trash2, Edit } from 'lucide-react'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('banners')
  const [userEmail, setUserEmail] = useState('')
  
  // Data States
  const [banners, setBanners] = useState([])
  const [eventos, setEventos] = useState([])
  const [depoimentos, setDepoimentos] = useState([])
  const [igrejas, setIgrejas] = useState([])
  const [diretoria, setDiretoria] = useState([])

  // Modal & Form States
  const [modalType, setModalType] = useState(null) // 'banner', 'evento', 'depoimento', 'diretoria', 'igreja'
  const [formData, setFormData] = useState({})
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [toastMsg, setToastMsg] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUserEmail(session.user.email)
    })
    loadData()
  }, [])

  const loadData = async () => {
    const { data: b } = await supabase.from('banners').select('*').order('ordem', { ascending: true })
    if (b) setBanners(b)

    const { data: e } = await supabase.from('eventos').select('*').order('data_evento', { ascending: true })
    if (e) setEventos(e)

    const { data: d } = await supabase.from('depoimentos').select('*').order('created_at', { ascending: false })
    if (d) setDepoimentos(d)

    const { data: i } = await supabase.from('igrejas').select('*').order('nome', { ascending: true })
    if (i) setIgrejas(i)

    const { data: dir } = await supabase.from('diretoria').select('*, igrejas(nome)').order('ordem', { ascending: true })
    if (dir) setDiretoria(dir)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/admin')
  }

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  const openModal = (type, item = {}) => {
    setModalType(type)
    setFormData(item)
    setSelectedFile(null)
    setPreviewUrl(item.imagem_url || item.foto_url || item.foto_capa_url || '')
  }

  const closeModal = () => {
    setModalType(null)
    setFormData({})
    setSelectedFile(null)
    setPreviewUrl('')
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleDelete = async (table, id) => {
    if (!confirm('Deseja realmente excluir este item?')) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) {
      alert('Erro ao excluir: ' + error.message)
    } else {
      showToast('Item excluído com sucesso!')
      loadData()
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    let imgUrl = previewUrl

    if (selectedFile) {
      imgUrl = await uploadImageToStorage(selectedFile, modalType)
    }

    if (modalType === 'banner') {
      const payload = {
        titulo: formData.titulo,
        subtitulo: formData.subtitulo || '',
        link_botao: formData.link_botao || '',
        texto_botao: formData.texto_botao || 'Per saperne di più',
        imagem_url: imgUrl || 'images/slide-1.jpg'
      }
      if (formData.id) await supabase.from('banners').update(payload).eq('id', formData.id)
      else await supabase.from('banners').insert([payload])
    }

    else if (modalType === 'evento') {
      const payload = {
        titulo: formData.titulo,
        data_evento: formData.data_evento,
        local: formData.local || '',
        descricao: formData.descricao || '',
        imagem_url: imgUrl || 'images/slide-1.jpg'
      }
      if (formData.id) await supabase.from('eventos').update(payload).eq('id', formData.id)
      else await supabase.from('eventos').insert([payload])
    }

    else if (modalType === 'depoimento') {
      const payload = {
        nome: formData.nome,
        cargo_ou_igreja: formData.cargo_ou_igreja || '',
        mensagem: formData.mensagem,
        foto_url: imgUrl || 'images/favicon.ico'
      }
      if (formData.id) await supabase.from('depoimentos').update(payload).eq('id', formData.id)
      else await supabase.from('depoimentos').insert([payload])
    }

    else if (modalType === 'diretoria') {
      const payload = {
        igreja_id: formData.igreja_id || (igrejas[0] && igrejas[0].id),
        nome: formData.nome,
        cargo: formData.cargo,
        foto_url: imgUrl || 'images/favicon.ico'
      }
      if (formData.id) await supabase.from('diretoria').update(payload).eq('id', formData.id)
      else await supabase.from('diretoria').insert([payload])
    }

    else if (modalType === 'igreja') {
      const payload = {
        nome: formData.nome,
        endereco: formData.endereco,
        telefone: formData.telefone || '',
        horarios_culto: formData.horarios_culto || '',
        foto_capa_url: imgUrl || 'images/slide-1.jpg'
      }
      await supabase.from('igrejas').update(payload).eq('id', formData.id)
    }

    closeModal()
    showToast('Salvo com sucesso!')
    loadData()
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f1316', color: '#f0f4f8', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif" }}>
      
      {/* HEADER */}
      <header style={{
        backgroundColor: '#181e22',
        borderBottom: '1px solid #2c363f',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="images/logo-default-268x75.png" alt="L'Oasi Logo" style={{ height: '36px', objectFit: 'contain' }} />
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 900, color: '#c8a165' }}>L'OASI CMS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '0.85rem', color: '#9aa8b6' }}>{userEmail}</span>
          <a href="/" target="_blank" rel="noreferrer" style={{
            padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #2c363f', color: '#fff', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <Globe size={16} /> Ver Site
          </a>
          <button onClick={handleLogout} style={{
            padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: '#e63946', color: '#fff', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <LogOut size={16} /> Sair
          </button>
        </div>
      </header>

      {/* CONTAINER */}
      <div style={{ display: 'flex', flex: 1 }}>
        
        {/* SIDEBAR */}
        <aside style={{ width: '250px', backgroundColor: '#181e22', borderRight: '1px solid #2c363f', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { id: 'banners', label: 'Banners', icon: Image },
            { id: 'eventos', label: 'Eventos', icon: Calendar },
            { id: 'depoimentos', label: 'Depoimentos', icon: MessageSquare },
            { id: 'igrejas', label: 'Igrejas & Endereços', icon: Church },
            { id: 'diretoria', label: 'Diretoria / Liderança', icon: Users },
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <div 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  color: isActive ? '#000' : '#9aa8b6',
                  backgroundColor: isActive ? '#c8a165' : 'transparent',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={18} /> {tab.label}
              </div>
            )
          })}
        </aside>

        {/* MAIN CONTENT AREA */}
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          
          {/* TAB BANNERS */}
          {activeTab === 'banners' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>Gestão de Banners</h1>
                  <p style={{ color: '#9aa8b6', fontSize: '0.9rem', marginTop: '4px' }}>Altere os slides da página inicial do site.</p>
                </div>
                <button onClick={() => openModal('banner')} style={{
                  padding: '0.7rem 1.2rem', backgroundColor: '#c8a165', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <Plus size={18} /> Novo Banner
                </button>
              </div>

              <div style={{ backgroundColor: '#181e22', border: '1px solid #2c363f', borderRadius: '12px', padding: '1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #2c363f', textTransform: 'uppercase', fontSize: '0.8rem', color: '#9aa8b6', textAlign: 'left' }}>
                      <th style={{ padding: '1rem' }}>Imagem</th>
                      <th style={{ padding: '1rem' }}>Título</th>
                      <th style={{ padding: '1rem' }}>Subtítulo</th>
                      <th style={{ padding: '1rem' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {banners.map(b => (
                      <tr key={b.id} style={{ borderBottom: '1px solid #2c363f' }}>
                        <td style={{ padding: '1rem' }}><img src={b.imagem_url} alt="B" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} /></td>
                        <td style={{ padding: '1rem', fontWeight: 700 }}>{b.titulo}</td>
                        <td style={{ padding: '1rem', color: '#9aa8b6' }}>{b.subtitulo || '-'}</td>
                        <td style={{ padding: '1rem' }}>
                          <button onClick={() => openModal('banner', b)} style={{ background: 'none', border: '1px solid #2c363f', color: '#fff', padding: '6px 10px', borderRadius: '6px', marginRight: '8px', cursor: 'pointer' }}><Edit size={14} /></button>
                          <button onClick={() => handleDelete('banners', b.id)} style={{ background: '#e63946', border: 'none', color: '#fff', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB EVENTOS */}
          {activeTab === 'eventos' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>Gestão de Eventos</h1>
                  <p style={{ color: '#9aa8b6', fontSize: '0.9rem', marginTop: '4px' }}>Cadastre e atualize a agenda de cultos e eventos.</p>
                </div>
                <button onClick={() => openModal('evento')} style={{
                  padding: '0.7rem 1.2rem', backgroundColor: '#c8a165', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <Plus size={18} /> Novo Evento
                </button>
              </div>

              <div style={{ backgroundColor: '#181e22', border: '1px solid #2c363f', borderRadius: '12px', padding: '1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #2c363f', textTransform: 'uppercase', fontSize: '0.8rem', color: '#9aa8b6', textAlign: 'left' }}>
                      <th style={{ padding: '1rem' }}>Capa</th>
                      <th style={{ padding: '1rem' }}>Título</th>
                      <th style={{ padding: '1rem' }}>Data</th>
                      <th style={{ padding: '1rem' }}>Local</th>
                      <th style={{ padding: '1rem' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventos.map(ev => (
                      <tr key={ev.id} style={{ borderBottom: '1px solid #2c363f' }}>
                        <td style={{ padding: '1rem' }}><img src={ev.imagem_url || 'images/slide-1.jpg'} alt="E" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} /></td>
                        <td style={{ padding: '1rem', fontWeight: 700 }}>{ev.titulo}</td>
                        <td style={{ padding: '1rem', color: '#c8a165' }}>{new Date(ev.data_evento).toLocaleString('pt-BR')}</td>
                        <td style={{ padding: '1rem', color: '#9aa8b6' }}>{ev.local || '-'}</td>
                        <td style={{ padding: '1rem' }}>
                          <button onClick={() => openModal('evento', ev)} style={{ background: 'none', border: '1px solid #2c363f', color: '#fff', padding: '6px 10px', borderRadius: '6px', marginRight: '8px', cursor: 'pointer' }}><Edit size={14} /></button>
                          <button onClick={() => handleDelete('eventos', ev.id)} style={{ background: '#e63946', border: 'none', color: '#fff', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB DEPOIMENTOS */}
          {activeTab === 'depoimentos' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>Gestão de Depoimentos</h1>
                  <p style={{ color: '#9aa8b6', fontSize: '0.9rem', marginTop: '4px' }}>Adicione testemunhos e relatos de membros.</p>
                </div>
                <button onClick={() => openModal('depoimento')} style={{
                  padding: '0.7rem 1.2rem', backgroundColor: '#c8a165', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <Plus size={18} /> Novo Depoimento
                </button>
              </div>

              <div style={{ backgroundColor: '#181e22', border: '1px solid #2c363f', borderRadius: '12px', padding: '1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #2c363f', textTransform: 'uppercase', fontSize: '0.8rem', color: '#9aa8b6', textAlign: 'left' }}>
                      <th style={{ padding: '1rem' }}>Foto</th>
                      <th style={{ padding: '1rem' }}>Nome</th>
                      <th style={{ padding: '1rem' }}>Cargo / Igreja</th>
                      <th style={{ padding: '1rem' }}>Mensagem</th>
                      <th style={{ padding: '1rem' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {depoimentos.map(dep => (
                      <tr key={dep.id} style={{ borderBottom: '1px solid #2c363f' }}>
                        <td style={{ padding: '1rem' }}><img src={dep.foto_url || 'images/favicon.ico'} alt="D" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} /></td>
                        <td style={{ padding: '1rem', fontWeight: 700 }}>{dep.nome}</td>
                        <td style={{ padding: '1rem', color: '#9aa8b6' }}>{dep.cargo_ou_igreja || '-'}</td>
                        <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#ccc' }}>"{dep.mensagem.substring(0, 50)}..."</td>
                        <td style={{ padding: '1rem' }}>
                          <button onClick={() => handleDelete('depoimentos', dep.id)} style={{ background: '#e63946', border: 'none', color: '#fff', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB IGREJAS */}
          {activeTab === 'igrejas' && (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>Igrejas & Endereços</h1>
                <p style={{ color: '#9aa8b6', fontSize: '0.9rem', marginTop: '4px' }}>Edite os dados das comunidades de Latina, Terracina e Gaeta.</p>
              </div>

              <div style={{ backgroundColor: '#181e22', border: '1px solid #2c363f', borderRadius: '12px', padding: '1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #2c363f', textTransform: 'uppercase', fontSize: '0.8rem', color: '#9aa8b6', textAlign: 'left' }}>
                      <th style={{ padding: '1rem' }}>Capa</th>
                      <th style={{ padding: '1rem' }}>Comunidade</th>
                      <th style={{ padding: '1rem' }}>Endereço</th>
                      <th style={{ padding: '1rem' }}>Horários</th>
                      <th style={{ padding: '1rem' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {igrejas.map(ig => (
                      <tr key={ig.id} style={{ borderBottom: '1px solid #2c363f' }}>
                        <td style={{ padding: '1rem' }}><img src={ig.foto_capa_url || 'images/slide-1.jpg'} alt="I" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} /></td>
                        <td style={{ padding: '1rem', fontWeight: 700 }}>{ig.nome}</td>
                        <td style={{ padding: '1rem', color: '#9aa8b6', fontSize: '0.85rem' }}>{ig.endereco}</td>
                        <td style={{ padding: '1rem', color: '#c8a165', fontSize: '0.85rem' }}>{ig.horarios_culto || '-'}</td>
                        <td style={{ padding: '1rem' }}>
                          <button onClick={() => openModal('igreja', ig)} style={{ background: 'none', border: '1px solid #2c363f', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Edit size={14} /> Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB DIRETORIA */}
          {activeTab === 'diretoria' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>Diretoria & Liderança</h1>
                  <p style={{ color: '#9aa8b6', fontSize: '0.9rem', marginTop: '4px' }}>Cadastre a diretoria vinculada a cada igreja.</p>
                </div>
                <button onClick={() => openModal('diretoria')} style={{
                  padding: '0.7rem 1.2rem', backgroundColor: '#c8a165', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <Plus size={18} /> Novo Membro
                </button>
              </div>

              <div style={{ backgroundColor: '#181e22', border: '1px solid #2c363f', borderRadius: '12px', padding: '1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #2c363f', textTransform: 'uppercase', fontSize: '0.8rem', color: '#9aa8b6', textAlign: 'left' }}>
                      <th style={{ padding: '1rem' }}>Foto</th>
                      <th style={{ padding: '1rem' }}>Nome</th>
                      <th style={{ padding: '1rem' }}>Cargo</th>
                      <th style={{ padding: '1rem' }}>Igreja</th>
                      <th style={{ padding: '1rem' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diretoria.map(d => (
                      <tr key={d.id} style={{ borderBottom: '1px solid #2c363f' }}>
                        <td style={{ padding: '1rem' }}><img src={d.foto_url || 'images/favicon.ico'} alt="D" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} /></td>
                        <td style={{ padding: '1rem', fontWeight: 700 }}>{d.nome}</td>
                        <td style={{ padding: '1rem', color: '#c8a165' }}>{d.cargo}</td>
                        <td style={{ padding: '1rem', color: '#9aa8b6', fontSize: '0.85rem' }}>{d.igrejas ? d.igrejas.nome : '-'}</td>
                        <td style={{ padding: '1rem' }}>
                          <button onClick={() => handleDelete('diretoria', d.id)} style={{ background: '#e63946', border: 'none', color: '#fff', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL EDIT/ADD */}
      {modalType && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#181e22', border: '1px solid #2c363f', borderRadius: '16px', padding: '2rem', width: '90%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#c8a165', margin: 0, fontSize: '1.3rem' }}>
                {modalType === 'banner' && 'Gestão de Banner'}
                {modalType === 'evento' && 'Gestão de Evento'}
                {modalType === 'depoimento' && 'Gestão de Depoimento'}
                {modalType === 'diretoria' && 'Gestão de Diretoria'}
                {modalType === 'igreja' && 'Editar Igreja'}
              </h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#9aa8b6', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              
              {/* BANNERS & EVENTOS TITULO */}
              {(modalType === 'banner' || modalType === 'evento' || modalType === 'depoimento' || modalType === 'diretoria' || modalType === 'igreja') && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#9aa8b6', marginBottom: '0.4rem' }}>
                    {modalType === 'depoimento' || modalType === 'diretoria' ? 'Nome Completo' : 'Título / Nome'}
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formData.titulo || formData.nome || ''} 
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value, nome: e.target.value })} 
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: '#232b31', border: '1px solid #2c363f', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                </div>
              )}

              {/* EVENTO DATA */}
              {modalType === 'evento' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#9aa8b6', marginBottom: '0.4rem' }}>Data e Horário</label>
                  <input 
                    type="datetime-local" 
                    required 
                    value={formData.data_evento || ''} 
                    onChange={(e) => setFormData({ ...formData, data_evento: e.target.value })} 
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: '#232b31', border: '1px solid #2c363f', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                </div>
              )}

              {/* DIRETORIA CARGO */}
              {modalType === 'diretoria' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#9aa8b6', marginBottom: '0.4rem' }}>Igreja</label>
                    <select 
                      value={formData.igreja_id || (igrejas[0] && igrejas[0].id) || ''} 
                      onChange={(e) => setFormData({ ...formData, igreja_id: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', backgroundColor: '#232b31', border: '1px solid #2c363f', borderRadius: '8px', color: '#fff', outline: 'none' }}
                    >
                      {igrejas.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#9aa8b6', marginBottom: '0.4rem' }}>Cargo</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="ex: Pastor Presidente, Tesoureiro" 
                      value={formData.cargo || ''} 
                      onChange={(e) => setFormData({ ...formData, cargo: e.target.value })} 
                      style={{ width: '100%', padding: '0.75rem', backgroundColor: '#232b31', border: '1px solid #2c363f', borderRadius: '8px', color: '#fff', outline: 'none' }}
                    />
                  </div>
                </>
              )}

              {/* DEPOIMENTO MENSAGEM */}
              {modalType === 'depoimento' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#9aa8b6', marginBottom: '0.4rem' }}>Mensagem / Testemunho</label>
                  <textarea 
                    required 
                    rows={4} 
                    value={formData.mensagem || ''} 
                    onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })} 
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: '#232b31', border: '1px solid #2c363f', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                </div>
              )}

              {/* FILE UPLOAD & PREVIEW */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9aa8b6', marginBottom: '0.4rem' }}>Foto / Imagem (Cloudflare R2)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  style={{ width: '100%', padding: '0.6rem', backgroundColor: '#232b31', border: '1px solid #2c363f', borderRadius: '8px', color: '#fff' }}
                />
                {previewUrl && (
                  <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', marginTop: '0.8rem', border: '1px dashed #2c363f' }} />
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                <button type="button" onClick={closeModal} style={{ padding: '0.7rem 1.2rem', background: 'none', border: '1px solid #2c363f', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '0.7rem 1.5rem', backgroundColor: '#c8a165', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Salvar Dados</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: '20px', right: '20px', backgroundColor: '#2a9d8f', color: '#fff', padding: '1rem 1.5rem', borderRadius: '8px', fontWeight: 600, zIndex: 3000
        }}>
          {toastMsg}
        </div>
      )}

    </div>
  )
}
