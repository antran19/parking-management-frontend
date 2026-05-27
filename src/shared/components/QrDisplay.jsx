function hashValue(value) {
  const text = String(value || "SMARTPARKING");
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

export default function QrDisplay({ value, title = "Mã QR", description = "Đưa mã này cho Staff để xác nhận", size = 15 }) {
  const seed = hashValue(value);
  const cells = Array.from({ length: size * size }, (_, index) => {
    const row = Math.floor(index / size);
    const col = index % size;
    const inFinder =
      (row < 5 && col < 5) ||
      (row < 5 && col >= size - 5) ||
      (row >= size - 5 && col < 5);
    if (inFinder) {
      const localRow = row < 5 ? row : row - (size - 5);
      const localCol = col < 5 ? col : col - (size - 5);
      return localRow === 0 || localRow === 4 || localCol === 0 || localCol === 4 || (localRow === 2 && localCol === 2);
    }
    return ((seed + index * 17 + row * 13 + col * 7) % 5) < 2;
  });

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-950">{title}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">{description}</p>
        </div>
        <span className="rounded-full bg-[#eaf2ff] px-3 py-1 text-xs font-black text-[#001e40]">QR</span>
      </div>
      <div className="mx-auto mt-5 grid aspect-square w-48 grid-cols-[repeat(15,minmax(0,1fr))] gap-0.5 rounded-2xl border border-slate-200 bg-white p-3">
        {cells.map((active, index) => (
          <span key={index} className={`rounded-[2px] ${active ? "bg-slate-950" : "bg-white"}`} />
        ))}
      </div>
      <div className="mt-4 rounded-2xl bg-slate-50 p-3">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Mã xác nhận</p>
        <p className="mt-1 break-all font-mono text-sm font-black text-slate-950">{value || "SP-DEMO-QR"}</p>
      </div>
    </div>
  );
}
