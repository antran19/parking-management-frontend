export default function Panel({ title, subtitle, actions, children, className = "" }) {
  return (
    <section className={`overflow-hidden rounded-[1.85rem] border border-slate-200/80 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)] ${className}`}>
      {(title || subtitle || actions) && (
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-white via-slate-50 to-sky-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            {title && <h2 className="text-lg font-black tracking-tight text-slate-950">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
