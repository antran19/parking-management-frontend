const roleStyles = {
  ADMIN: "bg-slate-950 text-white",
  MANAGER: "bg-violet-100 text-violet-700",
  STAFF: "bg-blue-100 text-blue-700",
  SECURITY: "bg-amber-100 text-amber-700",
  DRIVER: "bg-emerald-100 text-emerald-700",
};

export default function RoleBadge({ role }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${roleStyles[role] || "bg-slate-100 text-slate-600"}`}>
      {role}
    </span>
  );
}
