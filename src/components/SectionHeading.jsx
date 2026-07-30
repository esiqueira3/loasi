import Reveal from './Reveal'

export default function SectionHeading({
  eyebrow,
  title,
  lead,
  align = 'center',
  tone = 'dark', // 'dark' = su fondo scuro · 'light' = su fondo chiaro
  className = '',
}) {
  const alignment = align === 'center' ? 'text-center items-center' : 'text-left items-start'
  const titleColor = tone === 'dark' ? 'text-cream-50' : 'text-ink-900'
  const leadColor = tone === 'dark' ? 'text-cream-100/60' : 'text-ink-700/70'

  return (
    <Reveal className={`flex flex-col ${alignment} ${className}`}>
      {eyebrow && <p className="eyebrow mb-5">{eyebrow}</p>}
      <h2 className={`h-display text-balance text-[2rem] sm:text-4xl lg:text-[2.9rem] ${titleColor}`}>{title}</h2>
      {lead && (
        <p className={`mt-5 max-w-2xl text-pretty text-[15px] leading-relaxed sm:text-base ${leadColor}`}>{lead}</p>
      )}
      <span
        aria-hidden="true"
        className={`mt-7 block h-px w-24 bg-gold-line ${align === 'center' ? '' : 'bg-gradient-to-r from-gold-400 to-transparent'}`}
      />
    </Reveal>
  )
}
