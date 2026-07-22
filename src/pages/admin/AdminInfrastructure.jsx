import React, { useState, useEffect } from "react";
import { staffApi } from "../../api/parkingApi";
import ZonePlanningWizard from "./ZonePlanningWizard";

/**
 * AdminInfrastructure — Trang cấu hình hạ tầng bãi đỗ xe (MỚI 18/07/2026)
 * Admin có thể: xem/sửa Building, Floor, VehicleType.
 * Công thức đề xuất slot của từng Zone dựa trên diện tích sàn chia đều của tầng.
 */
export default function AdminInfrastructure({ showToast, reloadAdminConfig }) {
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState("floors"); // floors | vehicleTypes

  // Floor modal
  const [floorModal, setFloorModal] = useState(false);
  const [floorForm, setFloorForm] = useState({});
  const [editingFloor, setEditingFloor] = useState(false);

  // Advanced toggle for floor modal
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Building modal
  const [buildingModal, setBuildingModal] = useState(false);
  const [buildingForm, setBuildingForm] = useState({});

  // Vehicle type modal
  const [vehicleTypeModal, setVehicleTypeModal] = useState(false);
  const [vehicleTypeForm, setVehicleTypeForm] = useState({});
  const [editingVehicleType, setEditingVehicleType] = useState(false);

  // Zone planning wizard
  const [planningFloor, setPlanningFloor] = useState(null);

  // Zone capacity edit — bấm vào 1 zone đã tạo để sửa sức chứa (tính lại zoneArea + validate
  // diện tích tầng còn trống ở backend, thay vì cho sửa tay tự do như tab Phân khu đỗ xe cũ)
  const [capacityModal, setCapacityModal] = useState(null); // { zone, floor }
  const [capacityValue, setCapacityValue] = useState(1);

  const toast = (msg, type) => showToast ? showToast(msg, type) : alert(msg);

  const reload = async () => {
    setLoading(true);
    try {
      const [bRes, fRes, vtRes] = await Promise.all([
        staffApi.getBuildings(),
        staffApi.getFloors(),
        staffApi.getVehicleTypes(),
      ]);
      setBuildings(bRes.data.data || []);
      setFloors(fRes.data.data || []);
      setVehicleTypes(vtRes.data.data || []);
    } catch (err) {
      console.warn("Failed to load infrastructure:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  // Building/Floor/Zone/VehicleType đều được các tab khác (Phân khu đỗ xe, Cổng kiểm soát,
  // Bảng tổng quan) hiển thị từ state chung ở AdminDashboard — phải đồng bộ lại state đó
  // mỗi khi có thay đổi ở đây, nếu không các tab kia sẽ hiển thị dữ liệu cũ cho tới khi F5.
  const reloadAll = async () => {
    await reload();
    if (reloadAdminConfig) await reloadAdminConfig();
  };

  // --- Building Update ---
  const saveBuilding = async (e) => {
    e.preventDefault();
    try {
      await staffApi.updateBuilding(buildingForm.id, buildingForm);
      setBuildingModal(false);
      toast("Đã cập nhật thông tin tòa nhà thành công");
      reloadAll();
    } catch (err) {
      toast(err.response?.data?.message || "Lỗi lưu tòa nhà", "warning");
    }
  };

  // --- Vehicle Type CRUD ---
  const openAddVehicleType = () => {
    setVehicleTypeForm({ name: "", description: "", slotAreaSqm: "", maxWeight: "", mixable: false });
    setEditingVehicleType(false);
    setVehicleTypeModal(true);
  };

  const openEditVehicleType = (vt) => {
    setVehicleTypeForm({
      id: vt.id, name: vt.name, description: vt.description || "",
      slotAreaSqm: vt.slotAreaSqm ?? "", maxWeight: vt.maxWeight ?? "", mixable: vt.mixable || false
    });
    setEditingVehicleType(true);
    setVehicleTypeModal(true);
  };

  const saveVehicleType = async (e) => {
    e.preventDefault();
    try {
      if (editingVehicleType) await staffApi.updateVehicleType(vehicleTypeForm.id, vehicleTypeForm);
      else await staffApi.createVehicleType(vehicleTypeForm);
      setVehicleTypeModal(false);
      toast(editingVehicleType ? "Đã cập nhật loại xe" : "Đã tạo loại xe mới");
      reloadAll();
    } catch (err) {
      toast(err.response?.data?.message || "Lỗi lưu loại xe", "warning");
    }
  };

  const deleteVehicleType = async (id, name) => {
    if (!window.confirm(`Xóa loại xe "${name}"?`)) return;
    try {
      await staffApi.deleteVehicleType(id);
      toast(`Đã xóa loại xe ${name}`, "warning");
      reloadAll();
    } catch (err) {
      toast(err.response?.data?.message || "Xóa loại xe thất bại", "warning");
    }
  };

  // --- Floor CRUD ---
  const openAddFloor = () => {
    const b = buildings[0];
    const vt = vehicleTypes[0];
    if (!b?.id || !vt?.id) { toast("Chưa tải được dữ liệu tòa nhà / loại xe", "warning"); return; }
    setShowAdvanced(false);
    // Gợi ý số tầng tiếp theo = cao nhất hiện có + 1, để tầng mới luôn xếp đúng
    // vị trí trong danh sách (sort theo floorNumber) mà không cần admin tự tính tay
    const nextFloorNumber = floors.length ? Math.max(...floors.map(f => f.floorNumber)) + 1 : 1;
    setFloorForm({
      buildingId: b.id, vehicleTypeId: vt.id,
      floorName: "", floorNumber: nextFloorNumber, totalSlots: 0,
      floorArea: 2000, maxZones: 4, description: ""
    });
    setEditingFloor(false);
    setFloorModal(true);
  };

  const openEditFloor = (f) => {
    setFloorForm({
      id: f.id, buildingId: f.buildingId, vehicleTypeId: f.vehicleTypeId,
      floorName: f.floorName, floorNumber: f.floorNumber, totalSlots: floorRealTotalSlots(f),
      floorArea: f.floorArea || "",
      maxZones: f.maxZones || 4,
      description: f.description || ""
    });
    setEditingFloor(true);
    setFloorModal(true);
  };

  const saveFloor = async (e) => {
    e.preventDefault();
    try {
      // Đảm bảo các Double field tùy chọn luôn là số (không phải null/empty)
      // để tránh lỗi NullPointerException khi Lombok Builder auto-unbox
      const payload = {
        ...floorForm,
        maxZones: floorForm.maxZones || 4,
      };
      // totalSlots luôn tự tính từ tổng capacity zone (qua "Quy hoạch zone"), không cho sửa tay ở đây
      delete payload.totalSlots;
      // Xóa key rỗng không cần thiết
      Object.keys(payload).forEach(k => payload[k] === "" && delete payload[k]);

      if (editingFloor) await staffApi.updateFloor(floorForm.id, payload);
      else await staffApi.createFloor(payload);
      setFloorModal(false);
      toast(editingFloor ? "Đã cập nhật tầng" : "Đã tạo tầng mới");
      reloadAll();
    } catch (err) {
      toast(err.response?.data?.message || "Lỗi lưu tầng", "warning");
    }
  };

  const openCapacityModal = (zone, floor) => {
    setCapacityModal({ zone, floor });
    setCapacityValue(zone.capacity || 1);
  };

  const saveZoneCapacity = async (e) => {
    e.preventDefault();
    try {
      await staffApi.updateZone(capacityModal.zone.id, { capacity: capacityValue });
      toast("Đã cập nhật sức chứa zone");
      setCapacityModal(null);
      reloadAll();
    } catch (err) {
      toast(err.response?.data?.message || "Cập nhật sức chứa thất bại", "warning");
    }
  };

  const deleteFloor = async (id, name) => {
    if (!window.confirm(`Xóa tầng ${name}? Tất cả zone trong tầng sẽ bị ảnh hưởng.`)) return;
    try {
      await staffApi.deleteFloor(id);
      toast(`Đã xóa tầng ${name}`, "warning");
      reloadAll();
    } catch (err) {
      toast(err.response?.data?.message || "Xóa tầng thất bại", "warning");
    }
  };

  // Loại xe hiển thị = suy ra từ zone thật của tầng, không dùng Floor.vehicleTypeId
  // (field đó đã lỗi thời từ khi zone có loại xe riêng, không đồng bộ nếu tầng tổng hợp/đổi zone)
  const floorVehicleTypeSummary = (f) => {
    const names = [...new Set((f.zones || []).map(z => z.vehicleTypeName).filter(Boolean))];
    return names.length ? names.join(" + ") : "Chưa có zone";
  };

  // Tổng slot thật = tổng capacity các zone, không dùng Floor.totalSlots gõ tay
  // (field đó chỉ được tự đồng bộ khi tạo zone qua wizard, sửa tay sẽ lệch khỏi zone thật)
  const floorRealTotalSlots = (f) => (f.zones || []).reduce((s, z) => s + (z.capacity || 0), 0);

  if (loading) return <div className="text-center py-10 text-slate-500 font-bold text-sm">Đang tải cấu hình hạ tầng...</div>;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
        <div>
          <h3 className="font-extrabold text-slate-900 text-base">Cấu hình hạ tầng bãi đỗ xe</h3>
          <p className="text-xs text-slate-400">Quản lý tòa nhà, tầng, loại xe — Đề xuất quy hoạch slot tối đa dựa trên diện tích sàn</p>
        </div>
        <div className="flex gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200/50">
          <button
            onClick={() => setSubTab("floors")}
            className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${subTab === "floors" ? "bg-white text-slate-900 shadow-sm border border-slate-200/30" : "text-slate-500 hover:text-slate-800"}`}
          >
            Tầng & Khu
          </button>
          <button
            onClick={() => setSubTab("vehicleTypes")}
            className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${subTab === "vehicleTypes" ? "bg-white text-slate-900 shadow-sm border border-slate-200/30" : "text-slate-500 hover:text-slate-800"}`}
          >
            Loại xe
          </button>
        </div>
      </div>

      {/* Building summary with Edit functionality */}
      {buildings.map(b => (
        <div key={b.id} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 border-l-4 border-l-purple-600 text-left flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <h4 className="font-extrabold text-slate-850 text-base">{b.name}</h4>
            <p className="text-xs text-slate-500 mt-1.5 font-medium">
              {b.address} ·  {floors.length} tầng ·  {b.operatingHoursStart}–{b.operatingHoursEnd}
            </p>
            {b.description && <p className="text-xs text-slate-400 mt-1 font-normal italic">{b.description}</p>}
          </div>
          <button
            onClick={() => {
              setBuildingForm({
                id: b.id,
                name: b.name,
                address: b.address,
                totalFloors: b.totalFloors || 4,
                operatingHoursStart: b.operatingHoursStart || "06:00:00",
                operatingHoursEnd: b.operatingHoursEnd || "22:00:00",
                description: b.description || ""
              });
              setBuildingModal(true);
            }}
            className="rounded-xl border border-slate-200 hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-600 cursor-pointer transition-all shrink-0 self-end sm:self-auto"
          >
            Sửa thông tin tòa nhà
          </button>
        </div>
      ))}

      {/* Sub-tab: Floors */}
      {subTab === "floors" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-left">
            <h4 className="font-extrabold text-slate-900 text-sm">Danh sách tầng đỗ ({floors.length})</h4>
            <button onClick={openAddFloor} className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2.5 text-xs font-bold text-white cursor-pointer transition-colors shadow-lg shadow-purple-500/10">
              Thêm tầng đỗ
            </button>
          </div>

          {floors.sort((a, b) => a.floorNumber - b.floorNumber).map(f => (
            <div key={f.id} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 text-left relative hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-purple-50 text-purple-700 font-black text-sm border border-purple-100">
                      {f.floorName}
                    </span>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                      {floorVehicleTypeSummary(f)}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {f.zoneCount} zone
                    </span>
                  </div>

                  {f.description && <p className="text-xs text-slate-500 font-medium">{f.description}</p>}

                  <div className="grid grid-cols-3 gap-4 pt-1">
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-center sm:text-left">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Diện tích</span>
                      <span className="text-xs font-extrabold text-slate-700 mt-0.5 block">{f.floorArea} m²</span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-center sm:text-left">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Tổng slot</span>
                      <span className="text-xs font-extrabold text-slate-700 mt-0.5 block">{f.totalSlots} ô đỗ</span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-center sm:text-left">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Số zone hiện tại</span>
                      <span className="text-xs font-extrabold text-slate-700 mt-0.5 block">{f.zoneCount} khu vực</span>
                    </div>
                  </div>

                  {/* Zone list — diện tích thật của từng zone (do wizard quy hoạch sinh ra) */}
                  {f.zones && f.zones.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase mb-1.5">Các zone đã tạo trên tầng (bấm để sửa sức chứa):</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {f.zones.map(z => (
                          <div key={z.id} onClick={() => openCapacityModal(z, f)} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs text-slate-600 hover:bg-white hover:border-purple-300 hover:shadow-sm transition-all text-left cursor-pointer">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-slate-800">Zone {z.zoneCode} · {z.vehicleTypeName}</span>
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            </div>
                            <div className="text-[11px] text-slate-500 space-y-0.5">
                              <div className="flex justify-between">
                                <span>Diện tích zone:</span>
                                <span className="font-semibold text-slate-700">{z.zoneArea != null ? `${z.zoneArea} m²` : "Chưa có dữ liệu"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Số xe hiện đỗ / Sức chứa:</span>
                                <span className="font-semibold text-slate-700">{z.currentCount} / {z.capacity} xe</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 w-full md:w-auto justify-end">
                  <button onClick={() => setPlanningFloor(f)} className="rounded-xl border border-purple-200 bg-purple-50/40 hover:bg-purple-50 text-purple-700 px-3.5 py-2 text-xs font-bold cursor-pointer transition-all">
                    Quy hoạch khu
                  </button>
                  <button onClick={() => openEditFloor(f)} className="rounded-xl border border-slate-200 hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-600 cursor-pointer transition-all">
                    Sửa
                  </button>
                  <button onClick={() => deleteFloor(f.id, f.floorName)} className="rounded-xl border border-red-200 bg-red-50/20 hover:bg-red-50 text-red-500 hover:text-red-700 px-3 py-2 text-xs font-bold cursor-pointer transition-all">
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sub-tab: Vehicle Types */}
      {subTab === "vehicleTypes" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={openAddVehicleType} className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2.5 text-xs font-bold text-white cursor-pointer transition-colors shadow-lg shadow-purple-500/10">
              + Thêm loại xe
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {vehicleTypes.map(vt => (
              <div key={vt.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm shadow-slate-100/50 text-left space-y-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                      Quy chuẩn xe
                    </span>
                    {vt.mixable && (
                      <span className="ml-1.5 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                        Gộp được tầng
                      </span>
                    )}
                    <h4 className="font-extrabold text-slate-900 text-sm mt-2">{vt.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">{vt.description}</p>
                  </div>
                  <div className="flex gap-3 shrink-0">
                    <button onClick={() => openEditVehicleType(vt)} className="text-slate-500 hover:text-slate-900 text-xs font-bold cursor-pointer transition-colors">
                      Sửa
                    </button>
                    <button onClick={() => deleteVehicleType(vt.id, vt.name)} className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer transition-colors">
                      Xóa
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-400">Diện tích slot</span>
                    <span className="text-slate-700">{vt.slotAreaSqm} m²</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-400">Trọng lượng max</span>
                    <span className="text-slate-700">{vt.maxWeight} tấn</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Building Modal */}
      {buildingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setBuildingModal(false)}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 text-left border border-slate-200" onClick={e => e.stopPropagation()}>
            <h3 className="font-extrabold text-slate-900 text-base">Sửa thông tin tòa nhà</h3>
            <form onSubmit={saveBuilding} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tên tòa nhà *</label>
                <input
                  type="text"
                  required
                  value={buildingForm.name || ""}
                  onChange={e => setBuildingForm({ ...buildingForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none"
                  placeholder="SmartParking Tower..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Địa chỉ *</label>
                <input
                  type="text"
                  required
                  value={buildingForm.address || ""}
                  onChange={e => setBuildingForm({ ...buildingForm, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none"
                  placeholder="123 Nguyễn Văn Linh..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Giờ mở cửa *</label>
                  <input
                    type="text"
                    required
                    placeholder="06:00:00"
                    value={buildingForm.operatingHoursStart || ""}
                    onChange={e => setBuildingForm({ ...buildingForm, operatingHoursStart: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Giờ đóng cửa *</label>
                  <input
                    type="text"
                    required
                    placeholder="22:00:00"
                    value={buildingForm.operatingHoursEnd || ""}
                    onChange={e => setBuildingForm({ ...buildingForm, operatingHoursEnd: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Mô tả</label>
                <textarea
                  value={buildingForm.description || ""}
                  onChange={e => setBuildingForm({ ...buildingForm, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none h-20"
                  placeholder="Mô tả chi tiết tòa nhà..."
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setBuildingModal(false)} className="rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-600 cursor-pointer transition-colors">
                  Hủy bỏ
                </button>
                <button type="submit" className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2.5 text-xs font-bold text-white cursor-pointer transition-colors shadow-lg shadow-purple-500/10">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vehicle Type Modal */}
      {vehicleTypeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setVehicleTypeModal(false)}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 text-left border border-slate-200" onClick={e => e.stopPropagation()}>
            <h3 className="font-extrabold text-slate-900 text-base">{editingVehicleType ? "Sửa loại xe" : "Thêm loại xe mới"}</h3>
            <form onSubmit={saveVehicleType} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tên loại xe *</label>
                <input
                  type="text"
                  required
                  value={vehicleTypeForm.name || ""}
                  onChange={e => setVehicleTypeForm({ ...vehicleTypeForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none"
                  placeholder="Xe điện, Xe ba gác..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Mô tả</label>
                <input
                  type="text"
                  value={vehicleTypeForm.description || ""}
                  onChange={e => setVehicleTypeForm({ ...vehicleTypeForm, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none"
                  placeholder="Mô tả ngắn gọn loại xe..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Diện tích/slot (m²) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={vehicleTypeForm.slotAreaSqm || ""}
                    onChange={e => setVehicleTypeForm({ ...vehicleTypeForm, slotAreaSqm: parseFloat(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none"
                    placeholder="2.5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Trọng lượng max (tấn)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={vehicleTypeForm.maxWeight || ""}
                    onChange={e => setVehicleTypeForm({ ...vehicleTypeForm, maxWeight: parseFloat(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none"
                    placeholder="0.15"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vehicleTypeForm.mixable || false}
                  onChange={e => setVehicleTypeForm({ ...vehicleTypeForm, mixable: e.target.checked })}
                  className="rounded border-slate-300"
                />
                <span className="text-xs font-bold text-slate-600">Cho phép gộp chung tầng "tổng hợp" với các loại mixable khác</span>
              </label>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setVehicleTypeModal(false)} className="rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-600 cursor-pointer transition-colors">
                  Hủy bỏ
                </button>
                <button type="submit" className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2.5 text-xs font-bold text-white cursor-pointer transition-colors shadow-lg shadow-purple-500/10">
                  {editingVehicleType ? "Lưu thay đổi" : "Tạo loại xe"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floor Modal */}
      {floorModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setFloorModal(false)}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 text-left border border-slate-200" onClick={e => e.stopPropagation()}>
            <h3 className="font-extrabold text-slate-900 text-base">{editingFloor ? "Sửa tầng đỗ" : "Thêm tầng đỗ mới"}</h3>
            <form onSubmit={saveFloor} className="space-y-4">
              {buildings.length > 1 && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Tòa nhà *</label>
                  <select
                    required
                    value={floorForm.buildingId || ""}
                    onChange={e => setFloorForm({ ...floorForm, buildingId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Tên tầng *</label>
                  <input
                    type="text"
                    required
                    value={floorForm.floorName || ""}
                    onChange={e => setFloorForm({ ...floorForm, floorName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none"
                    placeholder="B2, B1, T1..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Thứ tự tầng (hầm là số âm)</label>
                  <input
                    type="number"
                    required
                    value={floorForm.floorNumber || 0}
                    onChange={e => setFloorForm({ ...floorForm, floorNumber: parseInt(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tổng số ô đỗ (slot)</label>
                <div className="w-full rounded-xl border border-slate-200 bg-slate-100 p-3 text-xs font-bold text-slate-500">
                  {floorForm.totalSlots || 0} ô đỗ (tự tính từ zone, không sửa tay được)
                </div>
                <p className="text-[10px] text-slate-400">Loại xe và số slot của từng khu vực được thiết lập qua "Quy hoạch zone", không gán ở cấp tầng.</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Diện tích tầng (m²) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={floorForm.floorArea || ""}
                  onChange={e => setFloorForm({ ...floorForm, floorArea: parseFloat(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none"
                  placeholder="2000"
                />
                <p className="text-[10px] text-slate-400">Mặc định 2000m² — sửa lại nếu tòa nhà/tầng này có diện tích khác. Số zone/slot tối đa được cấu hình qua "Quy hoạch zone" dựa trên kích thước từng loại xe.</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Mô tả tầng đỗ</label>
                <input
                  type="text"
                  value={floorForm.description || ""}
                  onChange={e => setFloorForm({ ...floorForm, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none"
                  placeholder="Ví dụ: Hầm B2 — Ô tô chuyên dụng"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setFloorModal(false)} className="rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-600 cursor-pointer transition-colors">
                  Hủy bỏ
                </button>
                <button type="submit" className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2.5 text-xs font-bold text-white cursor-pointer transition-colors shadow-lg shadow-purple-500/10">
                  {editingFloor ? "Cập nhật" : "Tạo tầng đỗ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Zone Capacity Modal */}
      {capacityModal && (() => {
        const { zone, floor } = capacityModal;
        const vt = vehicleTypes.find(v => v.id === zone.vehicleTypeId);
        const slotArea = vt?.slotAreaSqm > 0 ? vt.slotAreaSqm : 1;
        const allocatedByOthers = (floor.zones || [])
          .filter(z => z.id !== zone.id)
          .reduce((s, z) => s + (z.zoneArea || 0), 0);
        const remainingForThisZone = Math.max(0, (floor.floorArea || 0) - allocatedByOthers);
        const maxCapacity = Math.floor(remainingForThisZone / slotArea);
        const occupied = (zone.currentCount || 0) + (zone.reservedCount || 0);
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setCapacityModal(null)}>
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-6 text-left border border-slate-200" onClick={e => e.stopPropagation()}>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Sửa sức chứa — Zone {zone.zoneCode}</h3>
                <p className="text-xs text-slate-400 mt-1">{zone.vehicleTypeName} · Tầng {floor.floorName}</p>
              </div>
              <form onSubmit={saveZoneCapacity} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Sức chứa (slot)</label>
                  <input
                    type="number"
                    required
                    min={occupied || 1}
                    value={capacityValue}
                    onChange={e => setCapacityValue(parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400">
                    Tối đa ~{maxCapacity} slot theo diện tích tầng còn trống ({remainingForThisZone.toFixed(1)}m² ÷ {slotArea}m²/slot).
                    {occupied > 0 && ` Không thể đặt dưới ${occupied} (đang có ${occupied} xe/chỗ đã đặt trước).`}
                  </p>
                </div>
                <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setCapacityModal(null)} className="rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-600 cursor-pointer transition-colors">
                    Hủy bỏ
                  </button>
                  <button type="submit" className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2.5 text-xs font-bold text-white cursor-pointer transition-colors shadow-lg shadow-purple-500/10">
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Zone Planning Wizard */}
      {planningFloor && (
        <ZonePlanningWizard
          floor={planningFloor}
          vehicleTypes={vehicleTypes}
          toast={toast}
          onClose={() => setPlanningFloor(null)}
          onGenerated={reloadAll}
        />
      )}
    </div>
  );
}
