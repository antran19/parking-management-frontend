import React, { useState, useEffect, useContext } from "react";
import { managerApi } from "../../api/parkingApi";
import { Spinner } from "../components/Spinner";
import { ManagerContext } from "./ManagerLayout";

const PaymentPage = () => {
  const { triggerToast } = useContext(ManagerContext);
  const [paymentsData, setPaymentsData] = useState([]);
  const [loading, setLoading] = useState(false);
  
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

  return (
    <section className="flex-1 space-y-8 p-8">
      <div className="space-y-6 fade-up-element">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Danh sách Giao dịch</h3>
          {loading ? <Spinner /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Mã GD</th>
                    <th className="px-6 py-4">Số tiền</th>
                    <th className="px-6 py-4">Phương thức</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsData.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-8 text-slate-500">Chưa có dữ liệu</td></tr>
                  ) : (
                    paymentsData.map(p => (
                      <tr key={p.id} onClick={() => handleViewPaymentDetail(p.id)} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                        <td className="px-6 py-4 font-mono text-xs">{p.transactionId || p.id.split('-')[0]}</td>
                        <td className="px-6 py-4 font-bold text-indigo-650">{Number(p.amount).toLocaleString('vi-VN')} đ</td>
                        <td className="px-6 py-4">{p.paymentMethod}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${p.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs">{new Date(p.createdAt).toLocaleString('vi-VN')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
                    <span className="font-mono">{paymentDetail.transactionId || "N/A"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-semibold">Số tiền:</span>
                    <span className="font-bold text-indigo-650">{Number(paymentDetail.amount).toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-semibold">Phương thức:</span>
                    <span>{paymentDetail.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-semibold">Trạng thái:</span>
                    <span className={`font-bold ${paymentDetail.status === 'COMPLETED' ? 'text-emerald-600' : 'text-rose-600'}`}>{paymentDetail.status}</span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="font-semibold">Thời gian thanh toán:</span>
                    <span>{paymentDetail.paidAt ? new Date(paymentDetail.paidAt).toLocaleString('vi-VN') : 'N/A'}</span>
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
