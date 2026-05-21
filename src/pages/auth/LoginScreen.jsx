import { useState } from "react";
import parkingBg from "../../assets/parking-bg.jpg";
import { forgotPasswordApi, loginApi, registerApi } from "../../api/authApi";

export function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!value.trim()) {
      setEmailError("Vui lòng nhập email");
      return false;
    }

    if (!emailRegex.test(value)) {
      setEmailError("Email không hợp lệ");
      return false;
    }

    setEmailError("");
    return true;
  };

  const validatePassword = (value) => {
    if (!value) {
      setPasswordError("Vui lòng nhập mật khẩu");
      return false;
    }

    if (value.length < 8) {
      setPasswordError("Mật khẩu phải có ít nhất 8 ký tự");
      return false;
    }

    setPasswordError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!validateEmail(email)) return;

    try {
      setLoading(true);

      if (mode === "forgot-password") {
        await forgotPasswordApi(email);
        setSuccess("Liên kết đặt lại mật khẩu đã được gửi đến email của bạn!");
        setTimeout(() => setMode("login"), 2000);
        return;
      }

      if (!validatePassword(password)) return;

      if (mode === "register") {
        if (!fullName.trim()) {
          setError("Vui lòng nhập họ và tên");
          return;
        }

        if (password !== confirmPassword) {
          setError("Mật khẩu xác nhận không khớp");
          return;
        }

        await registerApi({
          fullName,
          email,
          password,
        });

        setSuccess("Đăng ký thành công! Vui lòng đăng nhập.");

        setTimeout(() => {
          setMode("login");
          setSuccess("");
          setPassword("");
          setConfirmPassword("");
        }, 1500);

        return;
      }

      const data = await loginApi({
        email,
        password,
      });

      localStorage.setItem("accessToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      onLogin(data.user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    setError(`Chức năng đăng nhập với ${provider} chưa được kết nối backend.`);
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="hidden md:flex md:w-1/2 min-h-screen relative bg-slate-900">
        <img
          src={parkingBg}
          alt="Bãi đỗ xe hiện đại"
          className="object-cover w-full h-full opacity-80"
        />

        <div className="absolute inset-0 bg-linear-to-r from-blue-600/60 to-cyan-500/60" />

        <div className="absolute inset-0 flex flex-col justify-center px-16 text-white">
          <div className="w-16 h-16 rounded-xl bg-blue-500 flex items-center justify-center text-4xl font-bold mb-6 shadow-lg">
            P
          </div>

          <h1 className="text-4xl font-bold mb-4">Smart Parking</h1>
          <p className="text-xl mb-2">Hệ thống quản lý bãi đỗ xe</p>
          <p className="text-lg opacity-90">Nhanh chóng. Bảo mật. Tự động.</p>

          <div className="mt-12 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                ✓
              </div>
              <span className="text-lg">
                Xem chỗ trống theo từng tầng, từng khu vực
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                ✓
              </div>
              <span className="text-lg">Đặt chỗ gửi xe nhanh và an toàn</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                ✓
              </div>
              <span className="text-lg">
                Check-in, thanh toán và theo dõi xe dễ dàng
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full md:w-1/2 min-h-screen flex items-center justify-center bg-background p-8">
        <div className="w-full max-w-md">
          <div className="md:hidden text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-xl bg-blue-500 flex items-center justify-center text-4xl font-bold text-white mb-4 shadow-lg">
              P
            </div>
            <h1 className="text-3xl font-bold text-primary">Smart Parking</h1>
          </div>

          <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
            <div className="flex gap-2 mb-6 bg-muted p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors ${
                  mode === "login"
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Đăng nhập
              </button>

              <button
                type="button"
                onClick={() => setMode("register")}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors ${
                  mode === "register"
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Đăng ký
              </button>
            </div>

            {mode === "forgot-password" && (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="mb-4 text-sm text-primary hover:underline"
              >
                ← Quay lại đăng nhập
              </button>
            )}

            <h2 className="text-2xl font-bold mb-6 text-foreground">
              {mode === "login" && "Chào mừng trở lại"}
              {mode === "register" && "Tạo tài khoản"}
              {mode === "forgot-password" && "Đặt lại mật khẩu"}
            </h2>

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {success}
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-input-background"
                    placeholder="Nhập họ và tên"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  onBlur={() => validateEmail(email)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-input-background ${
                    emailError ? "border-destructive" : "border-input"
                  }`}
                  placeholder="you@example.com"
                />
                {emailError && (
                  <p className="mt-1 text-sm text-destructive">{emailError}</p>
                )}
              </div>

              {mode !== "forgot-password" && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError("");
                    }}
                    onBlur={() =>
                      mode === "register" && validatePassword(password)
                    }
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-input-background ${
                      passwordError ? "border-destructive" : "border-input"
                    }`}
                    placeholder="••••••••"
                  />
                  {passwordError && (
                    <p className="mt-1 text-sm text-destructive">
                      {passwordError}
                    </p>
                  )}
                </div>
              )}

              {mode === "register" && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Xác nhận mật khẩu
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-input-background"
                    placeholder="••••••••"
                  />
                </div>
              )}

              {mode === "login" && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-input" />
                    <span className="text-muted-foreground">
                      Ghi nhớ đăng nhập
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setMode("forgot-password")}
                    className="text-primary hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-3 text-center font-semibold text-white shadow-md transition-colors hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Đang xử lý..."
                  : mode === "login"
                  ? "Đăng nhập"
                  : mode === "register"
                  ? "Tạo tài khoản"
                  : "Gửi liên kết đặt lại mật khẩu"}
              </button>
            </form>

            {mode !== "forgot-password" && (
              <>
                <div className="flex items-center gap-4 my-6">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-sm text-slate-500 whitespace-nowrap">
                    Hoặc tiếp tục với
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSocialLogin("Google")}
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md active:scale-[0.98]"
                  >
                    Google
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSocialLogin("Facebook")}
                    className="flex items-center justify-center gap-2 rounded-lg border border-[#1877F2] bg-[#1877F2] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#166FE5] hover:shadow-md active:scale-[0.98]"
                  >
                    Facebook
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}