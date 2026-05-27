export default function StatCard({ label, value, hint, icon = "•", trend, className = "" }) {
  return (
    <div className={`rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</h3>
          {hint && <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">{hint}</p>}
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-900">
          {icon}
        </div>
      </div>
      {trend && <div className="mt-4 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">{trend}</div>}
    </div>
  );
}
