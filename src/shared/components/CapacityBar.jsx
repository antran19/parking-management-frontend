export default function CapacityBar({ used = 0, label = "", size = "md" }) {
  const percent = Math.min(100, Math.max(0, Math.round(Number(used) || 0)));
  const color = percent >= 85 ? "bg-rose-500" : percent >= 70 ? "bg-amber-500" : "bg-[#001e40]";
  const height = size === "sm" ? "h-2" : "h-3";
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-black text-slate-500">
        <span>{label || "Mức sử dụng"}</span>
        <span>{percent}%</span>
      </div>
      <div className={`w-full overflow-hidden rounded-full bg-slate-100 ${height}`}>
        <div className={`${height} rounded-full ${color} transition-all`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
