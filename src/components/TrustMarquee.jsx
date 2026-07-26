const COMPANIES = ['Northwind', 'Fenwick & Vale', 'Latitude', 'Corsair Labs', 'Meridian', 'Outset', 'Harborline', 'Dovetail Co.']

export default function TrustMarquee() {
  const row = [...COMPANIES, ...COMPANIES]

  return (
    <section className="border-y border-panel-line py-8">
      <p className="mb-6 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
        Running quietly inside 400+ ops teams
      </p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex w-max animate-[marquee_28s_linear_infinite] gap-16 motion-reduce:animate-none">
          {row.map((name, i) => (
            <span key={i} className="font-display whitespace-nowrap text-2xl uppercase tracking-wide text-ink-faint">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
