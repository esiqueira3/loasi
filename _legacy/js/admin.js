/**
 * Admin Panel Application Script
 * Gerenciamento de estado, autenticação e operações CRUD do Supabase + Cloudflare R2
 */

document.addEventListener('DOMContentLoaded', () => {
  initAdminApp();
});

let currentSession = null;
let igrejasList = [];

async function initAdminApp() {
  const supabase = window.getSupabaseClient ? window.getSupabaseClient() : null;

  if (!supabase) {
    console.error('Supabase Client não inicializado');
    return;
  }

  // Checar Sessão Atual
  const { data: { session } } = await supabase.auth.getSession();
  currentSession = session;
  updateAuthUI();

  // Escutar mudanças de autenticação
  supabase.auth.onAuthStateChange((_event, session) => {
    currentSession = session;
    updateAuthUI();
  });

  // Configurar Formulário de Login
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Configurar Logout
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', handleLogout);
  }

  // Navegação entre Abas
  setupTabNavigation();

  // Configurar Submissões de Formulários
  setupFormSubmissions();
}

function updateAuthUI() {
  const authOverlay = document.getElementById('authOverlay');
  const userEmailSpan = document.getElementById('userEmail');

  if (currentSession) {
    if (authOverlay) authOverlay.style.display = 'none';
    if (userEmailSpan) userEmailSpan.textContent = currentSession.user.email;
    loadAllAdminData();
  } else {
    if (authOverlay) authOverlay.style.display = 'flex';
  }
}

// ----------------------------------------------------
// AUTENTICAÇÃO (LOGIN / LOGOUT)
// ----------------------------------------------------
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errorDiv = document.getElementById('loginError');

  errorDiv.style.display = 'none';
  const supabase = window.getSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    errorDiv.textContent = 'Erro ao fazer login: ' + error.message;
    errorDiv.style.display = 'block';
  } else {
    showToast('Login efetuado com sucesso!');
  }
}

async function handleLogout() {
  const supabase = window.getSupabaseClient();
  await supabase.auth.signOut();
  showToast('Sessão encerrada.');
}

// ----------------------------------------------------
// TABS E CARREGAMENTO DE DADOS
// ----------------------------------------------------
function setupTabNavigation() {
  const navItems = document.querySelectorAll('.sidebar .nav-item');
  const tabContents = document.querySelectorAll('.tab-content');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');

      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      tabContents.forEach(content => {
        if (content.id === `tab-${targetTab}`) {
          content.style.display = 'block';
        } else {
          content.style.display = 'none';
        }
      });
    });
  });
}

async function loadAllAdminData() {
  await Promise.all([
    loadBanners(),
    loadEventos(),
    loadDepoimentos(),
    loadIgrejas(),
    loadDiretoria()
  ]);
}

