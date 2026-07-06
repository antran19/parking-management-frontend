# 🎓 Giải thích Kiến trúc Admin Dashboard — Dành cho Người mới học React

---

## 1. VÍ DỤ THỰC TẾ ĐỂ HIỂU

Hãy tưởng tượng **AdminDashboard.jsx** giống như **quản lý một nhà hàng**.

| Vai trò nhà hàng | Tương đương trong code |
|---|---|
| **Quản lý nhà hàng** (ra quyết định, giữ tiền, gọi nhà bếp) | `AdminDashboard.jsx` — giữ state, gọi API, xử lý logic |
| **Bảng menu** (khách nhìn thấy món ăn) | `AdminUsers.jsx`, `AdminZones.jsx`, ... — chỉ hiển thị dữ liệu |
| **Nhà bếp** (nơi nấu ăn thật sự) | Backend API (`staffApi.getAdminUsers()`, ...) |
| **Phiếu order** (truyền yêu cầu từ bàn vào bếp) | Props (dữ liệu truyền từ cha xuống con) |

**Quản lý** là người duy nhất nói chuyện với **nhà bếp**. Các **bảng menu** (component con) chỉ hiển thị thông tin mà quản lý đưa cho.

---

## 2. TRƯỚC KHI REFACTOR (file cũ ~2500 dòng)

Trước đây, **mọi thứ nằm trong 1 file duy nhất** `AdminDashboard.jsx`:

```
AdminDashboard.jsx (2500 dòng)
├── Gọi API lấy users, zones, gates, tariffs, ...
├── Lưu dữ liệu vào state
├── Hiển thị sidebar
├── Hiển thị tab Users (bảng danh sách, nút thêm/sửa/xóa)
├── Hiển thị tab Zones (bảng khu đỗ xe)
├── Hiển thị tab Gates (bảng cổng)
├── Hiển thị tab Tariffs (bảng biểu phí)
├── Hiển thị tab Passes (bảng vé tháng)
├── Hiển thị tab Exceptions (nhật ký sự cố)
├── Hiển thị tab Reports (báo cáo doanh thu)
├── Hiển thị tab Settings (cài đặt)
└── 6 cái modal (form popup thêm/sửa)
```

> **Vấn đề:** File quá dài, khó đọc, khó debug, khó giải thích khi bị hỏi.

---

## 3. SAU KHI REFACTOR (kiến trúc mới)

Bây giờ, tách thành **11 file**:

```
AdminDashboard.jsx (1574 dòng) ← "Quản lý nhà hàng"
├── AdminOverview.jsx       ← "Bảng tổng quan"
├── AdminUsers.jsx          ← "Bảng quản lý nhân viên"
├── AdminZones.jsx          ← "Bảng khu đỗ xe"
├── AdminGates.jsx          ← "Bảng cổng ra vào"
├── AdminTariffs.jsx        ← "Bảng biểu phí"
├── AdminPasses.jsx         ← "Bảng vé định kỳ"
├── AdminExceptionLogs.jsx  ← "Bảng nhật ký sự cố"
├── AdminBlacklist.jsx      ← "Bảng danh sách cấm"
├── AdminReports.jsx        ← "Bảng báo cáo doanh thu"
└── AdminSettings.jsx       ← "Bảng cài đặt hệ thống"
```

---

## 4. GIẢI THÍCH CHI TIẾT BẰNG CODE THẬT

### Bước 1: AdminDashboard.jsx GỌI API và LƯU DỮ LIỆU

```jsx
// File: AdminDashboard.jsx (dòng 138-147)

// ① Tạo "hộp chứa" dữ liệu (state)
const [users, setUsers] = useState([]);      // Danh sách tài khoản
const [zones, setZones] = useState([]);      // Danh sách khu đỗ xe
const [gates, setGates] = useState([]);      // Danh sách cổng
const [tariffs, setTariffs] = useState([]);  // Danh sách biểu phí
const [passes, setPasses] = useState([]);    // Danh sách vé định kỳ
```

> **Giải thích `useState`:** Giống như tạo một **biến** có khả năng tự cập nhật giao diện khi giá trị thay đổi.
> - `users` = giá trị hiện tại (ban đầu là mảng rỗng `[]`)
> - `setUsers` = hàm để thay đổi giá trị (khi gọi `setUsers(data)`, React tự vẽ lại UI)

### Bước 2: Khi mở trang, GỌI API lấy dữ liệu từ Backend

