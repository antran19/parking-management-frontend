export default function Panel({ title, subtitle, actions, children, className = "" }) {
  return (
    <section className={`rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm ${className}`}>
      {(title || subtitle || actions) && (
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            {title && <h2 className="text-lg font-black tracking-tight text-slate-950">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm font-medium leading-6 text-slate-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
