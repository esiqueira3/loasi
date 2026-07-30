import Reveal from './Reveal'

/** Griglia ritratti (famiglia pastorale / collaboratori). */
export default function TeamGrid({ people = [], columns = 4 }) {
  if (!people.length) return null

  const cols = {
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  }[columns]

  return (
    <div className={`grid grid-cols-2 gap-5 ${cols} sm:gap-7`}>
      {people.map((p, i) => (
        <Reveal key={`${p.name}-${i}`} delay={i * 70} from="up">
          <article className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.03]">
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src={p.photo}
                alt={p.name}
                loading="lazy"
                className="h-full w-full object-cover grayscale-[35%] transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
              />
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950 via-ink-950/80 to-transparent p-5 pt-16">
              <h3 className="font-headline text-lg leading-tight text-cream-50">{p.name}</h3>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-gold-400">{p.role}</p>
            </div>
          </article>
        </Reveal>
      ))}
    </div>
  )
}
