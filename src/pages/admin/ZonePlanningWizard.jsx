import React, { useState, useEffect, useMemo } from "react";
import { staffApi } from "../../api/parkingApi";

/**
 * ZonePlanningWizard — modal quy hoạch zone theo diện tích tầng.
 * Thay cho việc admin gõ tay số capacity: chọn loại xe (+ % diện tích nếu tầng tổng hợp),
 * hệ thống tự tính diện tích/slot mỗi zone và tạo hàng loạt zone trong 1 lần submit.
 */
export default function ZonePlanningWizard({ floor, vehicleTypes, onClose, onGenerated, toast }) {
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [mode, setMode] = useState("dedicated"); // dedicated | mixed
  const [dedicatedVehicleTypeId, setDedicatedVehicleTypeId] = useState("");
  const [dedicatedZoneCount, setDedicatedZoneCount] = useState(1);
  const [dedicatedAreaPercent, setDedicatedAreaPercent] = useState(100);

  // Loại xe được phép gộp tầng "tổng hợp" — lấy động từ VehicleType.mixable,
  // không hardcode đúng 2 loại Xe máy/Xe đạp nữa để loại xe mới cũng dùng được.
  const mixableTypes = useMemo(() => vehicleTypes.filter(v => v.mixable), [vehicleTypes]);
  const [mixedAllocations, setMixedAllocations] = useState({}); // { [vehicleTypeId]: { percent, zoneCount } }

  useEffect(() => {
    if (mixableTypes.length === 0) return;
    setMixedAllocations(prev => {
      const next = { ...prev };
      let changed = false;
      mixableTypes.forEach(v => {
        if (!next[v.id]) {
          next[v.id] = { percent: Math.floor(100 / mixableTypes.length), zoneCount: 1 };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mixableTypes.length]);

  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const t = (msg, type) => toast ? toast(msg, type) : alert(msg);

  useEffect(() => {
    let alive = true;
    setLoadingSummary(true);
    staffApi.getFloorCapacitySummary(floor.id)
      .then(res => {
        if (!alive) return;
        const s = res.data.data;
        setSummary(s);
        if (!s.isMixedEligible) setMode("dedicated");
        if (s.isLocked && s.existingVehicleTypeNames?.length) {
          const lockedType = vehicleTypes.find(v => v.name === s.existingVehicleTypeNames[0]);
          if (lockedType) setDedicatedVehicleTypeId(lockedType.id);
        } else if (!dedicatedVehicleTypeId && vehicleTypes[0]) {
          setDedicatedVehicleTypeId(vehicleTypes[0].id);
        }
      })
      .catch(() => t("Không tải được dữ liệu diện tích tầng", "warning"))
      .finally(() => alive && setLoadingSummary(false));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floor.id]);

  const allocations = useMemo(() => {
    if (mode === "dedicated") {
      if (!dedicatedVehicleTypeId) return [];
      return [{ vehicleTypeId: dedicatedVehicleTypeId, areaPercent: dedicatedAreaPercent, zoneCount: dedicatedZoneCount }];
    }
    return mixableTypes
      .map(v => ({ vehicleTypeId: v.id, ...mixedAllocations[v.id] }))
      .filter(a => a.percent > 0)
      .map(a => ({ vehicleTypeId: a.vehicleTypeId, areaPercent: a.percent, zoneCount: a.zoneCount }));
  }, [mode, dedicatedVehicleTypeId, dedicatedAreaPercent, dedicatedZoneCount, mixableTypes, mixedAllocations]);

  useEffect(() => {
    if (!summary || allocations.length === 0) { setPreview(null); return; }
    setPreviewLoading(true);
    const handle = setTimeout(() => {
      staffApi.previewFloorZones(floor.id, { allocations })
        .then(res => setPreview(res.data.data))
        .catch(() => setPreview({ valid: false, message: "Không tính được preview" }))
        .finally(() => setPreviewLoading(false));
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(allocations), summary]);

  const submit = async () => {
    if (!preview?.valid || allocations.length === 0) return;
    setSubmitting(true);
    try {
      const res = await staffApi.generateFloorZones(floor.id, { allocations });
      t(res.data.message || "Đã tạo zone mới", "success");
      onGenerated?.();
      onClose();
    } catch (err) {
      t(err.response?.data?.message || "Tạo zone thất bại", "warning");
    } finally {
      setSubmitting(false);
    }
  };

  const mixedTotalPercent = mixableTypes.reduce((s, v) => s + (mixedAllocations[v.id]?.percent || 0), 0);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-left border border-slate-200 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div>
          <h3 className="font-extrabold text-slate-900 text-base">Quy hoạch zone — Tầng {floor.floorName}</h3>
          <p className="text-xs text-slate-400 mt-1">Hệ thống tự tính diện tích &amp; số slot mỗi zone dựa trên diện tích tầng còn trống.</p>
        </div>

        {loadingSummary ? (
          <div className="text-center py-8 text-xs text-slate-400 font-bold">Đang tải dữ liệu diện tích...</div>
        ) : summary ? (
          <>
            {/* Capacity stat strip */}
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Diện tích tầng" value={`${summary.floorArea} m²`} />
              <Stat label="Đã dùng" value={`${summary.allocatedArea} m²`} />
              <Stat label="Còn trống" value={`${summary.remainingArea} m²`} highlight />
            </div>
            {summary.hasLegacyZonesWithoutArea && (
              <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                ⚠️ Tầng này có zone cũ chưa có dữ liệu diện tích — số liệu "còn trống" có thể chưa chính xác 100%.
              </p>
            )}
            {summary.remainingArea <= 0 && (
              <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                Tầng đã hết diện tích khả dụng để tạo thêm zone.
              </p>
            )}

            {/* Mode toggle */}
            <div className="flex gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200/50">
              <button type="button" onClick={() => setMode("dedicated")}
                className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${mode === "dedicated" ? "bg-white text-slate-900 shadow-sm border border-slate-200/30" : "text-slate-500 hover:text-slate-800"}`}>
                Chuyên dụng (1 loại xe)
              </button>
              <button type="button" disabled={!summary.isMixedEligible || mixableTypes.length < 2} onClick={() => setMode("mixed")}
                title={!summary.isMixedEligible ? "Tầng đã có loại xe không cho gộp, không thể chuyển sang tổng hợp" : ""}
                className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg transition-all ${mode === "mixed" ? "bg-white text-slate-900 shadow-sm border border-slate-200/30" : "text-slate-500 hover:text-slate-800"} ${!summary.isMixedEligible || mixableTypes.length < 2 ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
                Tổng hợp ({mixableTypes.map(v => v.name).join(" + ") || "chưa có loại xe cho gộp"})
              </button>
            </div>

            {mode === "dedicated" ? (
              <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Loại xe</label>
                  <select
                    value={dedicatedVehicleTypeId}
                    disabled={summary.isLocked}
                    onChange={e => setDedicatedVehicleTypeId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none disabled:opacity-60"
                  >
                    {vehicleTypes.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                  {summary.isLocked && <p className="text-[10px] text-slate-400">Tầng đã gán loại xe này, không đổi được.</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Số zone muốn tạo</label>
                    <input type="number" min="1" value={dedicatedZoneCount}
                      onChange={e => setDedicatedZoneCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">% diện tích còn trống dùng</label>
                    <input type="number" min="1" max="100" value={dedicatedAreaPercent}
                      onChange={e => setDedicatedAreaPercent(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
                {mixableTypes.map(v => (
                  <MixedRow key={v.id} label={v.name}
                    percent={mixedAllocations[v.id]?.percent ?? 0}
                    setPercent={p => setMixedAllocations(prev => ({ ...prev, [v.id]: { ...prev[v.id], percent: p } }))}
                    zoneCount={mixedAllocations[v.id]?.zoneCount ?? 1}
                    setZoneCount={z => setMixedAllocations(prev => ({ ...prev, [v.id]: { ...prev[v.id], zoneCount: z } }))} />
                ))}
                <p className={`text-[11px] font-bold ${mixedTotalPercent > 100 ? "text-red-500" : "text-slate-400"}`}>
                  Tổng: {mixedTotalPercent}% {mixedTotalPercent > 100 && "— vượt quá 100%, hãy giảm bớt"}
                </p>
              </div>
            )}

            {/* Live preview */}
            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/50 space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Xem trước kết quả</p>
              {previewLoading ? (
                <p className="text-xs text-slate-400">Đang tính...</p>
              ) : !preview ? (
                <p className="text-xs text-slate-400">Nhập thông tin để xem trước.</p>
              ) : !preview.valid ? (
                <p className="text-xs text-red-600 font-semibold">{preview.message}</p>
              ) : (
                <div className="space-y-2">
                  {preview.plannedZones.map(z => (
                    <div key={z.zoneCode} className="flex justify-between items-center text-xs bg-white rounded-lg border border-slate-200 px-3 py-2">
                      <span className="font-bold text-slate-700">Zone {z.zoneCode} · {z.vehicleTypeName}</span>
                      <span className="text-slate-500">{z.area} m² → <span className="font-bold text-purple-700">{z.capacity} slot</span></span>
                    </div>
                  ))}
                  <p className="text-[11px] text-slate-400 text-right">Còn lại sau khi tạo: {preview.remainingAreaAfter} m²</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-xs text-red-500">Không tải được dữ liệu tầng.</p>
        )}

        <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-600 cursor-pointer transition-colors">
            Hủy bỏ
          </button>
          <button type="button" disabled={!preview?.valid || submitting} onClick={submit}
            className="rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 text-xs font-bold text-white cursor-pointer transition-colors shadow-lg shadow-purple-500/10">
            {submitting ? "Đang tạo..." : "Tạo zone"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div className={`rounded-xl p-2.5 border text-center ${highlight ? "bg-purple-50 border-purple-200" : "bg-slate-50 border-slate-100"}`}>
      <p className="text-[9px] text-slate-400 font-bold uppercase">{label}</p>
      <p className={`text-xs font-extrabold mt-0.5 ${highlight ? "text-purple-700" : "text-slate-700"}`}>{value}</p>
    </div>
  );
}

function MixedRow({ label, percent, setPercent, zoneCount, setZoneCount }) {
  return (
    <div className="grid grid-cols-3 gap-3 items-end">
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase block">Loại xe</span>
        <p className="text-xs font-bold text-slate-700 py-3">{label}</p>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase">% diện tích</label>
        <input type="number" min="0" max="100" value={percent}
          onChange={e => setPercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none" />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase">Số zone</label>
        <input type="number" min="1" value={zoneCount}
          onChange={e => setZoneCount(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none" />
      </div>
    </div>
  );
}