```jsx
// File: AdminDashboard.jsx (dòng 309-363)

useEffect(() => {
  // ② Định nghĩa hàm gọi API
  const fetchAdminUsers = async () => {
    const res = await staffApi.getAdminUsers();  // Gọi xuống Backend
    setUsers(res.data.data || []);               // Lưu kết quả vào state
  };

  // ③ Gọi tất cả API khi trang mở
  fetchAdminUsers();
  fetchPasses();
  fetchConfig();
  fetchSettings();
  fetchLogs();
  fetchSessions();
  fetchPayments();
  fetchBlacklist();

  // ④ Tự động refresh mỗi 5 giây
  const interval = setInterval(() => {
    fetchAdminUsers();
    fetchPasses();
    fetchLogs();
    fetchSessions();
    fetchPayments();
    fetchBlacklist();
  }, 5000);

  return () => clearInterval(interval);  // ⑤ Dọn dẹp khi rời trang
}, []);
```

> **Giải thích `useEffect`:** Giống như nói với React "Khi trang này được mở lên, hãy làm những việc sau đây". Dấu `[]` ở cuối nghĩa là **chỉ chạy 1 lần** khi trang mở.

> **Giải thích `async/await`:** Gọi API mất thời gian (phải đợi server trả lời). `await` nghĩa là "đợi cho xong rồi tiếp tục".

### Bước 3: Định nghĩa CÁC HÀM XỬ LÝ (handlers)

```jsx
// File: AdminDashboard.jsx (dòng 525-531)

// Khi Admin nhấn nút "Xóa" user
const handleDeleteUser = async (id, name) => {
  if (window.confirm(`Xóa tài khoản ${name}?`)) {     // Hỏi xác nhận
    await staffApi.deleteAdminUser(id);                 // Gọi API xóa
    setUsers(users.filter(u => u.id !== id));           // Xóa khỏi state
    showToast(`Đã xóa ${name}`, "warning");            // Hiện thông báo
  }
};
```

> **Lưu ý:** Hàm `handleDeleteUser` được viết trong `AdminDashboard.jsx`, **KHÔNG PHẢI** trong `AdminUsers.jsx`. Vì AdminDashboard là nơi quản lý state `users`.

### Bước 4: TRUYỀN DỮ LIỆU XUỐNG component con qua PROPS

```jsx
// File: AdminDashboard.jsx (dòng 1055-1065)

{activeTab === "users" && (
  <AdminUsers
    users={users}                              // ← Truyền danh sách users
    handleOpenAddUser={handleOpenAddUser}       // ← Truyền hàm "Thêm"
    handleOpenEditUser={handleOpenEditUser}     // ← Truyền hàm "Sửa"
    handleResetPassword={handleResetPassword}   // ← Truyền hàm "Reset MK"
    toggleUserStatus={toggleUserStatus}         // ← Truyền hàm "Khóa/Mở"
    handleDeleteUser={handleDeleteUser}         // ← Truyền hàm "Xóa"
  />
)}
```

> **Giải thích Props:** Props giống như **phong bì** gửi từ cha (`AdminDashboard`) xuống con (`AdminUsers`).
> - `users={users}` → gửi dữ liệu danh sách tài khoản
> - `handleDeleteUser={handleDeleteUser}` → gửi **hàm xóa** (để con gọi khi cần)

### Bước 5: Component con NHẬN props và HIỂN THỊ

```jsx
// File: AdminUsers.jsx (toàn bộ file)

import React from "react";

// ⑥ Nhận props từ cha
export default function AdminUsers({
  users,               // Mảng users nhận từ AdminDashboard
  handleOpenAddUser,   // Hàm nhận từ AdminDashboard
  handleOpenEditUser,
  handleResetPassword,
  toggleUserStatus,
  handleDeleteUser,
}) {
  return (
    <div>
      {/* Nút "Thêm" — khi click sẽ gọi hàm của CHA */}
      <button onClick={handleOpenAddUser}>
        Thêm tài khoản mới
      </button>

      {/* Bảng — dùng dữ liệu users từ CHA */}
      <table>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>
                {/* Nút "Xóa" — gọi hàm của CHA */}
                <button onClick={() => handleDeleteUser(u.id, u.name)}>
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

> **Điểm quan trọng:** `AdminUsers.jsx` **KHÔNG CÓ** `useState`, **KHÔNG GỌI** `staffApi`, **KHÔNG CÓ** `useEffect`. Nó chỉ nhận dữ liệu qua props và hiển thị.

---

## 5. SƠ ĐỒ LUỒNG DỮ LIỆU

```
┌─────────────────────────────────────────────────────┐
│              AdminDashboard.jsx                      │
│                                                      │
│  ① useState: users = []                              │
│  ② useEffect: staffApi.getAdminUsers()               │
│       → response → setUsers(data) → users = [...]    │
│  ③ handleDeleteUser = async (id) => { ... }          │
│                                                      │
│  ④ Render:                                           │
│     <AdminUsers                                      │
│        users={users}              ←── truyền DATA    │
│        handleDeleteUser={...}     ←── truyền HÀM     │
│     />                                               │
└──────────────────────┬──────────────────────────────┘
                       │ props (giống phong bì)
                       ▼
