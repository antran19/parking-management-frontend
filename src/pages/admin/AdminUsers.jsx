import React from "react";

const LicensePlate = ({ plate }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono font-bold text-slate-800 shadow-sm text-xs tracking-widest">
    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block mr-1"></span>
    {plate}
  </span>
);

export default function AdminUsers({
  users,
  handleOpenAddUser,
  handleOpenEditUser,
  handleResetPassword,
  toggleUserStatus,
  handleDeleteUser,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 space-y-6">
      <div className="flex justify-between items-center text-left">
        <div>
          <h3 className="font-extrabold text-slate-900 text-base">Danh sách tài khoản hệ thống</h3>
          <p className="text-xs text-slate-400">Quản trị phân quyền, gán vai trò & trạng thái các nhân viên bãi đỗ.</p>
        </div>
        <button onClick={handleOpenAddUser} className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2.5 text-xs font-bold text-white cursor-pointer transition-colors shadow-lg shadow-purple-500/10">
          ➕ Thêm tài khoản mới
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
            <tr>
              <th className="p-4">Họ và Tên</th>
              <th className="p-4">Email</th>
              <th className="p-4">Số điện thoại</th>
              <th className="p-4">Phân quyền (Role)</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-bold text-slate-900">{u.name}</td>
                <td className="p-4 text-slate-500">{u.email}</td>
                <td className="p-4 text-slate-500 font-mono">{u.phone}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${u.role === "admin" ? "bg-red-50 text-red-700 border border-red-100" :
                    u.role === "security" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                      u.role === "staff" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                        "bg-slate-100 text-slate-700"
                    }`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-4 text-xs">
                  <span className={`inline-flex items-center gap-1 font-bold ${u.status === "active" ? "text-emerald-600" : "text-rose-600"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${u.status === "active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                    {u.status === "active" ? "Hoạt động" : "Bị Khóa"}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex justify-center gap-2 text-xs font-bold">
                    <button onClick={() => handleOpenEditUser(u)} className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors">Sửa</button>
                    <button onClick={() => handleResetPassword(u)} className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-100 cursor-pointer transition-colors">Reset MK</button>
                    <button onClick={() => toggleUserStatus(u.id)} className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors">Khóa/Mở</button>
                    {u.role !== "admin" && (
                      <button onClick={() => handleDeleteUser(u.id, u.name)} className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 cursor-pointer transition-colors">Xóa</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
