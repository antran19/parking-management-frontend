const statusMeta = {
  ACTIVE: {
    label: "Đang hoạt động",
    className: "bg-emerald-100 text-emerald-700",
  },
  LOCKED: {
    label: "Đã khóa",
    className: "bg-red-100 text-red-700",
  },
  PENDING: {
    label: "Chờ kích hoạt",
    className: "bg-amber-100 text-amber-700",
  },
};

export default function StatusBadge({ status }) {
  const meta = statusMeta[status] || statusMeta.PENDING;

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${meta.className}`}>
      {meta.label}
    </span>
  );
}