┌─────────────────────────────────────────────────────┐
│              AdminUsers.jsx                          │
│                                                      │
│  ⑤ Nhận props: { users, handleDeleteUser }           │
│  ⑥ Hiển thị: users.map(u => <tr>...</tr>)            │
│  ⑦ Khi click "Xóa":                                 │
│     → gọi handleDeleteUser(id) ←── hàm của CHA      │
│     → CHA gọi API xóa                               │
│     → CHA cập nhật state                             │
│     → React tự vẽ lại UI                             │
└─────────────────────────────────────────────────────┘
```

---

## 6. KHI ADMIN NHẤN NÚT "XÓA USER" — CHUYỆN GÌ XẢY RA?

```
Bước 1: Admin click nút "Xóa" trên giao diện
         ↓
Bước 2: AdminUsers.jsx gọi: handleDeleteUser("abc-123", "Nguyễn Văn A")
         ↓ (hàm này do AdminDashboard.jsx truyền xuống qua props)
         ↓
Bước 3: AdminDashboard.jsx chạy hàm handleDeleteUser:
         → window.confirm("Xóa tài khoản Nguyễn Văn A?")
         → Admin nhấn OK
         ↓
Bước 4: staffApi.deleteAdminUser("abc-123")
         → Axios gửi: DELETE /api/v1/admin/users/abc-123
         → Header: Authorization: Bearer eyJhbG...
         ↓
Bước 5: Backend nhận request:
         → JwtAuthFilter kiểm tra JWT token ✓
         → @PreAuthorize kiểm tra role = ADMIN ✓
         → userRepository.deleteById("abc-123")
         → PostgreSQL: DELETE FROM users WHERE id = 'abc-123'
         → Trả về 200 OK
         ↓
Bước 6: AdminDashboard.jsx nhận response:
         → setUsers(users.filter(u => u.id !== "abc-123"))
         → State users thay đổi (bớt 1 phần tử)
         ↓
Bước 7: React tự động vẽ lại AdminUsers.jsx
         → Vì props users đã thay đổi
         → Bảng hiển thị ít đi 1 dòng
         → showToast("Đã xóa Nguyễn Văn A")
```

---

## 7. TẠI SAO LÀM NHƯ VẬY? (Ưu điểm)

### ❌ Cách cũ (1 file 2500 dòng):
- Muốn sửa giao diện tab Users → phải scroll qua 1000 dòng code khác
- Bị hỏi "tab Users nằm ở đâu?" → khó trả lời vì nằm lẫn trong file khổng lồ
- Nhiều người cùng sửa 1 file → dễ conflict khi merge code

### ✅ Cách mới (11 file nhỏ):
- Muốn sửa giao diện tab Users → mở file `AdminUsers.jsx` (chỉ ~100 dòng)
- Bị hỏi "tab Users nằm ở đâu?" → trả lời ngay: `AdminUsers.jsx`
- Mỗi người sửa file riêng → ít conflict

---

## 8. NGOẠI LỆ: AdminExceptionLogs.jsx & AdminBlacklist.jsx

Hai file này **khác** với pattern trên. Chúng **tự gọi API** bên trong:

```jsx
// File: AdminExceptionLogs.jsx (có useState + useEffect riêng)
export default function AdminExceptionLogs({ showToast, user }) {
  const [logs, setLogs] = useState([]);        // ← Có state riêng
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const res = await staffApi.getSecurityExceptions(); // ← Tự gọi API
      setLogs(res.data.data || []);
    };
    fetchLogs();
  }, []);
  // ...
}
```

> **Lý do:** 2 component này được tạo **trước khi refactor**, đã có logic CRUD hoàn chỉnh bên trong. Vì chúng hoạt động tốt nên giữ nguyên, không cần tách logic ra AdminDashboard.

---

## 9. TÓM TẮT 1 CÂU

> **AdminDashboard.jsx** = "Bộ não" (gọi API, giữ dữ liệu, xử lý logic)
> **Các file con** = "Màn hình" (chỉ hiển thị những gì bộ não đưa cho)
