/**
 * Public Pages Dynamic Content Loader
 * Carrega os dados dinâmicos do Supabase (Banners, Eventos, Depoimentos, Igrejas e Diretoria)
 * mantendo o design e layout original do site estático.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Inicializa a API
  if (window.LoasiAPI) {
    try {
      await loadDynamicBanners();
      await loadDynamicEventos();
      await loadDynamicDepoimentos();
      await loadDynamicChurchPage();
    } catch (e) {
      console.warn('Usando fallback estático das páginas:', e);
    }
  }
});

/**
 * 1. BANNERS DINÂMICOS NA HOME (index.html)
 */
async function loadDynamicBanners() {
  const swiperWrapper = document.querySelector('.swiper-slider .swiper-wrapper');
  if (!swiperWrapper) return;

  const banners = await window.LoasiAPI.getBanners();
  if (!banners || banners.length === 0) return; // Mantém o HTML estático padrão se não houver registros

  let html = '';
  banners.forEach((banner, idx) => {
    html += `
      <div class="swiper-slide swiper-slide-${idx + 1}" data-slide-bg="${banner.imagem_url}">
        <div class="swiper-slide-caption section-md">
          <div class="container">
            <div class="row justify-content-center">
              <div class="col-lg-10 col-xl-8 col-xxl-7">
                <h1 class="swiper-title-1" data-caption-animate="fadeInLeft" data-caption-delay="100">${banner.titulo}</h1>
                ${banner.subtitulo ? `<p class="swiper-title-2 d-none d-sm-block" data-caption-animate="fadeInLeft" data-caption-delay="250">${banner.subtitulo}</p>` : ''}
                <div class="button-wrap" data-caption-animate="fadeInLeft" data-caption-delay="400">
                  <a class="link-classic box-info-renee-link" href="${banner.link_botao || 'about-us.html'}">${banner.texto_botao || 'Per saperne di più'}</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  swiperWrapper.innerHTML = html;
}

/**
 * 2. EVENTOS DINÂMICOS NA HOME (index.html)
 */
async function loadDynamicEventos() {
  const eventosContainer = document.querySelector('#secao-eventi .row') || document.querySelector('.event-list-container');
  if (!eventosContainer) return;

  const eventos = await window.LoasiAPI.getEventos(6);
  if (!eventos || eventos.length === 0) return;

  let html = '';
  eventos.forEach(ev => {
    const dataObj = new Date(ev.data_evento);
    const dia = dataObj.getDate();
    const mes = dataObj.toLocaleString('it-IT', { month: 'short' }).toUpperCase();
    const hora = dataObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

    html += `
      <div class="col-md-6 col-lg-4" style="margin-bottom: 30px;">
        <article class="box-icon-classic" style="background: rgba(255,255,255,0.05); padding: 25px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
          ${ev.imagem_url ? `<img src="${ev.imagem_url}" alt="${ev.titulo}" style="width:100%; height:180px; object-fit:cover; border-radius:8px; margin-bottom:15px;">` : ''}
          <div style="display:flex; align-items:center; gap:15px; margin-bottom:12px;">
            <div style="background:var(--primary-color, #c8a165); color:#000; padding:8px 14px; border-radius:8px; text-align:center; font-weight:bold;">
              <span style="font-size:1.4rem; display:block; line-height:1;">${dia}</span>
              <span style="font-size:0.75rem; text-transform:uppercase;">${mes}</span>
            </div>
            <div>
              <h5 style="margin:0; font-size:1.1rem; color:#fff;">${ev.titulo}</h5>
              <small style="color:#aaa;"><i class="fa-regular fa-clock"></i> ${hora} ${ev.local ? `• ${ev.local}` : ''}</small>
            </div>
          </div>
          ${ev.descricao ? `<p style="font-size:0.9rem; color:#ccc; margin-bottom:15px;">${ev.descricao}</p>` : ''}
          ${ev.link_inscricao ? `<a href="${ev.link_inscricao}" target="_blank" class="button button-sm button-primary button-zakaria">Partecipa</a>` : ''}
        </article>
      </div>
    `;
  });

  eventosContainer.innerHTML = html;
}

/**
 * 3. DEPOIMENTOS DINÂMICOS NA HOME
 */
async function loadDynamicDepoimentos() {
  const testimonialContainer = document.querySelector('.owl-carousel-testimonials') || document.querySelector('#secao-depoimentos');
  if (!testimonialContainer) return;

  const depoimentos = await window.LoasiAPI.getDepoimentos();
  if (!depoimentos || depoimentos.length === 0) return;

  let html = '';
  depoimentos.forEach(dep => {
    html += `
      <blockquote class="quote-classic" style="padding:20px; background:rgba(255,255,255,0.03); border-radius:10px; margin-bottom:20px;">
        <div class="quote-classic-avatar" style="margin-bottom:10px;">
          <img src="${dep.foto_url || 'images/favicon.ico'}" alt="${dep.nome}" width="60" height="60" style="border-radius:50%; object-fit:cover;">
        </div>
        <div class="quote-classic-text">
          <p style="font-style:italic;">"${dep.mensagem}"</p>
        </div>
        <div class="quote-classic-cite">
          <h6 style="color:#c8a165; margin:5px 0 0 0;">${dep.nome}</h6>
          ${dep.cargo_ou_igreja ? `<span style="font-size:0.8rem; color:#888;">${dep.cargo_ou_igreja}</span>` : ''}
        </div>
      </blockquote>
    `;
  });

  testimonialContainer.innerHTML = html;
}

/**
 * 4. PÁGINAS INDIVIDUAIS DE IGREJA (chiesa-latina.html, chiesa-terracina.html, chiesa-gaeta.html)
 */
async function loadDynamicChurchPage() {
  const bodyClass = document.body.className;
  const currentPath = window.location.pathname;
  
  let slug = '';
  if (currentPath.includes('latina')) slug = 'latina';
  else if (currentPath.includes('terracina')) slug = 'terracina';
  else if (currentPath.includes('gaeta')) slug = 'gaeta';

  if (!slug) return;

  const igreja = await window.LoasiAPI.getIgrejaBySlug(slug);
  if (!igreja) return;

  // Atualiza Nome, Endereço e Horários se existirem os elementos correspondentes na página
  const enderecoEl = document.querySelector('.church-address');
  if (enderecoEl && igreja.endereco) enderecoEl.textContent = igreja.endereco;

  const horariosEl = document.querySelector('.church-schedule');
  if (horariosEl && igreja.horarios_culto) horariosEl.textContent = igreja.horarios_culto;

  // Carregar Diretoria da Igreja
  const diretoriaContainer = document.querySelector('#secao-diretoria') || document.querySelector('.diretoria-list-container');
  if (diretoriaContainer) {
    const diretoria = await window.LoasiAPI.getDiretoriaIgreja(igreja.id);
    if (diretoria && diretoria.length > 0) {
      let html = '<h3 class="text-center" style="margin-bottom:30px; color:#c8a165;">Diretoria & Liderança</h3><div class="row justify-content-center">';
      diretoria.forEach(m => {
        html += `
          <div class="col-sm-6 col-md-4 col-lg-3" style="text-align:center; margin-bottom:25px;">
            <div style="background:rgba(255,255,255,0.05); padding:20px; border-radius:12px; border:1px solid rgba(255,255,255,0.1);">
              <img src="${m.foto_url || 'images/favicon.ico'}" alt="${m.nome}" style="width:100px; height:100px; border-radius:50%; object-fit:cover; margin-bottom:12px; border:2px solid #c8a165;">
              <h5 style="margin:0 0 5px 0; font-size:1.1rem; color:#fff;">${m.nome}</h5>
              <span style="font-size:0.85rem; color:#c8a165; font-weight:bold;">${m.cargo}</span>
            </div>
          </div>
        `;
      });
      html += '</div>';
      diretoriaContainer.innerHTML = html;
    }
  }
}
