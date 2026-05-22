import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

  @keyframes fadeInUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes slideDown { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes scaleIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
  @keyframes bounce { 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-6px); } }

  .nav-link { color: rgba(255,255,255,0.8); text-decoration:none; font-size:15px; font-weight:500;
    padding:8px 16px; border-radius:8px; transition:all 0.2s; }
  .nav-link:hover { color:#fff; background:rgba(255,255,255,0.1); }

  .hero-btn { display:inline-flex; align-items:center; gap:10px; padding:14px 32px;
    border-radius:12px; font-size:15px; font-weight:600; cursor:pointer; transition:all 0.3s;
    text-decoration:none; border:none; }
  .hero-btn:hover { transform:translateY(-2px); }

  .modal-input { width:100%; height:50px; padding:0 16px; font-size:14px; border-radius:12px;
    border:1px solid #e5e7eb; background:#f9fafb; color:#111; outline:none;
    box-sizing:border-box; transition:all 0.2s; font-family:inherit; }
  .modal-input:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,0.12); }
  .modal-input::placeholder { color:#9ca3af; }

  .modal-overlay { position:fixed; inset:0; z-index:100; display:flex; align-items:center; justify-content:center;
    background:rgba(0,0,0,0.6); backdrop-filter:blur(8px); animation:fadeIn 0.25s ease; }
  .modal-card { background:#fff; border-radius:24px; padding:40px; width:100%; max-width:420px;
    box-shadow:0 25px 60px rgba(0,0,0,0.3); animation:scaleIn 0.35s ease; position:relative; }

  .submit-btn { width:100%; height:50px; border-radius:12px; border:none;
    background:linear-gradient(135deg,#3b82f6,#2563eb); color:#fff; font-size:15px;
    font-weight:600; cursor:pointer; transition:all 0.25s; font-family:inherit; }
  .submit-btn:hover:not(:disabled) { background:linear-gradient(135deg,#2563eb,#1d4ed8);
    box-shadow:0 8px 24px rgba(37,99,235,0.35); transform:translateY(-1px); }
  .submit-btn:disabled { opacity:0.6; cursor:not-allowed; }
`;

const SLIDES = [
  "https://images.pexels.com/photos/1004409/pexels-photo-1004409.jpeg?auto=compress&cs=tinysrgb&w=1920",
  "https://images.pexels.com/photos/1004410/pexels-photo-1004410.jpeg?auto=compress&cs=tinysrgb&w=1920",
  "https://images.pexels.com/photos/63294/autos-technology-vw-702-63294.jpeg?auto=compress&cs=tinysrgb&w=1920",
];

export function LoginScreen({ onLogin }) {
  const [showLogin, setShowLogin] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axiosClient.post("/auth/login", { email, password });
      const { accessToken, user } = res.data.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem(
        "user",
        JSON.stringify({
          role: user.role,
          fullName: user.fullName,
          email: user.email,
        })
      );

      // Map backend role to the target project's role format
      const roleMap = {
        DRIVER: "driver",
        STAFF: "staff",
        MANAGER: "manager",
        ADMIN: "admin",
        SECURITY: "security",
      };
      const mappedRole = roleMap[user.role] || "driver";
      onLogin(mappedRole);
    } catch (err) {
      setError(
        err.response?.data?.message || "Email hoặc mật khẩu không đúng"
      );
    } finally {
      setLoading(false);
    }
  };

  // Slideshow timer — chuyển ảnh mỗi 4s
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <style>{css}</style>

      <div
        style={{
          minHeight: "100vh",
          position: "relative",
          overflow: "hidden",
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {/* ===== BACKGROUND SLIDESHOW ===== */}
        {SLIDES.map((url, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url('${url}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: currentSlide === i ? 1 : 0,
              transition: "opacity 1.5s ease-in-out",
            }}
          />
        ))}
        {/* Dark overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.55) 100%)",
          }}
        />

        {/* ===== NAV BAR ===== */}
        <nav
          style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 48px",
            animation: "slideDown 0.6s ease-out",
          }}
        >
          {/* Left links */}
          <div style={{ display: "flex", gap: "4px" }}>
            <a href="#" className="nav-link">
              Trang chủ
            </a>
            <a href="#" className="nav-link">
              Dịch vụ
            </a>
            <a href="#" className="nav-link">
              Giới thiệu
            </a>
            <a href="#" className="nav-link">
              Liên hệ
            </a>
          </div>

          {/* Center logo */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: "800",
                color: "white",
                boxShadow: "0 4px 16px rgba(59,130,246,0.4)",
              }}
            >
              P
            </div>
            <span
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "white",
                letterSpacing: "-0.3px",
              }}
            >
              SmartParking
            </span>
          </div>

          {/* Right button */}
          <button
            onClick={() => setShowLogin(true)}
            className="hero-btn"
            style={{
              background: "transparent",
              color: "white",
              border: "2px solid rgba(255,255,255,0.5)",
              padding: "10px 24px",
              fontSize: "14px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.15)";
              e.currentTarget.style.borderColor = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)";
            }}
          >
            Đăng Nhập
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
            </svg>
          </button>
        </nav>

        {/* ===== HERO CENTER ===== */}
        <div
          style={{
            position: "relative",
            zIndex: 5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            color: "white",
            minHeight: "calc(100vh - 180px)",
            padding: "0 24px",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(36px, 5vw, 64px)",
              fontWeight: "800",
              lineHeight: 1.1,
              letterSpacing: "-1px",
              textTransform: "uppercase",
              animation: "fadeInUp 0.8s ease-out",
              textShadow: "0 4px 30px rgba(0,0,0,0.3)",
              maxWidth: "900px",
            }}
          >
            Bãi xe thông minh
            <br />
            <span style={{ color: "#60a5fa" }}>quản lý tự động</span>
          </h1>

          <p
            style={{
              fontSize: "16px",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.7)",
              maxWidth: "620px",
              marginTop: "24px",
              animation: "fadeInUp 1s ease-out",
            }}
          >
            Hệ thống quản lý bãi đỗ xe hiện đại — Check-in/out nhanh chóng,
            theo dõi zone trống real-time, tính phí tự động và hỗ trợ đa vai
            trò từ tài xế đến quản lý.
          </p>

          {/* CTA - Khám phá thêm */}
          <div style={{ marginTop: "40px", animation: "fadeInUp 1.2s ease-out" }}>
            <button
              onClick={() => setShowLogin(true)}
              className="hero-btn"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1.5px solid rgba(255,255,255,0.3)",
                color: "white",
                backdropFilter: "blur(6px)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              }}
            >
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
                strokeLinecap="round"
                style={{ animation: "bounce 2s infinite" }}
              >
                <path d="M12 5v14M19 12l-7 7-7-7" />
              </svg>
              Khám Phá Thêm
            </button>
          </div>
        </div>

        {/* ===== BOTTOM CTA ===== */}
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            animation: "fadeInUp 1.4s ease-out",
          }}
        >
          <button
            onClick={() => setShowLogin(true)}
            className="hero-btn"
            style={{
              background: "linear-gradient(135deg, #3b82f6, #2563eb)",
              color: "white",
              boxShadow: "0 8px 30px rgba(37,99,235,0.4)",
              padding: "16px 36px",
              fontSize: "15px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "0 12px 40px rgba(37,99,235,0.55)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                "0 8px 30px rgba(37,99,235,0.4)";
            }}
          >
            Đăng Nhập Ngay
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
            </svg>
          </button>
        </div>
      </div>

      {/* ===== LOGIN MODAL ===== */}
      {showLogin && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowLogin(false)}
        >
          <div className="modal-card">
            {/* Close */}
            <button
              onClick={() => setShowLogin(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: "none",
                background: "#f3f4f6",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                color: "#6b7280",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#e5e7eb";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f3f4f6";
              }}
            >
              ✕
            </button>

            {/* Logo */}
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  margin: "0 auto 12px",
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  fontWeight: "800",
                  color: "white",
                  boxShadow: "0 6px 20px rgba(59,130,246,0.3)",
                }}
              >
                P
              </div>
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                Đăng nhập
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "#9ca3af",
                  marginTop: "6px",
                }}
              >
                Truy cập hệ thống SmartParking
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  marginBottom: "16px",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  fontSize: "13px",
                  color: "#dc2626",
                }}
              >
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "6px",
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@park.com"
                  required
                  className="modal-input"
                />
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "6px",
                  }}
                >
                  Mật khẩu
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                  className="modal-input"
                />
              </div>
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? "Đang xác thực..." : "Đăng nhập"}
              </button>
            </form>

            {/* Demo accounts */}
            <div
              style={{
                marginTop: "24px",
                paddingTop: "20px",
                borderTop: "1px solid #f3f4f6",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  marginBottom: "10px",
                }}
              >
                Tài khoản demo
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                }}
              >
                {[
                  { label: "Staff", email: "staff@parking.vn" },
                  { label: "Driver", email: "driver@parking.vn" },
                  { label: "Manager", email: "manager@parking.vn" },
                  { label: "Admin", email: "admin@parking.vn" },
                ].map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => {
                      setEmail(acc.email);
                      setPassword("123456");
                    }}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1px solid #e5e7eb",
                      background: "#fafbfc",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#3b82f6";
                      e.currentTarget.style.background = "#eff6ff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e5e7eb";
                      e.currentTarget.style.background = "#fafbfc";
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#111827",
                      }}
                    >
                      {acc.label}
                    </span>
                    <span
                      style={{
                        display: "block",
                        fontSize: "11px",
                        color: "#9ca3af",
                        marginTop: "2px",
                      }}
                    >
                      {acc.email}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default LoginScreen;