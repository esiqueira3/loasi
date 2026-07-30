import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { useFaq } from '../hooks/useFaq';
import { useCustomers } from '../hooks/useCustomers';
import { useConfirm } from '../contexts/ConfirmContext';
import { uploadToR2, deleteFromR2ByUrl, MAX_FILE_SIZE } from '../lib/r2';
import {
  extractImageUrls, isRichTextHtml, isSafeImageSrc, richTextToPlainText,
  sanitizeRichText, toEditorHtml
} from '../lib/richText';
import { RichTextEditor } from '../components/RichTextEditor';
import '../components/RichTextEditor.css';
import { toast } from 'sonner';
import {
  Search, BookOpen, Plus, Pencil, Trash2, Eye, EyeOff, X, Sparkles, Clock,
  ThumbsUp, ThumbsDown, ChevronRight, ArrowLeft, FileText, CheckCircle2,
  LayoutGrid, Star, HelpCircle, Database, Lightbulb, ExternalLink, ImagePlus, Loader2
} from 'lucide-react';

/* ---------- Renderizador de markdown simplificado (artigos legados) ----------
   Artigos novos são HTML do editor rico (ver ArticleContent / src/lib/richText.js).
   Este renderizador continua servindo o que foi escrito antes da migração. */

const IMAGE_LINE_REGEX = /^!\[[^\]]*\]\([^)]+\)$/;

function renderInline(text, keyPrefix, onImageClick) {
  const parts = [];
  // ![alt](url), **negrito**, *itálico*, `código`, [link](url)
  const regex = /(!\[[^\]]*\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0, m, i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('![')) {
      const im = tok.match(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/);
      const url = im?.[2] || '';
      if (isSafeImageSrc(url)) {
        parts.push(
          <img
            key={`${keyPrefix}-${i}`}
            src={url}
            alt={im[1] || ''}
            onClick={() => onImageClick?.(url, im[1] || '')}
            style={{ maxWidth: '100%', maxHeight: '420px', borderRadius: '10px', border: '1px solid var(--color-hairline)', verticalAlign: 'middle', cursor: onImageClick ? 'zoom-in' : 'default' }}
          />
        );
      } else if (url.startsWith('upload-')) {
        // placeholder do upload em andamento (ver ArticleEditor)
        parts.push(<span key={`${keyPrefix}-${i}`} style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 600 }}>Enviando imagem...</span>);
      } else {
        parts.push(<span key={`${keyPrefix}-${i}`} style={{ color: 'var(--color-ink-muted-48)' }}>[imagem indisponível]</span>);
      }
    }
    else if (tok.startsWith('**')) parts.push(<strong key={`${keyPrefix}-${i}`}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith('`')) parts.push(<code key={`${keyPrefix}-${i}`} style={{ backgroundColor: 'var(--color-surface-pearl)', padding: '2px 7px', borderRadius: '6px', fontSize: '0.9em', fontFamily: 'ui-monospace, monospace', border: '1px solid var(--color-hairline)' }}>{tok.slice(1, -1)}</code>);
    else if (tok.startsWith('[')) {
      const lm = tok.match(/\[([^\]]+)\]\(([^)]+)\)/);
      parts.push(<a key={`${keyPrefix}-${i}`} href={lm[2]} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>{lm[1]}</a>);
    }
    else parts.push(<em key={`${keyPrefix}-${i}`}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
    i++;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function MarkdownContent({ content, onImageClick }) {
  const blocks = useMemo(() => {
    const lines = (content || '').split('\n');
    const out = [];
    let list = null, listType = null, codeBlock = null;

    const flushList = () => { if (list) { out.push({ type: listType, items: list }); list = null; listType = null; } };

    lines.forEach((line) => {
      if (codeBlock !== null) {
        if (line.trim().startsWith('```')) { out.push({ type: 'code', text: codeBlock.join('\n') }); codeBlock = null; }
        else codeBlock.push(line);
        return;
      }
      const t = line.trim();
      if (t.startsWith('```')) { flushList(); codeBlock = []; return; }
      if (IMAGE_LINE_REGEX.test(t)) { flushList(); out.push({ type: 'image', text: t }); return; }
      if (t.startsWith('### ')) { flushList(); out.push({ type: 'h3', text: t.slice(4) }); return; }
      if (t.startsWith('## ')) { flushList(); out.push({ type: 'h2', text: t.slice(3) }); return; }
      if (t.startsWith('# ')) { flushList(); out.push({ type: 'h2', text: t.slice(2) }); return; }
      if (t.startsWith('> ')) { flushList(); out.push({ type: 'quote', text: t.slice(2) }); return; }
      if (/^[-*] /.test(t)) {
        if (listType !== 'ul') { flushList(); list = []; listType = 'ul'; }
        list.push(t.slice(2)); return;
      }
      if (/^\d+[.)] /.test(t)) {
        if (listType !== 'ol') { flushList(); list = []; listType = 'ol'; }
        list.push(t.replace(/^\d+[.)] /, '')); return;
      }
      flushList();
      if (t) out.push({ type: 'p', text: t });
    });
    flushList();
    if (codeBlock !== null) out.push({ type: 'code', text: codeBlock.join('\n') });
    return out;
  }, [content]);

  const openImage = (url, alt) => onImageClick?.(url, alt);

  return (
    <div style={{ fontSize: '15px', lineHeight: 1.75, color: 'var(--color-ink)' }}>
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'h2': return <h2 key={i} style={{ fontSize: '22px', fontWeight: 650, margin: '28px 0 12px', letterSpacing: '-0.3px' }}>{renderInline(b.text, i, openImage)}</h2>;
          case 'h3': return <h3 key={i} style={{ fontSize: '17px', fontWeight: 650, margin: '22px 0 10px' }}>{renderInline(b.text, i, openImage)}</h3>;
          case 'image': return (
            <div key={i} style={{ margin: '18px 0', display: 'flex', justifyContent: 'center' }}>
              {renderInline(b.text, i, openImage)}
            </div>
          );
          case 'quote': return (
            <div key={i} style={{ display: 'flex', gap: '12px', margin: '16px 0', padding: '14px 18px', backgroundColor: 'rgba(0,102,204,0.06)', borderLeft: '3px solid var(--color-primary)', borderRadius: '0 12px 12px 0' }}>
              <Lightbulb size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '3px' }} />
              <span style={{ color: 'var(--color-ink-muted-80)' }}>{renderInline(b.text, i, openImage)}</span>
            </div>
          );
          case 'code': return <pre key={i} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', padding: '18px 20px', borderRadius: '12px', overflowX: 'auto', fontSize: '13px', margin: '16px 0', fontFamily: 'ui-monospace, monospace' }}>{b.text}</pre>;
          case 'ul': return <ul key={i} style={{ margin: '12px 0', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>{b.items.map((it, j) => <li key={j}>{renderInline(it, `${i}-${j}`, openImage)}</li>)}</ul>;
          case 'ol': return <ol key={i} style={{ margin: '12px 0', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>{b.items.map((it, j) => <li key={j}>{renderInline(it, `${i}-${j}`, openImage)}</li>)}</ol>;
          default: return <p key={i} style={{ margin: '12px 0' }}>{renderInline(b.text, i, openImage)}</p>;
        }
      })}
    </div>
  );
}

