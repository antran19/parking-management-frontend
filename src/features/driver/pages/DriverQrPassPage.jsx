import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../../../shared/components/Badge";
import Panel from "../../../shared/components/Panel";
import QrDisplay from "../../../shared/components/QrDisplay";
import { getPasses, getVehicleTypeLabel, formatVnd } from "../../../shared/services/smartParkingStore";
import DriverShell from "../DriverShell";

export default function DriverQrPassPage({ onLogout }) {
  const [passes, setPasses] = useState([]);

  useEffect(() => {
    let mounted = true;
    getPasses().then((data) => mounted && setPasses(data));
    return () => { mounted = false; };
  }, []);
  return (
    <DriverShell title="Vé đang dùng" subtitle="QR vé active để Staff xác nhận khi vào bãi" onLogout={onLogout}>
      {passes.length === 0 ? (
        <div className="rounded-2rem border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-2xl font-black">Bạn chưa có vé thành viên</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">Mua gói tháng, quý hoặc năm để tạo QR vé.</p>
          <Link to="/driver/pass" className="mt-5 inline-flex rounded-2xl bg-[#001e40] px-5 py-3 text-sm font-black text-white">Mua gói ngay</Link>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {passes.map((pass) => (
            <Panel key={pass.id} title={pass.planName} subtitle={`${pass.licensePlate} • ${getVehicleTypeLabel(pass.vehicleType)}`}>
              <div className="grid gap-6 md:grid-cols-[1fr_260px]">
                <div className="space-y-4">
                  <Badge variant="active">{pass.status}</Badge>
                  <Info label="Ngày bắt đầu" value={pass.startDate} />
                  <Info label="Ngày hết hạn" value={pass.endDate} />
                  <Info label="Giá gói" value={formatVnd(pass.price)} />
                  <Info label="Mã vé" value={pass.id} />
                </div>
                <QrDisplay title="QR vé active" value={pass.qrCode} description="Đưa Staff quét để xác nhận gói" />
              </div>
            </Panel>
          ))}
        </div>
      )}
    </DriverShell>
  );
}
function Info({ label, value }) { return <div className="rounded-3xl bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</p><p className="mt-2 font-black text-slate-950">{value}</p></div>; }
