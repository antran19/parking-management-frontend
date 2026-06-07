export default function CapacityBar({ used = 0, label = "", size = "md" }) {
  const percent = Math.min(100, Math.max(0, Math.round(Number(used) || 0)));
  const color = percent >= 85
    ? "bg-gradient-to-r from-rose-500 to-pink-500"
    : percent >= 70
      ? "bg-gradient-to-r from-amber-400 to-orange-500"
      : "bg-gradient-to-r from-[#001e40] to-sky-600";
  const height = size === "sm" ? "h-2" : "h-3";
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-black text-slate-500">
        <span>{label || "Mức sử dụng"}</span>
        <span>{percent}%</span>
      </div>
      <div className={`w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/70 ${height}`}>
        <div className={`${height} rounded-full ${color} transition-all duration-300`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
