// src/components/QrDisplay.jsx

import { QRCode } from "react-qr-code";

function toQrText(value, code) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return code || "SMART_PARKING_QR";
    }
  }
  return code || "SMART_PARKING_QR";
}

export default function QrDisplay({ title, description, value, code, children }) {
  const qrText = toQrText(value, code);
  if (!qrText) return null;

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
      <div className="text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">QR xác nhận</p>
        <h3 className="mt-2 text-2xl font-black text-slate-950">{title || "Mã QR SmartParking"}</h3>
        {description && <p className="mt-2 text-sm font-semibold text-slate-500">{description}</p>}
      </div>
      <div className="mt-6 flex justify-center">
        <div className="relative rounded-[2rem] bg-gradient-to-br from-slate-100 to-slate-200 p-3 shadow-inner">
          <div className="rounded-[1.5rem] bg-white p-5 shadow-[0_18px_35px_rgba(15,23,42,0.14)] ring-1 ring-slate-200">
            <QRCode value={qrText} size={248} bgColor="#ffffff" fgColor="#020617" level="H" className="h-64 w-64" />
          </div>
          <span className="absolute left-5 top-5 h-7 w-7 rounded-tl-xl border-l-4 border-t-4 border-sky-500" />
          <span className="absolute right-5 top-5 h-7 w-7 rounded-tr-xl border-r-4 border-t-4 border-sky-500" />
          <span className="absolute bottom-5 left-5 h-7 w-7 rounded-bl-xl border-b-4 border-l-4 border-sky-500" />
          <span className="absolute bottom-5 right-5 h-7 w-7 rounded-br-xl border-b-4 border-r-4 border-sky-500" />
        </div>
      </div>
      <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-center ring-1 ring-slate-200">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Mã test cho Staff</p>
        <p className="mt-1 break-all font-mono text-sm font-black text-slate-950">{code || qrText}</p>
      </div>
      {children}
    </section>
  );
}