// ----------------------------------------------------
// 1. GESTÃO DE BANNERS
// ----------------------------------------------------
async function loadBanners() {
  const supabase = window.getSupabaseClient();
  const { data: banners, error } = await supabase
    .from('banners')
    .select('*')
    .order('ordem', { ascending: true });

  const tbody = document.getElementById('bannersTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (error || !banners || banners.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Nenhum banner cadastrado.</td></tr>`;
    return;
  }

  banners.forEach(banner => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${banner.imagem_url}" alt="Banner"></td>
      <td><strong>${banner.titulo}</strong></td>
      <td>${banner.subtitulo || '-'}</td>
      <td><span style="color: ${banner.ativo ? 'var(--success-color)' : 'var(--danger-color)'}">${banner.ativo ? 'Ativo' : 'Inativo'}</span></td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="editBanner('${banner.id}')"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-danger btn-sm" onclick="deleteRecord('banners', '${banner.id}', loadBanners)"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.openBannerModal = function() {
  document.getElementById('bannerForm').reset();
  document.getElementById('bannerId').value = '';
  document.getElementById('bannerModalTitle').textContent = 'Novo Banner';
  document.getElementById('bannerPreview').style.display = 'none';
  openModal('bannerModal');
};

// ----------------------------------------------------
// 2. GESTÃO DE EVENTOS
// ----------------------------------------------------
async function loadEventos() {
  const supabase = window.getSupabaseClient();
  const { data: eventos, error } = await supabase
    .from('eventos')
    .select('*')
    .order('data_evento', { ascending: true });

  const tbody = document.getElementById('eventosTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (error || !eventos || eventos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Nenhum evento cadastrado.</td></tr>`;
    return;
  }

  eventos.forEach(evento => {
    const dataFormatada = new Date(evento.data_evento).toLocaleString('pt-BR');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${evento.imagem_url || 'images/slide-1.jpg'}" alt="Evento"></td>
      <td><strong>${evento.titulo}</strong></td>
      <td>${dataFormatada}</td>
      <td>${evento.local || '-'}</td>
      <td><span style="color: ${evento.ativo ? 'var(--success-color)' : 'var(--danger-color)'}">${evento.ativo ? 'Ativo' : 'Inativo'}</span></td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="editEvento('${evento.id}')"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-danger btn-sm" onclick="deleteRecord('eventos', '${evento.id}', loadEventos)"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.openEventoModal = function() {
  document.getElementById('eventoForm').reset();
  document.getElementById('eventoId').value = '';
  document.getElementById('eventoModalTitle').textContent = 'Novo Evento';
  document.getElementById('eventoPreview').style.display = 'none';
  openModal('eventoModal');
};

// ----------------------------------------------------
// 3. GESTÃO DE DEPOIMENTOS
// ----------------------------------------------------
async function loadDepoimentos() {
  const supabase = window.getSupabaseClient();
  const { data: depoimentos, error } = await supabase
    .from('depoimentos')
    .select('*')
    .order('created_at', { ascending: false });

  const tbody = document.getElementById('depoimentosTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (error || !depoimentos || depoimentos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Nenhum depoimento cadastrado.</td></tr>`;
    return;
  }

  depoimentos.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${item.foto_url || 'images/favicon.ico'}" alt="Foto" style="border-radius: 50%; width: 40px; height: 40px;"></td>
      <td><strong>${item.nome}</strong></td>
      <td>${item.cargo_ou_igreja || '-'}</td>
      <td><small>"${item.mensagem.substring(0, 50)}..."</small></td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteRecord('depoimentos', '${item.id}', loadDepoimentos)"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.openDepoimentoModal = function() {
  document.getElementById('depoimentoForm').reset();
  document.getElementById('depoimentoId').value = '';
  document.getElementById('depoimentoPreview').style.display = 'none';
  openModal('depoimentoModal');
};

// ----------------------------------------------------
// 4. GESTÃO DE IGREJAS
// ----------------------------------------------------
async function loadIgrejas() {
  const supabase = window.getSupabaseClient();
  const { data: igrejas, error } = await supabase
    .from('igrejas')
    .select('*')
    .order('nome', { ascending: true });

  igrejasList = igrejas || [];
  updateIgrejasSelect();

  const tbody = document.getElementById('igrejasTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (error || !igrejas || igrejas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Nenhuma igreja encontrada.</td></tr>`;
    return;
  }

  igrejas.forEach(igreja => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${igreja.foto_capa_url || 'images/slide-1.jpg'}" alt="Igreja"></td>
      <td><strong>${igreja.nome}</strong></td>
      <td>${igreja.cidade}</td>
      <td><small>${igreja.endereco}</small></td>
      <td><small>${igreja.horarios_culto || '-'}</small></td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="editIgreja('${igreja.id}')"><i class="fa-solid fa-pen"></i> Editar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function updateIgrejasSelect() {
  const select = document.getElementById('diretoriaIgreja');
  if (!select) return;
  select.innerHTML = '';

  igrejasList.forEach(igreja => {
    const opt = document.createElement('option');
    opt.value = igreja.id;
    opt.textContent = igreja.nome;
    select.appendChild(opt);
  });
}

window.editIgreja = function(id) {
  const igreja = igrejasList.find(i => i.id === id);
  if (!igreja) return;

  document.getElementById('igrejaId').value = igreja.id;
  document.getElementById('igrejaNome').value = igreja.nome;
  document.getElementById('igrejaEndereco').value = igreja.endereco;
  document.getElementById('igrejaTelefone').value = igreja.telefone || '';
  document.getElementById('igrejaHorarios').value = igreja.horarios_culto || '';
  
  if (igreja.foto_capa_url) {
    const img = document.getElementById('igrejaPreview');
    img.src = igreja.foto_capa_url;
    img.style.display = 'block';
  }

  openModal('igrejaModal');
};

// ----------------------------------------------------
// 5. GESTÃO DE DIRETORIA
// ----------------------------------------------------
async function loadDiretoria() {
  const supabase = window.getSupabaseClient();
  const { data: diretoria, error } = await supabase
    .from('diretoria')
    .select('*, igrejas(nome)')
    .order('ordem', { ascending: true });

  const tbody = document.getElementById('diretoriaTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (error || !diretoria || diretoria.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Nenhum membro cadastrado.</td></tr>`;
    return;
  }

  diretoria.forEach(membro => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${membro.foto_url || 'images/favicon.ico'}" alt="Foto" style="border-radius: 50%; width: 40px; height: 40px;"></td>
      <td><strong>${membro.nome}</strong></td>
      <td>${membro.cargo}</td>
      <td><small>${membro.igrejas ? membro.igrejas.nome : '-'}</small></td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteRecord('diretoria', '${membro.id}', loadDiretoria)"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.openDiretoriaModal = function() {
  document.getElementById('diretoriaForm').reset();
  document.getElementById('diretoriaId').value = '';
  document.getElementById('diretoriaPreview').style.display = 'none';
  openModal('diretoriaModal');
};

// ----------------------------------------------------
// SUBMISSÕES DE FORMULÁRIOS COM UPLOAD R2
// ----------------------------------------------------
function setupFormSubmissions() {
  // Banner Form Submit
  document.getElementById('bannerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const supabase = window.getSupabaseClient();
    const id = document.getElementById('bannerId').value;
    const fileInput = document.getElementById('bannerFile');
    
    let imagem_url = '';
    if (fileInput.files.length > 0) {
      imagem_url = await window.uploadImageToStorage(fileInput.files[0], 'banners');
    }

    const payload = {
      titulo: document.getElementById('bannerTitulo').value,
      subtitulo: document.getElementById('bannerSubtitulo').value,
      link_botao: document.getElementById('bannerLink').value,
      texto_botao: document.getElementById('bannerTextoBotao').value,
    };
    if (imagem_url) payload.imagem_url = imagem_url;

    let res;
    if (id) {
      res = await supabase.from('banners').update(payload).eq('id', id);
    } else {
      if (!imagem_url) payload.imagem_url = 'images/slide-1.jpg'; // fallback
      res = await supabase.from('banners').insert([payload]);
    }

    if (res.error) {
      alert('Erro ao salvar banner: ' + res.error.message);
    } else {
      closeModal('bannerModal');
      showToast('Banner salvo com sucesso!');
      loadBanners();
    }
  });

  // Evento Form Submit
  document.getElementById('eventoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const supabase = window.getSupabaseClient();
    const id = document.getElementById('eventoId').value;
    const fileInput = document.getElementById('eventoFile');

    let imagem_url = '';
    if (fileInput.files.length > 0) {
      imagem_url = await window.uploadImageToStorage(fileInput.files[0], 'eventos');
    }

    const payload = {
      titulo: document.getElementById('eventoTitulo').value,
      data_evento: document.getElementById('eventoData').value,
      local: document.getElementById('eventoLocal').value,
      descricao: document.getElementById('eventoDescricao').value,
    };
    if (imagem_url) payload.imagem_url = imagem_url;

    let res;
    if (id) {
      res = await supabase.from('eventos').update(payload).eq('id', id);
    } else {
      if (!imagem_url) payload.imagem_url = 'images/slide-1.jpg';
      res = await supabase.from('eventos').insert([payload]);
    }

    if (res.error) {
      alert('Erro ao salvar evento: ' + res.error.message);
    } else {
      closeModal('eventoModal');
      showToast('Evento salvo com sucesso!');
      loadEventos();
    }
  });

  // Depoimento Form Submit
  document.getElementById('depoimentoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const supabase = window.getSupabaseClient();
    const fileInput = document.getElementById('depoimentoFile');

    let foto_url = '';
    if (fileInput.files.length > 0) {
      foto_url = await window.uploadImageToStorage(fileInput.files[0], 'depoimentos');
    }

    const payload = {
      nome: document.getElementById('depoimentoNome').value,
      cargo_ou_igreja: document.getElementById('depoimentoCargo').value,
      mensagem: document.getElementById('depoimentoMensagem').value,
      foto_url: foto_url || 'images/user-1-100x100.jpg'
    };

    const res = await supabase.from('depoimentos').insert([payload]);
    if (res.error) {
      alert('Erro ao salvar depoimento: ' + res.error.message);
    } else {
      closeModal('depoimentoModal');
      showToast('Depoimento inserido com sucesso!');
      loadDepoimentos();
    }
  });

  // Diretoria Form Submit
  document.getElementById('diretoriaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const supabase = window.getSupabaseClient();
    const fileInput = document.getElementById('diretoriaFile');

    let foto_url = '';
    if (fileInput.files.length > 0) {
      foto_url = await window.uploadImageToStorage(fileInput.files[0], 'diretoria');
    }

    const payload = {
      igreja_id: document.getElementById('diretoriaIgreja').value,
      nome: document.getElementById('diretoriaNome').value,
      cargo: document.getElementById('diretoriaCargo').value,
      foto_url: foto_url || 'images/user-1-100x100.jpg'
    };

    const res = await supabase.from('diretoria').insert([payload]);
    if (res.error) {
      alert('Erro ao salvar membro: ' + res.error.message);
    } else {
      closeModal('diretoriaModal');
      showToast('Membro cadastrado com sucesso!');
      loadDiretoria();
    }
  });

  // Igreja Form Submit
  document.getElementById('igrejaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const supabase = window.getSupabaseClient();
    const id = document.getElementById('igrejaId').value;
    const fileInput = document.getElementById('igrejaFile');

    let foto_capa_url = '';
    if (fileInput.files.length > 0) {
      foto_capa_url = await window.uploadImageToStorage(fileInput.files[0], 'igrejas');
    }

    const payload = {
      nome: document.getElementById('igrejaNome').value,
      endereco: document.getElementById('igrejaEndereco').value,
      telefone: document.getElementById('igrejaTelefone').value,
      horarios_culto: document.getElementById('igrejaHorarios').value
    };
    if (foto_capa_url) payload.foto_capa_url = foto_capa_url;

    const res = await supabase.from('igrejas').update(payload).eq('id', id);
    if (res.error) {
      alert('Erro ao atualizar igreja: ' + res.error.message);
    } else {
      closeModal('igrejaModal');
      showToast('Dados da igreja atualizados!');
      loadIgrejas();
    }
  });
}

// ----------------------------------------------------
// UTILITÁRIOS GERAIS
// ----------------------------------------------------
window.openModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
};

window.closeModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
};

window.previewFile = function(input, previewId) {
  const preview = document.getElementById(previewId);
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(input.files[0]);
  }
};

window.deleteRecord = async function(table, id, reloadFn) {
  if (!confirm('Tem certeza que deseja excluir este item?')) return;
  const supabase = window.getSupabaseClient();
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) {
    alert('Erro ao excluir: ' + error.message);
  } else {
    showToast('Item excluído com sucesso!');
    reloadFn();
  }
};

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 3000);
  }
}
