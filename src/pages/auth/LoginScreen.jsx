import { useState } from "react";
import parkingBg from "../../assets/parking-bg.jpg";

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

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      setEmailError("Vui lòng nhập email");
      return false;
    }

    if (!emailRegex.test(email)) {
      setEmailError("Email không hợp lệ");
      return false;
    }

    setEmailError("");
    return true;
  };

  const validatePassword = (password) => {
    if (!password) {
      setPasswordError("Vui lòng nhập mật khẩu");
      return false;
    }

    if (password.length < 8) {
      setPasswordError("Mật khẩu phải có ít nhất 8 ký tự");
      return false;
    }

    setPasswordError("");
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!validateEmail(email)) return;

    if (mode === "forgot-password") {
      setSuccess("Liên kết đặt lại mật khẩu đã được gửi đến email của bạn!");

      setTimeout(() => {
        setMode("login");
      }, 2000);

      return;
    }

    if (!validatePassword(password)) return;

    if (mode === "register") {
      if (!fullName) {
        setError("Vui lòng nhập họ và tên");
        return;
      }

      if (password !== confirmPassword) {
        setError("Mật khẩu xác nhận không khớp");
        return;
      }

      setSuccess("Đăng ký thành công! Vui lòng đăng nhập.");

      setTimeout(() => {
        setMode("login");
        setSuccess("");
      }, 2000);

      return;
    }

    const lowerEmail = email.toLowerCase();

    if (lowerEmail.includes("admin")) {
      onLogin("admin");
    } else if (lowerEmail.includes("staff")) {
      onLogin("staff");
    } else if (lowerEmail.includes("manager")) {
      onLogin("manager");
    } else if (lowerEmail.includes("driver")) {
      onLogin("driver");
    } else {
      setError("Sai tài khoản hoặc mật khẩu.");
    }
  };

  const handleSocialLogin = (provider) => {
    setSuccess(`Đang đăng nhập với ${provider}...`);

    setTimeout(() => {
      onLogin("driver");
    }, 1000);
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

          <p className="text-xl mb-2">
            Hệ thống quản lý bãi đỗ xe
          </p>

          <p className="text-lg opacity-90">
            Nhanh chóng. Bảo mật. Tự động.
          </p>

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

              <span className="text-lg">
                Đặt trước chỗ đỗ xe trực tuyến
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                ✓
              </div>

              <span className="text-lg">
                Thanh toán nhanh bằng QR Code
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full md:w-1/2 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
            <div className="text-center mb-8">
              <div className="md:hidden mx-auto w-16 h-16 rounded-xl bg-blue-500 flex items-center justify-center text-4xl font-bold mb-4 text-white shadow-lg">
                P
              </div>

              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                {mode === "login" && "Đăng nhập"}
                {mode === "register" && "Đăng ký"}
                {mode === "forgot-password" && "Quên mật khẩu"}
              </h2>

              <p className="text-slate-500">
                {mode === "login" &&
                  "Đăng nhập để truy cập hệ thống"}

                {mode === "register" &&
                  "Tạo tài khoản mới"}

                {mode === "forgot-password" &&
                  "Nhập email để đặt lại mật khẩu"}
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-4 text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 rounded-xl bg-green-50 border border-green-200 p-4 text-green-600">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === "register" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Họ và tên
                  </label>

                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nhập họ và tên"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />

                {emailError && (
                  <p className="mt-2 text-sm text-red-500">
                    {emailError}
                  </p>
                )}
              </div>

              {mode !== "forgot-password" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Mật khẩu
                  </label>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  />

                  {passwordError && (
                    <p className="mt-2 text-sm text-red-500">
                      {passwordError}
                    </p>
                  )}
                </div>
              )}

              {mode === "register" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Xác nhận mật khẩu
                  </label>

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    placeholder="Nhập lại mật khẩu"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-3 font-bold transition-all"
              >
                {mode === "login" && "Đăng nhập"}
                {mode === "register" && "Đăng ký"}
                {mode === "forgot-password" && "Gửi liên kết"}
              </button>
            </form>

            {mode === "login" && (
              <>
                <div className="my-6 flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-200" />

                  <span className="text-sm text-slate-400">
                    Hoặc tiếp tục với
                  </span>

                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleSocialLogin("Google")}
                    className="rounded-xl border border-slate-300 py-3 font-semibold hover:bg-slate-50"
                  >
                    Google
                  </button>

                  <button
                    onClick={() => handleSocialLogin("Facebook")}
                    className="rounded-xl border border-slate-300 py-3 font-semibold hover:bg-slate-50"
                  >
                    Facebook
                  </button>
                </div>
              </>
            )}

            <div className="mt-8 text-center text-sm text-slate-500">
              {mode === "login" && (
                <>
                  Chưa có tài khoản?{" "}
                  <button
                    onClick={() => setMode("register")}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    Đăng ký
                  </button>
                </>
              )}

              {mode === "register" && (
                <>
                  Đã có tài khoản?{" "}
                  <button
                    onClick={() => setMode("login")}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    Đăng nhập
                  </button>
                </>
              )}

              {mode === "forgot-password" && (
                <>
                  Quay lại{" "}
                  <button
                    onClick={() => setMode("login")}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    Đăng nhập
                  </button>
                </>
              )}
            </div>

            {mode === "login" && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setMode("forgot-password")}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Quên mật khẩu?
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}