const variants = {
  default: "bg-slate-100 text-slate-700 ring-slate-200",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  danger: "bg-rose-50 text-rose-700 ring-rose-200",
  primary: "bg-sky-50 text-[#001e40] ring-sky-200",
  dark: "bg-[#001e40] text-white ring-[#001e40]",
};

export default function Badge({ children, variant = "default", className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ring-1 shadow-sm ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}
