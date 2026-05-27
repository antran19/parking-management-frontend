import { useEffect, useMemo, useState } from "react";
import Badge from "../../../shared/components/Badge";
import Panel from "../../../shared/components/Panel";
import { formatVnd, getHistory } from "../../../shared/services/smartParkingStore";
import DriverShell from "../DriverShell";

export default function DriverHistoryPage({ onLogout }) {
  const [keyword, setKeyword] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let mounted = true;
    getHistory().then((data) => mounted && setHistory(data));
    return () => { mounted = false; };
  }, []);
  const filtered = useMemo(() => history.filter((item) => `${item.licensePlate} ${item.floorId} ${item.zone}`.toLowerCase().includes(keyword.toLowerCase())), [history, keyword]);
  return (
    <DriverShell title="Lịch sử gửi xe" subtitle="Tra cứu các lượt vào/ra và chi phí đã thanh toán" onLogout={onLogout}>
      <Panel title="Bộ lọc lịch sử" subtitle="Tìm theo biển số, tầng hoặc khu">
        <input value={keyword} onChange={(e) => setKeyword(e.target.value)} className="input-pro max-w-xl" placeholder="Nhập biển số hoặc tầng..." />
      </Panel>
      <Panel title="Danh sách lượt gửi" subtitle={`${filtered.length} kết quả`} className="mt-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200">
          <table className="w-full min-w-820px text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.16em] text-slate-500"><tr><th className="p-4">Mã</th><th>Biển số</th><th>Tầng/Khu</th><th>Check-in</th><th>Check-out</th><th>Tiền</th><th>Trạng thái</th></tr></thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((item) => <tr key={item.id} className="font-semibold text-slate-600"><td className="p-4 font-black text-slate-950">{item.id}</td><td>{item.licensePlate}</td><td>{item.floorId} / {item.zone}</td><td>{item.checkIn}</td><td>{item.checkOut}</td><td className="font-black text-slate-950">{formatVnd(item.amount)}</td><td><Badge variant="active">{item.status}</Badge></td></tr>)}
            </tbody>
          </table>
        </div>
      </Panel>
    </DriverShell>
  );
}
