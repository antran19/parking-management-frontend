const toneClasses = [
  "from-white via-slate-50 to-sky-50",
  "from-white via-emerald-50 to-teal-50",
  "from-white via-amber-50 to-orange-50",
  "from-white via-indigo-50 to-blue-50",
];

function pickTone(label = "") {
  let value = 0;
  for (const char of String(label)) value += char.charCodeAt(0);
  return toneClasses[value % toneClasses.length];
}

export default function StatCard({ label, value, hint, icon = "•", trend, className = "" }) {
  return (
    <div className={`rounded-[1.85rem] border border-slate-200/80 bg-gradient-to-br ${pickTone(label)} p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(15,23,42,0.08)] ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</h3>
          {hint && <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">{hint}</p>}
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-xl text-[#001e40] ring-1 ring-slate-200 shadow-sm">
          {icon}
        </div>
      </div>
      {trend && <div className="mt-4 rounded-2xl bg-white/80 px-3 py-2 text-xs font-bold text-slate-500 ring-1 ring-slate-200/70">{trend}</div>}
    </div>
  );
}
