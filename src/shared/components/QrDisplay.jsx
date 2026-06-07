import { QRCode } from "react-qr-code";

function formatQrText(value) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "SP-DEMO-QR";
    }
  }
  return "SP-DEMO-QR";
}

export default function QrDisplay({
  value,
  title = "Mã QR",
  description = "Đưa mã này cho Staff để xác nhận",
  size = 236,
  children,
}) {
  const qrValue = formatQrText(value);

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">SmartParking Secure QR</p>
          <h3 className="mt-1 text-xl font-black text-slate-950">{title}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">{description}</p>
        </div>
        <span className="rounded-full bg-[#001e40] px-3 py-1 text-xs font-black text-white">QR</span>
      </div>

      <div className="mt-6 flex justify-center">
        <div className="relative rounded-[2rem] bg-gradient-to-br from-slate-100 to-slate-200 p-3 shadow-inner">
          <div className="rounded-[1.5rem] bg-white p-5 shadow-[0_18px_35px_rgba(15,23,42,0.14)] ring-1 ring-slate-200">
            <QRCode value={qrValue} size={size} bgColor="#ffffff" fgColor="#020617" level="H" className="h-auto w-full" />
          </div>
          <span className="absolute left-5 top-5 h-7 w-7 rounded-tl-xl border-l-4 border-t-4 border-sky-500" />
          <span className="absolute right-5 top-5 h-7 w-7 rounded-tr-xl border-r-4 border-t-4 border-sky-500" />
          <span className="absolute bottom-5 left-5 h-7 w-7 rounded-bl-xl border-b-4 border-l-4 border-sky-500" />
          <span className="absolute bottom-5 right-5 h-7 w-7 rounded-br-xl border-b-4 border-r-4 border-sky-500" />
        </div>
      </div>

      <div className="mx-auto mt-5 max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Mã xác nhận</p>
            <p className="mt-1 break-all font-mono text-sm font-black text-slate-950">{qrValue}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">READY</div>
        </div>
      </div>
      {children}
    </div>
  );
}
