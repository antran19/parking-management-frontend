import React, { useState, useEffect, useContext } from "react";
import { managerApi } from "../../api/parkingApi";
import { Spinner } from "../components/Spinner";
import { ManagerContext } from "./ManagerLayout";

const PaymentPage = () => {
  const { triggerToast } = useContext(ManagerContext);
  const [paymentsData, setPaymentsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [paymentDetail, setPaymentDetail] = useState(null);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const res = await managerApi.getPayments();
        setPaymentsData(res.data.data || []);
      } catch (err) {
        triggerToast("Lỗi lấy dữ liệu thanh toán", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const handleViewPaymentDetail = async (id) => {
    try {
      const res = await managerApi.getPaymentDetail(id);
      setPaymentDetail(res.data.data);
      setSelectedPaymentId(id);
    } catch (err) {
      triggerToast("Không thể lấy chi tiết thanh toán", "error");
    }
  };

  const closePaymentModal = () => {
    setSelectedPaymentId(null);
    setPaymentDetail(null);
  };

  const formatDateTime = (value) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleString("vi-VN");
    } catch {
      return String(value);
    }
  };

  const formatDate = (value) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleDateString("vi-VN");
    } catch {
      return String(value);
    }
  };

  const filteredPayments = paymentsData.filter(p => {
    if (!searchTerm.trim()) return true;
    const plate = (p.licensePlate || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const search = searchTerm.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    return plate.includes(search);
  }).sort((a, b) => new Date(b.createdAt || b.entryTime || 0) - new Date(a.createdAt || a.entryTime || 0));

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleExportExcel = async () => {
    try {
      const res = await managerApi.exportExcel('payments');
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'GiaoDichThanhToan.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      triggerToast("Xuất báo cáo thành công", "success");
    } catch (err) {
      triggerToast("Lỗi khi xuất báo cáo", "error");
    }
  };

  return (
    <section className="flex-1 space-y-8 p-8">
      <div className="space-y-6 fade-up-element">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Danh sách Giao dịch</h3>
              <p className="text-xs text-slate-500 mt-1">Lịch sử thanh toán của các phiên gửi xe.</p>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Nút xuất Excel */}
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Xuất Excel
              </button>

              {/* Thanh tìm kiếm biển số */}
              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Tìm theo biển số xe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          </div>

          {loading ? <Spinner /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Mã GD</th>
                    <th className="px-6 py-4">Biển số</th>
                    <th className="px-6 py-4">Loại xe</th>
                    <th className="px-6 py-4">Số tiền</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4">Thời gian vào</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPayments.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-8 text-slate-500">Không tìm thấy giao dịch phù hợp</td></tr>
                  ) : (
                    paginatedPayments.map(p => (
                      <tr key={p.id} onClick={() => handleViewPaymentDetail(p.id)} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                        <td className="px-6 py-4 font-mono text-xs">{p.transactionId || p.id.split('-')[0]}</td>
                        <td className="px-6 py-4">{p.licensePlate || "—"}</td>
                        <td className="px-6 py-4">{p.vehicleTypeName || "—"}</td>
                        <td className="px-6 py-4 font-bold text-indigo-650">{Number(p.amount).toLocaleString('vi-VN')} đ</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${p.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs">{formatDateTime(p.entryTime || p.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-4 mt-4 gap-4">
              <span className="text-xs text-slate-500 font-medium">
                Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredPayments.length)} trong tổng số {filteredPayments.length} giao dịch
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-bold"
                >
                  Trước
                </button>
                <div className="flex items-center gap-1">
                  {(() => {
                    const pages = [];
                    if (totalPages <= 5) {
                      for (let i = 1; i <= totalPages; i++) pages.push(i);
                    } else {
                      if (currentPage <= 3) {
                        pages.push(1, 2, 3, 4, '...', totalPages);
                      } else if (currentPage >= totalPages - 2) {
                        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                      } else {
                        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                      }
                    }
                    return pages.map((page, idx) => (
                      page === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">...</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            currentPage === page
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    ));
                  })()}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-bold"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Chi tiết Thanh toán */}
      {selectedPaymentId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in-fast">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
              <h3 className="text-white font-bold">Chi tiết thanh toán</h3>
              <button onClick={closePaymentModal} className="text-indigo-200 hover:text-white transition-colors cursor-pointer">✕</button>
            </div>
            <div className="p-6">
              {!paymentDetail ? <Spinner /> : (
                <div className="space-y-4 text-sm text-slate-700">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-semibold">Mã GD:</span>
                    <span className="font-mono">{paymentDetail.transactionId || paymentDetail.id.split('-')[0]}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-semibold">Biển số xe:</span>
                    <span>{paymentDetail.licensePlate || "—"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-semibold">Loại xe:</span>
                    <span>{paymentDetail.vehicleTypeName || "—"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-semibold">Khu vực:</span>
                    <span>{paymentDetail.zoneName || "—"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-semibold">
                      {paymentDetail.referenceType === "PASS" ? "Mã thẻ tháng:" : "Mã vé:"}
                    </span>
                    <span className="font-mono">{paymentDetail.sessionCode || "—"}</span>
                  </div>
                  {paymentDetail.referenceType === "PASS" ? (
                    <>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="font-semibold">Ngày bắt đầu:</span>
                        <span>{formatDate(paymentDetail.entryTime)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="font-semibold">Ngày kết thúc:</span>
                        <span>{formatDate(paymentDetail.exitTime)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="font-semibold">Thời gian vào:</span>
                        <span>{formatDateTime(paymentDetail.entryTime)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="font-semibold">Thời gian ra:</span>
                        <span>{formatDateTime(paymentDetail.exitTime)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-semibold">Số tiền:</span>
                    <span className="font-bold text-indigo-650">{Number(paymentDetail.amount).toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-semibold">Phương thức:</span>
                    <span>{paymentDetail.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="font-semibold">Trạng thái:</span>
                    <span className={`font-bold ${paymentDetail.status === 'COMPLETED' ? 'text-emerald-600' : 'text-rose-600'}`}>{paymentDetail.status}</span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="font-semibold">Thời gian thanh toán:</span>
                    <span>{formatDateTime(paymentDetail.paidAt)}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-slate-50 px-6 py-4 text-right">
              <button onClick={closePaymentModal} className="px-4 py-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PaymentPage;
