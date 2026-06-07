const toneClasses = {
  slate: "bg-slate-950 text-white",
  blue: "bg-blue-600 text-white",
  emerald: "bg-emerald-600 text-white",
  amber: "bg-amber-500 text-white",
  violet: "bg-violet-600 text-white",
  rose: "bg-rose-600 text-white",
};

export default function AdminStatCard({ label, value, description, icon = "•", tone = "slate" }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            {label}
          </p>
          <p className="mt-3 text-4xl font-black tracking-tight text-slate-950">
            {value}
          </p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl shadow-sm ${toneClasses[tone] || toneClasses.slate}`}>
          {icon}
        </div>
      </div>
      <p className="mt-4 text-sm font-medium leading-6 text-slate-500">{description}</p>
    </article>
  );
}
