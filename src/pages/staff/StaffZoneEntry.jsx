import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { staffApi } from "../../api/parkingApi";
import gsap from "gsap";

export default function StaffZoneEntry() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");

  const [gates, setGates] = useState([]);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [ticketInput, setTicketInput] = useState("");

  // Trạng thái quét của Zone Entry
  const [selectedGateId, setSelectedGateId] = useState("");
  const [scanResult, setScanResult] = useState(null); // SessionResponse từ backend
  const [barrierState, setBarrierState] = useState("CLOSED"); // CLOSED, OPEN, WARNING_OPEN

  const barrierRef = useRef(null);
  const [isScannerOn, setIsScannerOn] = useState(false);
  const qrScannerRef = useRef(null);

  // Fetch gates config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await staffApi.getParkingConfig();
        const config = res.data.data;

        const zones = config.zones || [];

        // Lấy các cổng Zone đầu vào (ZONE_ENTRY)
        const zoneGates = (config.gates || [])
          .filter(g => g.gateType === 'ZONE_ENTRY' || g.gateType === 'ZONE_BOTH')
          .map(g => {
            if (g.zoneId) {
              const z = zones.find(zone => zone.id === g.zoneId);
              if (z) {
                return {
                  ...g,
                  displayName: `${z.floorName} - ${z.zoneName}`
                };
              }
            }
            return {
              ...g,
              displayName: `${g.gateName} (Chưa gán)`
            };
          });

        setGates(zoneGates);
        if (zoneGates.length > 0) {
          setSelectedGateId(zoneGates[0].id);
        }
        setConfigLoaded(true);
      } catch (err) {
        console.error('Failed to load gates config:', err);
        setApiError('Không thể tải cấu hình bãi xe từ backend.');
      }
    };
    fetchConfig();
  }, []);

  // Hiệu ứng GSAP cho Barrier xoay
  useEffect(() => {
    if (!barrierRef.current) return;
    if (barrierState === "OPEN" || barrierState === "WARNING_OPEN") {
      gsap.to(barrierRef.current, { rotation: 90, transformOrigin: "right center", duration: 0.8, ease: "power2.out" });
    } else {
      gsap.to(barrierRef.current, { rotation: 0, transformOrigin: "right center", duration: 0.8, ease: "power2.out" });
    }
  }, [barrierState]);

  const startScanner = async () => {
    try {
      setApiError("");
      setApiSuccess("");
      setIsScannerOn(true);

      setTimeout(async () => {
        try {
          const scanner = new Html5Qrcode("zone-qr-reader");
          qrScannerRef.current = scanner;

          await scanner.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: (width, height) => {
                const size = Math.min(width, height) * 0.7;
                return { width: size, height: size };
              }
            },
            (decodedText) => {
              setTicketInput(decodedText);
              handleZoneCheckIn(decodedText);
              stopScanner();
            },
            (errorMessage) => {
              // verbose logs ignored
            }
          );
        } catch (err) {
          console.error("Error starting QR scanner:", err);
          setApiError("Không thể truy cập camera hoặc khởi động bộ quét: " + (err.message || err));
          setIsScannerOn(false);
        }
      }, 300);
    } catch (err) {
      console.error(err);
    }
  };

  const stopScanner = async () => {
    if (qrScannerRef.current) {
      try {
        if (qrScannerRef.current.isScanning) {
          await qrScannerRef.current.stop();
        }
      } catch (err) {
        console.error("Error stopping QR scanner:", err);
      } finally {
        qrScannerRef.current = null;
        setIsScannerOn(false);
      }
    } else {
      setIsScannerOn(false);
    }
  };

  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop().catch(err => console.error(err));
      }
    };
  }, []);

  // Xử lý quét xác nhận
  const handleZoneCheckIn = async (codeToSubmit = ticketInput) => {
    const code = codeToSubmit.trim();
    if (!code) {
      setApiError("Vui lòng nhập biển số xe hoặc mã vé QR!");
      return;
    }
    if (!selectedGateId) {
      setApiError("Vui lòng chọn cổng Zone quét!");
      return;
    }

    setIsSubmitting(true);
    setApiError("");
    setApiSuccess("");
    setScanResult(null);
    setBarrierState("CLOSED");

    try {
      const res = await staffApi.zoneEntry({
        sessionCode: code,
        gateEntryId: selectedGateId
      });

      const data = res.data.data;
      setScanResult(data);
      setTicketInput(data.sessionCode);

      if (data.wrongZoneDetected) {
        setBarrierState("WARNING_OPEN");
        setApiSuccess(`Cảnh báo đi sai Zone! Đã tự động cập nhật đỗ tại ${data.zoneName}. Vi phạm: ${data.wrongZoneCount}/3`);
      } else {
        setBarrierState("OPEN");
        setApiSuccess(`Check-in vào ${data.zoneName} thành công. Đỗ đúng vị trí gợi ý.`);
      }
    } catch (err) {
      console.error("Zone entry error:", err);
      setBarrierState("CLOSED");
      const msg = err.response?.data?.message || err.message || "Lỗi xử lý check-in phụ.";
      setApiError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Giả lập quét nhanh QR từ session đang hoạt động gần nhất
  const handleMockScan = async () => {
    try {
      setApiError("");
      const res = await staffApi.getAllSessionsHistory();
      const allSessions = res.data.data || [];

      // Tìm session đang ACTIVE mà chưa vào zone
      const activeNoZone = allSessions.find(s => s.status === "ACTIVE" && !s.entryZoneGate);

      if (activeNoZone) {
        setTicketInput(activeNoZone.sessionCode);
        handleZoneCheckIn(activeNoZone.sessionCode);
      } else {
        // Fallback: Lấy session active bất kỳ
        const activeAny = allSessions.find(s => s.status === "ACTIVE");
        if (activeAny) {
          setTicketInput(activeAny.sessionCode);
          handleZoneCheckIn(activeAny.sessionCode);
        } else {
          setApiError("Không tìm thấy phiên gửi xe nào đang hoạt động trong bãi! Hãy tạo một Check-in lần 1 ở cổng chính trước.");
        }
      }
    } catch (err) {
      console.error("Failed to mock scan:", err);
      setApiError("Không thể lấy dữ liệu giả lập từ backend.");
    }
  };

  return (
    <section className="flex-1 space-y-6 p-1">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Cột trái: Máy quét camera và thông tin đầu vào (chiếm 9 cột) */}
        <div className="space-y-4 lg:col-span-9 flex flex-col">

          {/* Bảng Camera Điều khiển & Đối soát CCTV 2 Cột */}
          <div className="rounded-2xl shadow-sm overflow-hidden flex flex-col shrink-0 max-w-[900px] w-full">

            {/* Lưới 2 Cột dính liền khép kín */}
            <div className="grid grid-cols-2 gap-[2px]  p-[2px]">

              {/* CỘT 1: QUÉT QR VÉ */}
              <div className="flex flex-col gap-[2px] h-full justify-between ">
                {/* Vùng Camera QR */}
                <div className="relative bg-slate-700 aspect-[4/3] flex items-center justify-center overflow-hidden shrink-0">
                  <div id="zone-qr-reader" className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
                  {!isScannerOn && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-955/95 text-center p-2">
                      <svg className="text-indigo-400 w-10 h-10 mb-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2m10 0h2a2 2 0 012 2v2m0 10v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M5 12h14" />
                      </svg>
                      <p className="font-extrabold text-white text-[10px] tracking-wider uppercase">CAM QUÉT QR TẮT</p>

                    </div>
                  )}

                  {isScannerOn && (
                    /* Scanning red/green laser line */
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <div className="w-48 h-48 border border-dashed border-emerald-500/50 rounded-2xl relative animate-pulse">
                        <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-t-2 border-l-2 border-emerald-500 rounded-tl"></div>
                        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 border-t-2 border-r-2 border-emerald-500 rounded-tr"></div>
                        <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-b-2 border-l-2 border-emerald-500 rounded-bl"></div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-b-2 border-r-2 border-emerald-500 rounded-br"></div>
                        <div className="w-full h-0.5 bg-emerald-500 absolute left-0 animate-laser shadow-[0_0_10px_#10b981]"></div>
                      </div>
                    </div>
                  )}

                  <span className="absolute top-2 left-2  text-white font-black text-[9px] px-1.5 py-0.5 rounded  tracking-wider">
                    CAM 1: QUÉT QR VÉ
                  </span>
                </div>

                {/* Điều khiển Cột 1 */}
                <div className="bg-slate-50 p-10 border-t border-slate-200 flex flex-col gap-1 mt-auto h-[82px] min-h-[82px] justify-center">
                  <div className="flex gap-1 justify-center">
                    <button
                      type="button"
                      onClick={isScannerOn ? stopScanner : startScanner}
                      className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase transition-all cursor-pointer ${isScannerOn ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'
                        }`}
                    >
                      {isScannerOn ? 'Tắt' : 'Bật'}
                    </button>
                    <button
                      type="button"
                      onClick={async () => { await stopScanner(); setTicketInput(""); await startScanner(); }}
                      className="flex-1 bg-slate-200 hover:bg-slate-350 text-slate-750 py-1.5 rounded text-[10px] font-black uppercase transition-all cursor-pointer"
                    >
                      Bỏ qua
                    </button>
                  </div>

                  {/* Nhập mã vé thủ công */}
                  <div className="flex gap-1 items-center mt-0.5 h-[22px]">
                    <input
                      placeholder="Mã vé / Biển số..."
                      value={ticketInput}
                      onChange={(e) => setTicketInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && handleZoneCheckIn()}
                      className="flex-1 rounded border border-slate-250 bg-white px-2 py-0.5 text-[9px] font-bold text-slate-800 uppercase outline-none focus:border-indigo-500 transition-all min-w-[60px]"
                    />
                    <button
                      type="button"
                      onClick={() => handleZoneCheckIn()}
                      className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-[8px] font-bold transition-colors cursor-pointer shrink-0"
                    >
                      Tìm
                    </button>
                  </div>
                </div>
              </div>

              {/* CỘT 2: TRỰC QUAN HÓA BARRIER VÀ TRẠNG THÁI */}
              <div className="flex flex-col gap-[2px] h-full justify-between bg-slate-800">
                {/* Vùng Barrier */}
                <div className="relative bg-slate-955 aspect-[4/3] flex flex-col items-center justify-center overflow-hidden shrink-0 ">
                  {/* Background Glow */}
                  <div className={`absolute w-48 h-48 rounded-full filter blur-2xl opacity-15 -top-10 -left-10 transition-all duration-500 ${barrierState === "OPEN" ? "bg-emerald-500" : (barrierState === "WARNING_OPEN" ? "bg-amber-500" : "bg-rose-500")
                    }`} />

                  {/* Cần Barie (Barrier Arm) */}
                  <div className="w-full max-w-xs h-24 flex items-center justify-center relative mt-2 scale-85">
                    {/* Trụ đứng */}
                    <div className="w-5 h-20 bg-slate-700 rounded-lg absolute right-10 bottom-0 z-10 border-r border-slate-600" />
                    <div className="w-8 h-8 rounded-full bg-slate-600 border-2 border-slate-800 absolute right-8 bottom-12 z-20 flex items-center justify-center">
                      <div className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${barrierState === "OPEN" ? "bg-emerald-500 shadow-md shadow-emerald-500" : (barrierState === "WARNING_OPEN" ? "bg-amber-500 shadow-md shadow-amber-500" : "bg-rose-500 shadow-md shadow-rose-500")
                        }`} />
                    </div>
                    {/* Thanh ngang Barie xoay */}
                    <div
                      ref={barrierRef}
                      className="h-2.5 bg-gradient-to-r from-red-500 via-white to-red-500 border border-slate-800 rounded absolute right-10 bottom-15 z-15 origin-right"
                      style={{ width: "150px" }}
                    />
                    {/* Mặt đường giả lập */}
                    <div className="w-full h-1 bg-slate-800 absolute bottom-0 rounded" />
                  </div>

                  {/* Trạng thái chữ */}
                  <div className="z-10 text-center mt-1">
                    <div className={`text-xs font-black uppercase tracking-wider ${barrierState === "OPEN" ? "text-emerald-400" : (barrierState === "WARNING_OPEN" ? "text-amber-400 animate-pulse" : "text-rose-500")
                      }`}>
                      {barrierState === "OPEN" ? "Barier Mở (Đúng Zone)" : (barrierState === "WARNING_OPEN" ? "Barier Mở (Sai Zone - Đã Đổi)" : "Barier Đóng")}
                    </div>
                  </div>

                  <span className="absolute top-2 left-2  text-white font-black text-[9px] px-1.5 py-0.5 rounded  tracking-wider">
                    TRẠNG THÁI BARIE VẬT LÝ
                  </span>
                </div>

                {/* Đối soát thông tin xe ở dưới */}
                <div className="bg-slate-50 p-2 border-t border-slate-200 flex flex-col gap-1 mt-auto h-[82px] min-h-[82px] justify-center overflow-y-auto">
                  {scanResult ? (
                    <div className="text-[10px] space-y-0.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold uppercase">Biển số:</span>
                        <span className="font-mono font-black text-slate-800 uppercase">{scanResult.licensePlate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold uppercase">Khu đỗ thực tế:</span>
                        <span className="font-black text-blue-600 uppercase">{scanResult.zoneName} ({scanResult.floorName})</span>
                      </div>
                      {scanResult.wrongZoneDetected && (
                        <div className="text-[8px] text-amber-700 font-extrabold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 leading-tight">
                          ⚠️ Sai Zone gợi ý! Số lần vi phạm 30 ngày: {scanResult.wrongZoneCount}/3
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-2 text-slate-400 font-extrabold text-[9px] tracking-wider uppercase">
                      CHỜ QUÉT VÉ...
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Selector Box */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-3 max-w-[1000px] w-full">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Cổng phụ (Zone Gate)</label>
              {configLoaded ? (
                <select
                  value={selectedGateId}
                  onChange={(e) => {
                    setSelectedGateId(e.target.value);
                    setScanResult(null);
                    setBarrierState("CLOSED");
                    setApiError("");
                    setApiSuccess("");
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 bg-white cursor-pointer shadow-sm font-sans"
                >
                  {gates.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.displayName}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="py-2.5 px-3 bg-slate-50 text-slate-500 text-xs font-bold rounded-xl animate-pulse">
                  Đang tải cấu hình cổng...
                </div>
              )}
            </div>
          </div>

          {/* API feedback */}
          {apiError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-xs font-semibold text-rose-700 shrink-0 max-w-[1000px] w-full animate-fade-in">
              ⚠️ {apiError}
            </div>
          )}
          {apiSuccess && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs font-semibold text-emerald-700 shrink-0 max-w-[1000px] w-full animate-fade-in">
              ✅ {apiSuccess}
            </div>
          )}
        </div>

        {/* Cột phải: Thông tin xe quét chi tiết (chiếm 3 cột) */}
        <div className="space-y-3 lg:col-span-3 flex flex-col">

          {/* Trạng thái cổng phụ */}
          <div className="rounded-xl  bg-blue-100 p-3 shadow-xs flex-shrink-0">
            <p className="font-bold text-blue-900 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                Trạng thái Cổng:
              </span>
              <span className="font-black text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                SẴN SÀNG QUÉT
              </span>
            </p>
          </div>

          {/* Demo / Giả lập nhanh */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Giả lập nhanh</span>
            <button
              type="button"
              onClick={handleMockScan}
              disabled={isSubmitting}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-[10px] uppercase rounded-xl shadow-sm active:scale-95 transition-all duration-150 cursor-pointer"
            >
              ⚡ Giả lập Quét vé
            </button>
            <p className="text-[9px] text-slate-450 leading-relaxed font-semibold">
              (Nhấn để tự động quét xe vừa check-in ở cổng chính vào Zone hiện tại)
            </p>
          </div>

          {/* Thông tin xe quét chi tiết */}
          {scanResult && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm animate-fade-in">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Thông tin chi tiết</span>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block text-[9px] uppercase">Biển số xe:</span>
                  <span className="font-mono font-black text-sm text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block mt-0.5">{scanResult.licensePlate}</span>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block text-[9px] uppercase">Khách hàng:</span>
                  <span className="font-black text-slate-700">{scanResult.customerName || "Khách vãng lai"}</span>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block text-[9px] uppercase">Khu đỗ thực tế:</span>
                  <span className="font-black text-blue-600 block">{scanResult.zoneName} ({scanResult.floorName})</span>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block text-[9px] uppercase">Loại vé:</span>
                  <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[9px] font-bold inline-block mt-0.5">
                    {scanResult.driverType === "SUBSCRIBER" ? "Vé tháng" : (scanResult.driverType === "PRE_BOOKED" ? "Đặt trước" : "Vé lượt")}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scanLaser {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .animate-laser {
          position: absolute;
          animation: scanLaser 2s linear infinite;
        }
      `}</style>
    </section>
  );
}
