/**
 * Material Symbols Outlined (font caricato in index.html).
 * <Icon name="church" className="text-2xl" filled />
 */
export default function Icon({ name, className = '', filled = false, weight = 400, style, ...rest }) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined select-none leading-none ${className}`}
      style={{ fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}`, ...style }}
      {...rest}
    >
      {name}
    </span>
  )
}