/* ---------- Conteúdo do artigo (HTML rico ou markdown legado) ---------- */

/* Imagem em tamanho real sobre o modal do artigo.
   O atributo data-faq-lightbox é consultado pelo Escape do ArticleReader para
   fechar apenas a imagem, não o artigo. */
function Lightbox({ image, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      data-faq-lightbox="1"
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.82)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', cursor: 'zoom-out' }}
    >
      <img src={image.url} alt={image.alt} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '10px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }} />
      <button
        onClick={onClose}
        style={{ position: 'absolute', top: '20px', right: '24px', background: 'rgba(255,255,255,0.14)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
      >
        <X size={20} />
      </button>
    </div>
  );
}

/* Decide o renderizador pelo formato do conteúdo. O HTML SEMPRE passa pelo sanitizador:
   é dado de usuário salvo no banco (regra em src/lib/richText.js). */
function ArticleContent({ content }) {
  const [lightbox, setLightbox] = useState(null);
  const isHtml = isRichTextHtml(content);
  const html = useMemo(() => (isHtml ? sanitizeRichText(content) : ''), [content, isHtml]);

  const handleClick = (e) => {
    const img = e.target?.closest?.('img');
    const url = img?.getAttribute('src');
    if (url) setLightbox({ url, alt: img.getAttribute('alt') || '' });
  };

  return (
    <>
      {isHtml ? (
        <div className="faq-rich faq-rich-reader" onClick={handleClick} dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <MarkdownContent content={content} onImageClick={(url, alt) => setLightbox({ url, alt })} />
      )}
      {lightbox && <Lightbox image={lightbox} onClose={() => setLightbox(null)} />}
    </>
  );
}

/* ---------- Helpers ---------- */
const readingTime = (content) => {
  /* Conteúdo novo é HTML — as tags não contam como palavras */
  const words = richTextToPlainText(content).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
};

const formatViews = (n) => {
  if (!n) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.', ',')}k`;
  return String(n);
};

const EMOJI_OPTIONS = ['📄', '🚀', '🔐', '💳', '📊', '🐞', '🔌', '⚙️', '📱', '💬', '🔔', '📎', '🗂️', '👥', '🏢', '🧭', '🛡️', '⏱️', '✅', '❓', '💡', '🎯', '📚', '🖥️'];

const EMPTY_FORM = { titulo: '', descricao: '', conteudo: '', categoria: '', icone: '📄', publicado: true, destaque: false, clientes_ids: [], link: '' };

/* ---------- Editor (modal admin) ---------- */
function ArticleEditor({ article, categories, onSave, onClose }) {
  const { customers } = useCustomers();
  const { tenant } = useTenant();
  const confirm = useConfirm();
  const [form, setForm] = useState(article ? {
    titulo: article.titulo, descricao: article.descricao || '',
    /* Artigos antigos vêm em markdown: convertidos para HTML ao abrir (migram no salvar) */
    conteudo: toEditorHtml(article.conteudo),
    categoria: article.categoria, icone: article.icone || '📄',
    publicado: article.publicado, destaque: article.destaque,
    clientes_ids: article.clientes_ids || [], link: article.link || ''
  } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [clienteSearch, setClienteSearch] = useState('');
  const [showAllClientes, setShowAllClientes] = useState(false);
  const dirtyRef = useRef(false);
  const set = (k, v) => { dirtyRef.current = true; setForm(f => ({ ...f, [k]: v })); };

  /* --- Imagens no conteúdo (colar print, botão e arrastar) ---
     O editor rico cuida da inserção e da prévia; aqui fica só o upload para o R2. */
  const savedRef = useRef(false);
  const sessionUploadsRef = useRef([]);                                        // uploads desta sessão do editor
  const originalImagesRef = useRef(extractImageUrls(article?.conteudo || '')); // imagens já salvas no artigo
  const [uploadingCount, setUploadingCount] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);

  /* Chamado pelo RichTextEditor a cada imagem: devolve a URL pública ou null em falha */
  const uploadImage = async (file) => {
    if (!tenant?.id) { toast.error('Unidade não identificada. Recarregue a página.'); return null; }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`"${file.name || 'imagem'}" excede o limite de 5MB.`);
      return null;
    }
    try {
      const publicUrl = await uploadToR2(file, { tenantId: tenant.id, folder: 'faq' });
      sessionUploadsRef.current.push(publicUrl);
      return publicUrl;
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível enviar a imagem. Verifique a conexão e tente novamente.');
      return null;
    }
  };

  const handleSave = async () => {
    if (!form.titulo.trim()) { toast.error('Informe o título do artigo.'); return; }
    if (uploadingCount > 0) { toast.error('Aguarde o envio das imagens terminar.'); return; }
    /* O HTML do editor é sanitizado antes de ir para o banco (nunca confiar no innerHTML) */
    const conteudo = sanitizeRichText(form.conteudo);
    if (!richTextToPlainText(conteudo).trim() && !/<(img|hr)\b/i.test(conteudo)) {
      toast.error('Escreva o conteúdo do artigo.');
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...form, conteudo, titulo: form.titulo.trim(), categoria: form.categoria.trim() || 'Geral' });
      savedRef.current = true;
      /* Salvo com sucesso: limpa do R2 as imagens que ficaram fora do conteúdo final
         (uploads intermediários desta sessão + imagens originais removidas) */
      const finalUrls = new Set(extractImageUrls(conteudo));
      new Set([...sessionUploadsRef.current, ...originalImagesRef.current])
        .forEach(url => { if (!finalUrls.has(url)) deleteFromR2ByUrl(url); });
      sessionUploadsRef.current = [];
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err?.code === '42P01'
        ? 'A tabela faq_artigos ainda não existe. Rode o script supabase/manual-sql/faq-artigos.sql.'
        : 'Erro ao salvar o artigo.');
    } finally {
      setSaving(false);
    }
  };

  /* Fechar sem salvar: confirma o descarte e apaga do R2 os uploads que nunca foram salvos */
  const handleClose = async () => {
    if (saving || uploadingCount > 0) return;
    if (dirtyRef.current && !savedRef.current) {
      if (!(await confirm({
        title: 'Descartar alterações',
        message: 'As alterações deste artigo (incluindo as imagens enviadas) serão perdidas. Deseja continuar?',
        confirmText: 'Sim, Descartar',
        intent: 'danger'
      }))) return;
    }
    if (!savedRef.current) {
      sessionUploadsRef.current.forEach(url => deleteFromR2ByUrl(url));
      sessionUploadsRef.current = [];
    }
    onClose();
  };

  const inputStyle = { width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--color-hairline)', fontSize: '14px', outline: 'none', backgroundColor: 'var(--color-canvas, #fff)', color: 'var(--color-ink)' };
  const labelStyle = { fontSize: '12px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--color-ink-muted-80)', marginBottom: '8px', display: 'block' };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={handleClose}>
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--color-canvas, #fff)', borderRadius: '24px', width: '100%', maxWidth: '860px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.35)' }}>
        <style>{'@keyframes faq-spin { to { transform: rotate(360deg); } }'}</style>

        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(0,102,204,0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Pencil size={19} />
            </div>
            <div>
              <h2 style={{ fontSize: '19px', fontWeight: 650, color: 'var(--color-ink)' }}>{article ? 'Editar Artigo' : 'Novo Artigo'}</h2>
              <p style={{ fontSize: '13px', color: 'var(--color-ink-muted-48)' }}>Conteúdo da central de ajuda dos usuários</p>
            </div>
          </div>
          <button onClick={handleClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted-48)', padding: '8px' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '28px 32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div>
            <label style={labelStyle}>Ícone do card</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {EMOJI_OPTIONS.map(e => (
                <button key={e} onClick={() => set('icone', e)} style={{
                  width: '42px', height: '42px', borderRadius: '12px', fontSize: '20px', cursor: 'pointer', transition: 'all 0.12s',
                  border: form.icone === e ? '2px solid var(--color-primary)' : '1px solid var(--color-hairline)',
                  backgroundColor: form.icone === e ? 'rgba(0,102,204,0.08)' : 'var(--color-canvas, #fff)',
                }}>{e}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Título *</label>
              <input style={inputStyle} value={form.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Ex: Como abrir um chamado com prioridade urgente" />
            </div>
            <div>
              <label style={labelStyle}>Categoria</label>
              <input style={inputStyle} value={form.categoria} onChange={e => set('categoria', e.target.value)} placeholder="Ex: Onboarding" list="faq-categorias" />
              <datalist id="faq-categorias">
                {categories.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Resumo (exibido no card)</label>
              <input style={inputStyle} value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Uma frase curta que explica..." />
            </div>
            <div>
              <label style={labelStyle}>Link Externo (opcional)</label>
              <input style={inputStyle} value={form.link} onChange={e => set('link', e.target.value)} placeholder="Ex: https://youtube.com/watch?v=..." />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div>
                <label style={labelStyle}>Visibilidade por Cliente</label>
                {form.clientes_ids.length > 0 && (
                  <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600 }}>
                    {form.clientes_ids.length} selecionado{form.clientes_ids.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-ink-muted-48)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  value={clienteSearch}
                  onChange={e => { setClienteSearch(e.target.value); setShowAllClientes(true); }}
                  placeholder="Buscar cliente..."
                  style={{ paddingLeft: '32px', paddingRight: '12px', paddingTop: '7px', paddingBottom: '7px', borderRadius: '8px', border: '1px solid var(--color-hairline)', fontSize: '13px', outline: 'none', backgroundColor: 'var(--color-canvas, #fff)', color: 'var(--color-ink)', width: '200px' }}
                  onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--color-hairline)'}
                />
              </div>
            </div>
            <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas, #fff)' }}>
              <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--color-ink-muted-80)' }}>
                Selecione os clientes que podem ver este artigo. Deixe vazio para <strong>Todos</strong>.
              </p>
              {(() => {
                const filtered = (customers || []).filter(c =>
                  c.nome_fantasia?.toLowerCase().includes(clienteSearch.toLowerCase())
                );
                const PAGE = 15;
                const visible = showAllClientes ? filtered : filtered.slice(0, PAGE);
                const remaining = filtered.length - PAGE;

                if (filtered.length === 0) return (
                  <p style={{ fontSize: '13px', color: 'var(--color-ink-muted-48)', margin: 0 }}>
                    {clienteSearch ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado.'}
                  </p>
                );

                return (
                  <>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {visible.map(c => {
                        const selected = form.clientes_ids.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              if (selected) set('clientes_ids', form.clientes_ids.filter(id => id !== c.id));
                              else set('clientes_ids', [...form.clientes_ids, c.id]);
                            }}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px',
                              padding: '5px 12px', borderRadius: '100px', fontSize: '13px', fontWeight: 500,
                              cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                              background: selected ? 'rgba(0,102,204,0.1)' : 'var(--color-surface-pearl)',
                              color: selected ? 'var(--color-primary)' : 'var(--color-ink)',
                              outline: selected ? '1.5px solid var(--color-primary)' : '1.5px solid transparent',
                            }}
                          >
                            {selected && <span style={{ fontSize: '10px' }}>✓</span>}
                            {c.nome_fantasia}
                          </button>
                        );
                      })}
                    </div>

                    {!showAllClientes && remaining > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAllClientes(true)}
                        style={{ marginTop: '12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--color-primary)', fontWeight: 600, padding: 0 }}
                      >
                        + Mostrar mais {remaining} cliente{remaining > 1 ? 's' : ''}
                      </button>
                    )}
                    {showAllClientes && filtered.length > PAGE && (
                      <button
                        type="button"
                        onClick={() => setShowAllClientes(false)}
                        style={{ marginTop: '12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--color-ink-muted-48)', fontWeight: 600, padding: 0 }}
                      >
                        Mostrar menos
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '12px', flexWrap: 'wrap' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Conteúdo *</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {uploadingCount > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)' }}>
                    <Loader2 size={13} style={{ animation: 'faq-spin 0.9s linear infinite' }} />
                    Enviando {uploadingCount} imagem{uploadingCount > 1 ? 'ns' : ''}...
                  </span>
                )}
                <div style={{ display: 'flex', gap: '2px', backgroundColor: 'var(--color-surface-pearl)', padding: '3px', borderRadius: '8px', border: '1px solid var(--color-hairline)' }}>
                  {[[false, 'Escrever'], [true, 'Visualizar']].map(([mode, label]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setPreviewMode(mode)}
                      style={{
                        padding: '5px 11px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                        backgroundColor: previewMode === mode ? 'var(--color-canvas, #fff)' : 'transparent',
                        color: previewMode === mode ? 'var(--color-ink)' : 'var(--color-ink-muted-48)',
                        boxShadow: previewMode === mode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
                      }}
                    >{label}</button>
                  ))}
                </div>
              </div>
            </div>

            {previewMode ? (
              <div style={{ ...inputStyle, minHeight: '300px', padding: '20px 24px', backgroundColor: 'var(--color-surface-pearl)' }}>
                {richTextToPlainText(form.conteudo).trim() || /<img\b/i.test(form.conteudo)
                  ? <ArticleContent content={form.conteudo} />
                  : <span style={{ fontSize: '13px', color: 'var(--color-ink-muted-48)' }}>Nada para visualizar ainda.</span>}
              </div>
            ) : (
              <RichTextEditor
                value={form.conteudo}
                onChange={html => set('conteudo', html)}
                onUploadImage={uploadImage}
                onUploadingChange={setUploadingCount}
                placeholder={'Escreva o passo a passo aqui.\n\nUse a barra acima para títulos, negrito, cores e listas — e cole um print com Ctrl+V para ilustrar o passo.'}
              />
            )}

            <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Clock size={12} /> Leitura estimada: {readingTime(form.conteudo)} min</span>
              <span>O texto já aparece formatado enquanto você escreve</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ImagePlus size={12} /> Cole um print (Ctrl+V), arraste um arquivo ou use o botão da barra — até 5MB por imagem
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button onClick={() => set('publicado', !form.publicado)} style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', borderRadius: '14px', cursor: 'pointer', flex: 1, minWidth: '240px',
              border: form.publicado ? '1px solid rgba(16,185,129,0.4)' : '1px solid var(--color-hairline)',
              backgroundColor: form.publicado ? 'rgba(16,185,129,0.06)' : 'var(--color-canvas, #fff)', textAlign: 'left'
            }}>
              {form.publicado ? <Eye size={18} color="#10b981" /> : <EyeOff size={18} color="var(--color-ink-muted-48)" />}
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>{form.publicado ? 'Publicado' : 'Rascunho'}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)' }}>{form.publicado ? 'Visível para todos os usuários' : 'Visível apenas para administradores'}</div>
              </div>
            </button>
            <button onClick={() => set('destaque', !form.destaque)} style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', borderRadius: '14px', cursor: 'pointer', flex: 1, minWidth: '240px',
              border: form.destaque ? '1px solid rgba(245,158,11,0.4)' : '1px solid var(--color-hairline)',
              backgroundColor: form.destaque ? 'rgba(245,158,11,0.06)' : 'var(--color-canvas, #fff)', textAlign: 'left'
            }}>
              <Star size={18} color={form.destaque ? '#f59e0b' : 'var(--color-ink-muted-48)'} fill={form.destaque ? '#f59e0b' : 'none'} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>{form.destaque ? 'Em destaque' : 'Sem destaque'}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)' }}>Aparece na faixa principal da central</div>
              </div>
            </button>
          </div>
        </div>

        <div style={{ padding: '20px 32px', borderTop: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={handleClose} style={{ padding: '11px 22px', borderRadius: '10px', border: '1px solid var(--color-hairline)', backgroundColor: 'transparent', color: 'var(--color-ink)', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving || uploadingCount > 0} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 24px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--color-primary)', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: saving || uploadingCount > 0 ? 'wait' : 'pointer', opacity: saving || uploadingCount > 0 ? 0.7 : 1 }}>
            <CheckCircle2 size={17} /> {saving ? 'Salvando...' : uploadingCount > 0 ? 'Enviando imagens...' : article ? 'Salvar Alterações' : 'Publicar Artigo'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Leitor de artigo ---------- */
export function ArticleReader({ article, onClose, onVote }) {
  const [voted, setVoted] = useState(null);

  useEffect(() => {
    /* Com o lightbox de imagem aberto, o Escape fecha apenas a imagem — não o artigo */
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (document.querySelector('[data-faq-lightbox]')) return;
      onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleVote = (util) => {
    if (voted !== null) return;
    setVoted(util);
    onVote(article.id, util);
    toast.success('Obrigado pelo seu feedback!');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--color-canvas, #fff)', borderRadius: '24px', width: '100%', maxWidth: '760px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.35)' }}>

        <div style={{ padding: '20px 32px', borderBottom: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted-80)', fontSize: '14px', fontWeight: 600, padding: 0 }}>
            <ArrowLeft size={17} /> Voltar para a central
          </button>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted-48)', padding: '4px' }}><X size={20} /></button>
        </div>

        <div style={{ overflowY: 'auto', padding: '36px 48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--color-primary)', backgroundColor: 'rgba(0,102,204,0.08)', padding: '5px 12px', borderRadius: '100px' }}>{article.categoria}</span>
            <span style={{ fontSize: '13px', color: 'var(--color-ink-muted-48)', display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={13} /> {readingTime(article.conteudo)} min de leitura</span>
            <span style={{ fontSize: '13px', color: 'var(--color-ink-muted-48)', display: 'flex', alignItems: 'center', gap: '5px' }}><Eye size={13} /> {formatViews(article.visualizacoes)} visualizações</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px', marginBottom: '8px' }}>
            <div style={{ fontSize: '40px', lineHeight: 1 }}>{article.icone}</div>
            <h1 style={{ fontSize: '30px', fontWeight: 650, letterSpacing: '-0.7px', color: 'var(--color-ink)', lineHeight: 1.25 }}>{article.titulo}</h1>
          </div>
          {article.descricao && <p style={{ fontSize: '16px', color: 'var(--color-ink-muted-80)', marginBottom: '8px', lineHeight: 1.6 }}>{article.descricao}</p>}

          <div style={{ height: '1px', backgroundColor: 'var(--color-hairline)', margin: '24px 0' }} />

          <ArticleContent content={article.conteudo} />

          {article.link && (
            <div style={{ marginTop: '24px' }}>
              <a href={article.link.startsWith('http') ? article.link : `https://${article.link}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', backgroundColor: 'var(--color-primary)', color: '#fff', fontWeight: 600, fontSize: '15px', textDecoration: 'none' }}>
                <ExternalLink size={18} /> Acessar Link Externo
              </a>
            </div>
          )}

          <div style={{ marginTop: '40px', padding: '28px', borderRadius: '18px', backgroundColor: 'var(--color-surface-pearl)', border: '1px solid var(--color-hairline)', textAlign: 'center' }}>
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-ink)', marginBottom: '16px' }}>Este artigo resolveu sua dúvida?</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => handleVote(true)} disabled={voted !== null} style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 24px', borderRadius: '100px', fontWeight: 600, fontSize: '14px',
                cursor: voted !== null ? 'default' : 'pointer', transition: 'all 0.15s',
                border: voted === true ? 'none' : '1px solid var(--color-hairline)',
                backgroundColor: voted === true ? '#10b981' : 'var(--color-canvas, #fff)',
                color: voted === true ? '#fff' : 'var(--color-ink)', opacity: voted === false ? 0.4 : 1
              }}>
                <ThumbsUp size={16} /> Sim, ajudou{article.util_sim > 0 ? ` (${article.util_sim})` : ''}
              </button>
              <button onClick={() => handleVote(false)} disabled={voted !== null} style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 24px', borderRadius: '100px', fontWeight: 600, fontSize: '14px',
                cursor: voted !== null ? 'default' : 'pointer', transition: 'all 0.15s',
                border: voted === false ? 'none' : '1px solid var(--color-hairline)',
                backgroundColor: voted === false ? '#dc2626' : 'var(--color-canvas, #fff)',
                color: voted === false ? '#fff' : 'var(--color-ink)', opacity: voted === true ? 0.4 : 1
              }}>
                <ThumbsDown size={16} /> Não muito
              </button>
            </div>
            {article.autor?.nome_completo && (
              <p style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)', marginTop: '18px' }}>
                Escrito por {article.autor.nome_completo} · Atualizado em {new Date(article.updated_at || article.created_at).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Página ---------- */
export function Faq() {
  const { profile } = useAuth();
  const confirm = useConfirm();
  const { articles, loading, tableMissing, createArticle, updateArticle, deleteArticle, registerView, registerVote } = useFaq();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [reading, setReading] = useState(null);
  const [editing, setEditing] = useState(null);   // null | 'new' | artigo
  const [adminFilter, setAdminFilter] = useState('todos'); // todos | publicados | rascunhos

  const isAdmin = profile?.is_god || profile?.is_master ||
    ['Administrador Master', 'Administrador'].includes(profile?.perfil);

  const visible = useMemo(() => {
    let list = isAdmin ? articles : articles.filter(a => a.publicado);
    
    // Filtro de visibilidade por cliente
    if (!isAdmin && profile?.perfil === 'Cliente') {
      list = list.filter(a => !a.clientes_ids || a.clientes_ids.length === 0 || a.clientes_ids.includes(profile.cliente_id));
    }

    if (isAdmin && adminFilter === 'publicados') list = list.filter(a => a.publicado);
    if (isAdmin && adminFilter === 'rascunhos') list = list.filter(a => !a.publicado);
    if (activeCategory) list = list.filter(a => a.categoria === activeCategory);
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(a =>
        a.titulo.toLowerCase().includes(q) ||
        (a.descricao || '').toLowerCase().includes(q) ||
        /* texto puro: sem isso a busca casaria com as tags do HTML do conteúdo */
        richTextToPlainText(a.conteudo).toLowerCase().includes(q) ||
        a.categoria.toLowerCase().includes(q)
      );
    }
    return list;
  }, [articles, isAdmin, adminFilter, activeCategory, searchTerm]);

  const categories = useMemo(() => {
    const base = isAdmin ? articles : articles.filter(a => a.publicado);
    const counts = new Map();
    base.forEach(a => counts.set(a.categoria, (counts.get(a.categoria) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [articles, isAdmin]);

  const featured = useMemo(() => visible.filter(a => a.destaque && a.publicado).slice(0, 3), [visible]);
  const regular = useMemo(() => visible.filter(a => !featured.includes(a)), [visible, featured]);

  const stats = useMemo(() => ({
    total: articles.length,
    publicados: articles.filter(a => a.publicado).length,
    rascunhos: articles.filter(a => !a.publicado).length,
    views: articles.reduce((s, a) => s + (a.visualizacoes || 0), 0),
  }), [articles]);

  const openArticle = (a) => { setReading(a); registerView(a.id); };

  const handleDelete = async (a) => {
    if (!(await confirm({
      title: 'Excluir artigo',
      message: `Tem certeza que deseja excluir "${a.titulo}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Sim, Excluir',
      intent: 'danger'
    }))) return;
    try {
      await deleteArticle(a.id);
      /* Sem o artigo, as imagens do conteúdo ficariam órfãs no R2 (fire-and-forget) */
      extractImageUrls(a.conteudo).forEach(url => deleteFromR2ByUrl(url));
      toast.success('Artigo excluído.');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir o artigo.');
    }
  };

  const handleSave = async (payload) => {
    if (editing === 'new') {
      await createArticle(payload);
      toast.success('Artigo criado com sucesso!');
    } else {
      await updateArticle(editing.id, payload);
      toast.success('Artigo atualizado!');
    }
  };

  /* Card de artigo */
  const ArticleCard = ({ a }) => (
    <div
      onClick={() => openArticle(a)}
      className="utility-card"
      style={{ padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', transition: 'transform 0.15s, box-shadow 0.15s', opacity: a.publicado ? 1 : 0.72 }}
      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.09)'; }}
      onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'var(--color-surface-pearl)', border: '1px solid var(--color-hairline)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
          {a.icone}
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {!a.publicado && (
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '100px', backgroundColor: 'rgba(245,158,11,0.12)', color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <EyeOff size={11} /> Rascunho
            </span>
          )}
          {isAdmin && (
            <>
              <button onClick={e => { e.stopPropagation(); setEditing(a); }} title="Editar" style={{ padding: '7px', borderRadius: '8px', border: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas, #fff)', color: 'var(--color-ink-muted-80)', cursor: 'pointer', display: 'flex' }}>
                <Pencil size={14} />
              </button>
              <button onClick={e => { e.stopPropagation(); handleDelete(a); }} title="Excluir" style={{ padding: '7px', borderRadius: '8px', border: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas, #fff)', color: '#dc2626', cursor: 'pointer', display: 'flex' }}>
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: '8px' }}>{a.categoria}</div>
        <h3 style={{ fontSize: '16px', fontWeight: 650, color: 'var(--color-ink)', lineHeight: 1.4, marginBottom: '8px' }}>{a.titulo}</h3>
        {a.descricao && <p style={{ fontSize: '13px', color: 'var(--color-ink-muted-80)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.descricao}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: 'var(--color-ink-muted-48)', borderTop: '1px solid var(--color-divider-soft)', paddingTop: '14px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {readingTime(a.conteudo)} min</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={12} /> {formatViews(a.visualizacoes)}</span>
        {a.util_sim > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ThumbsUp size={12} /> {a.util_sim}</span>}
        <ChevronRight size={15} style={{ marginLeft: 'auto', color: 'var(--color-primary)' }} />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ padding: '40px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
        <div className="utility-card" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-ink-muted-80)' }}>
          Carregando central de ajuda...
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%' }}>

      {/* HERO */}
      <div style={{
        margin: '40px 40px 0', borderRadius: '28px', overflow: 'hidden', position: 'relative',
        background: 'linear-gradient(130deg, #0a2540 0%, #0066cc 55%, #2997ff 100%)',
        padding: '64px 48px 72px', textAlign: 'center'
      }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-60px', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: '-100px', left: '-70px', width: '320px', height: '320px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '7px 16px', borderRadius: '100px', backgroundColor: 'rgba(255,255,255,0.12)', color: '#e0f2fe', fontSize: '12px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.15)' }}>
            <Sparkles size={14} /> Central de Ajuda
          </div>
          <h1 style={{ fontSize: '40px', fontWeight: 300, letterSpacing: '-1px', color: '#fff', marginBottom: '12px' }}>
            Como podemos <strong style={{ fontWeight: 650 }}>ajudar você</strong> hoje?
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.75)', marginBottom: '32px' }}>
            Guias, tutoriais e respostas para dominar o Asisto Atende.
          </p>

          <div style={{ maxWidth: '640px', margin: '0 auto', position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Busque por artigos, dúvidas ou palavras-chave..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '18px 24px 18px 54px', borderRadius: '16px', border: 'none', fontSize: '15px', outline: 'none', boxShadow: '0 12px 40px rgba(0,0,0,0.25)', color: '#0f172a', backgroundColor: '#fff' }}
            />
          </div>

          {categories.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
              <button onClick={() => setActiveCategory('')} style={{
                padding: '8px 18px', borderRadius: '100px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                border: '1px solid rgba(255,255,255,0.25)',
                backgroundColor: activeCategory === '' ? '#fff' : 'rgba(255,255,255,0.1)',
                color: activeCategory === '' ? 'var(--color-primary)' : '#fff'
              }}>
                Todos
              </button>
              {categories.map(([cat, count]) => (
                <button key={cat} onClick={() => setActiveCategory(activeCategory === cat ? '' : cat)} style={{
                  padding: '8px 18px', borderRadius: '100px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                  border: '1px solid rgba(255,255,255,0.25)',
                  backgroundColor: activeCategory === cat ? '#fff' : 'rgba(255,255,255,0.1)',
                  color: activeCategory === cat ? 'var(--color-primary)' : '#fff'
                }}>
                  {cat} <span style={{ opacity: 0.65 }}>({count})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '32px 40px 40px' }}>

        {/* Tabela ainda não criada no banco */}
        {tableMissing && (
          <div className="utility-card" style={{ padding: '32px', marginBottom: '32px', display: 'flex', gap: '20px', alignItems: 'flex-start', border: '1px solid rgba(245,158,11,0.35)', backgroundColor: 'rgba(245,158,11,0.05)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(245,158,11,0.12)', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Database size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 650, color: 'var(--color-ink)', marginBottom: '6px' }}>Banco de dados pendente de configuração</h3>
              <p style={{ fontSize: '14px', color: 'var(--color-ink-muted-80)', lineHeight: 1.6 }}>
                A tabela <code style={{ backgroundColor: 'var(--color-surface-pearl)', padding: '2px 8px', borderRadius: '6px', fontFamily: 'ui-monospace, monospace', fontSize: '13px' }}>faq_artigos</code> ainda não existe.
                Execute o script <strong>supabase/manual-sql/faq-artigos.sql</strong> no SQL Editor do Supabase para ativar a central de FAQ.
              </p>
            </div>
          </div>
        )}

        {/* Barra administrativa */}
        {isAdmin && !tableMissing && (
          <div className="utility-card" style={{ padding: '20px 24px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap', flex: 1 }}>
              {[
                { icon: <FileText size={15} />, label: 'Artigos', value: stats.total },
                { icon: <Eye size={15} />, label: 'Publicados', value: stats.publicados },
                { icon: <EyeOff size={15} />, label: 'Rascunhos', value: stats.rascunhos },
                { icon: <LayoutGrid size={15} />, label: 'Visualizações', value: formatViews(stats.views) },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ color: 'var(--color-ink-muted-48)' }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-ink)', lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '3px' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--color-surface-pearl)', padding: '4px', borderRadius: '10px', border: '1px solid var(--color-hairline)' }}>
              {[['todos', 'Todos'], ['publicados', 'Publicados'], ['rascunhos', 'Rascunhos']].map(([k, l]) => (
                <button key={k} onClick={() => setAdminFilter(k)} style={{
                  padding: '7px 14px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  backgroundColor: adminFilter === k ? 'var(--color-canvas, #fff)' : 'transparent',
                  color: adminFilter === k ? 'var(--color-ink)' : 'var(--color-ink-muted-48)',
                  boxShadow: adminFilter === k ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
                }}>{l}</button>
              ))}
            </div>

            <button onClick={() => setEditing('new')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 20px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--color-primary)', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,102,204,0.3)' }}>
              <Plus size={17} /> Novo Artigo
            </button>
          </div>
        )}

        {/* Destaques */}
        {featured.length > 0 && (
          <div style={{ marginBottom: '36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Star size={17} color="#f59e0b" fill="#f59e0b" />
              <h2 style={{ fontSize: '18px', fontWeight: 650, color: 'var(--color-ink)' }}>Em destaque</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {featured.map(a => <ArticleCard key={a.id} a={a} />)}
            </div>
          </div>
        )}

        {/* Todos os artigos */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <BookOpen size={17} color="var(--color-primary)" />
            <h2 style={{ fontSize: '18px', fontWeight: 650, color: 'var(--color-ink)' }}>
              {activeCategory ? activeCategory : searchTerm ? `Resultados para "${searchTerm}"` : 'Todos os artigos'}
            </h2>
            <span style={{ fontSize: '13px', color: 'var(--color-ink-muted-48)' }}>· {regular.length + featured.length} artigo{regular.length + featured.length !== 1 ? 's' : ''}</span>
          </div>

          {regular.length === 0 && featured.length === 0 ? (
            <div className="utility-card" style={{ padding: '72px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '20px', backgroundColor: 'var(--color-surface-pearl)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-ink-muted-48)' }}>
                <HelpCircle size={28} strokeWidth={1.5} />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 650, color: 'var(--color-ink)', marginBottom: '6px' }}>
                  {searchTerm || activeCategory ? 'Nenhum artigo encontrado' : 'A central de ajuda está vazia'}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--color-ink-muted-80)', maxWidth: '420px' }}>
                  {searchTerm || activeCategory
                    ? 'Tente outros termos de busca ou limpe os filtros.'
                    : isAdmin ? 'Crie o primeiro artigo e comece a construir a base de conhecimento da sua equipe.' : 'Em breve os administradores publicarão os primeiros artigos.'}
                </p>
              </div>
              {(searchTerm || activeCategory) && (
                <button onClick={() => { setSearchTerm(''); setActiveCategory(''); }} style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--color-hairline)', backgroundColor: 'var(--color-canvas, #fff)', color: 'var(--color-ink)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                  Limpar busca
                </button>
              )}
              {isAdmin && !searchTerm && !activeCategory && !tableMissing && (
                <button onClick={() => setEditing('new')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 22px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--color-primary)', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                  <Plus size={16} /> Criar primeiro artigo
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {regular.map(a => <ArticleCard key={a.id} a={a} />)}
            </div>
          )}
        </div>
      </div>

      {/* Modais */}
      {reading && <ArticleReader article={reading} onClose={() => setReading(null)} onVote={registerVote} />}
      {editing && (
        <ArticleEditor
          article={editing === 'new' ? null : editing}
          categories={categories.map(([c]) => c)}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
