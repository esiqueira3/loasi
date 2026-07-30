import { useState, useRef, useEffect } from 'react'
import Icon from '../../components/Icon'
import { uploadImageToStorage } from '../../lib/r2'
import { toast } from './Toast'

export function RichTextEditor({ value = '', onChange, placeholder = 'Scrivi il contenuto della pagina…' }) {
  const editorRef = useRef(null)
  const [htmlMode, setHtmlMode] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [htmlValue, setHtmlValue] = useState(value)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    setHtmlValue(value)
    if (editorRef.current && !htmlMode && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value, htmlMode])

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML
      setHtmlValue(content)
      onChange?.(content)
    }
  }

  const execCmd = (command, val = null) => {
    document.execCommand(command, false, val)
    handleInput()
  }

  const insertHeading = (tag) => {
    document.execCommand('formatBlock', false, `<${tag}>`)
    handleInput()
  }

  const insertLink = () => {
    const url = prompt('Inserisci URL del link:')
    if (url) {
      document.execCommand('createLink', false, url)
      handleInput()
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const url = await uploadImageToStorage(file, 'paginas')
      if (url) {
        if (htmlMode) {
          const imgTag = `<img src="${url}" alt="" class="my-4 rounded-2xl border border-hairline max-w-full h-auto shadow-sm" />`
          const newValue = htmlValue + '\n' + imgTag
          setHtmlValue(newValue)
          onChange?.(newValue)
        } else {
          editorRef.current?.focus()
          document.execCommand(
            'insertHTML',
            false,
            `<img src="${url}" alt="" class="my-4 rounded-2xl border border-hairline max-w-full h-auto shadow-sm" />`
          )
          handleInput()
        }
        toast.success('Immagine caricata!')
      }
    } catch (err) {
      toast.error(`Errore caricamento immagine: ${err.message}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleHtmlChange = (e) => {
    const val = e.target.value
    setHtmlValue(val)
    onChange?.(val)
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface-card shadow-xs">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1 border-b border-hairline bg-surface-pearl p-2">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => execCmd('bold')}
            title="Grassetto"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted-80 hover:bg-canvas-parchment hover:text-ink font-bold"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => execCmd('italic')}
            title="Corsivo"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted-80 hover:bg-canvas-parchment hover:text-ink italic"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => execCmd('underline')}
            title="Sottolineato"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted-80 hover:bg-canvas-parchment hover:text-ink underline"
          >
            U
          </button>
          <div className="h-4 w-px bg-hairline mx-1" />

          <button
            type="button"
            onClick={() => insertHeading('h2')}
            title="Titolo H2"
            className="flex h-8 px-2 items-center justify-center rounded-lg text-[12px] font-bold text-ink-muted-80 hover:bg-canvas-parchment hover:text-ink"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => insertHeading('h3')}
            title="Titolo H3"
            className="flex h-8 px-2 items-center justify-center rounded-lg text-[12px] font-bold text-ink-muted-80 hover:bg-canvas-parchment hover:text-ink"
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => insertHeading('p')}
            title="Paragrafo"
            className="flex h-8 px-2 items-center justify-center rounded-lg text-[12px] font-bold text-ink-muted-80 hover:bg-canvas-parchment hover:text-ink"
          >
            P
          </button>

          <div className="h-4 w-px bg-hairline mx-1" />

          <button
            type="button"
            onClick={() => execCmd('insertUnorderedList')}
            title="Elenco puntato"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted-80 hover:bg-canvas-parchment hover:text-ink"
          >
            <Icon name="format_list_bulleted" className="text-[18px]" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('insertOrderedList')}
            title="Elenco numerato"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted-80 hover:bg-canvas-parchment hover:text-ink"
          >
            <Icon name="format_list_numbered" className="text-[18px]" />
          </button>
          <button
            type="button"
            onClick={() => insertHeading('blockquote')}
            title="Citazione"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted-80 hover:bg-canvas-parchment hover:text-ink"
          >
            <Icon name="format_quote" className="text-[18px]" />
          </button>

          <div className="h-4 w-px bg-hairline mx-1" />

          <button
            type="button"
            onClick={insertLink}
            title="Inserisci Link"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted-80 hover:bg-canvas-parchment hover:text-ink"
          >
            <Icon name="link" className="text-[18px]" />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Inserisci Immagine"
            className="flex h-8 items-center gap-1 px-2.5 rounded-lg bg-gold-400/15 text-gold-700 hover:bg-gold-400/25 text-[12px] font-bold transition-colors"
          >
            <Icon name={uploading ? 'sync' : 'add_photo_alternate'} className={`text-[16px] ${uploading ? 'animate-spin' : ''}`} />
            {uploading ? 'Caricamento…' : 'Immagine'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPreviewMode((v) => !v)}
            className={`flex h-8 items-center gap-1.5 px-2.5 rounded-lg text-[11.5px] font-bold uppercase tracking-wider transition-colors ${
              previewMode ? 'bg-emerald-500/15 text-emerald-700' : 'text-ink-muted-48 hover:bg-canvas-parchment'
            }`}
          >
            <Icon name={previewMode ? 'visibility_off' : 'visibility'} className="text-[16px]" />
            Anteprima
          </button>
          <button
            type="button"
            onClick={() => setHtmlMode((v) => !v)}
            className={`flex h-8 items-center gap-1.5 px-2.5 rounded-lg text-[11.5px] font-bold uppercase tracking-wider transition-colors ${
              htmlMode ? 'bg-violet-500/15 text-violet-700' : 'text-ink-muted-48 hover:bg-canvas-parchment'
            }`}
          >
            <Icon name="code" className="text-[16px]" />
            HTML
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="relative min-h-[280px] p-4 bg-canvas-parchment/40">
        {previewMode ? (
          <div className="prose max-w-none text-ink">
            <div
              className="space-y-4 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: htmlValue || '<p className="text-ink-muted-48 italic">Nessun contenuto da mostrare nell\'anteprima.</p>' }}
            />
          </div>
        ) : htmlMode ? (
          <textarea
            value={htmlValue}
            onChange={handleHtmlChange}
            placeholder="Codice HTML..."
            className="h-[280px] w-full resize-y bg-ink-950 font-mono text-[13px] text-cream-100 p-4 rounded-xl outline-none"
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            className="min-h-[260px] outline-none text-[14px] leading-relaxed text-ink focus:ring-0"
            data-placeholder={placeholder}
          />
        )}
      </div>
    </div>
  )
}
