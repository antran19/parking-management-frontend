// src/components/AppErrorBoundary.jsx

import { Component } from "react";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "Ứng dụng gặp lỗi hiển thị.",
    };
  }

  componentDidCatch(error, info) {
    console.error("SmartParking UI error:", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleBackHome = () => {
    const role = localStorage.getItem("userRole") || "driver";
    const homePathByRole = {
      admin: "/admin/dashboard",
      driver: "/driver/dashboard",
    };

    window.location.href = homePathByRole[role] || "/driver/dashboard";
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-900">
        <section className="max-w-xl rounded-3xl border bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-black uppercase tracking-widest text-red-500">
            SmartParking UI Error
          </p>
          <h1 className="mt-3 text-3xl font-black">Trang gặp lỗi hiển thị</h1>
          <p className="mt-3 text-slate-500">
            Mình đã chặn lỗi để app không còn bị trắng trang. Bạn có thể tải lại trang hoặc quay về trang tổng quan.
          </p>
          {this.state.message && (
            <pre className="mt-5 overflow-auto rounded-2xl bg-slate-950 p-4 text-left text-xs text-white">
              {this.state.message}
            </pre>
          )}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={this.handleReload}
              className="flex-1 rounded-2xl bg-slate-950 px-5 py-3 font-black text-white"
            >
              Tải lại trang
            </button>
            <button
              type="button"
              onClick={this.handleBackHome}
              className="flex-1 rounded-2xl border px-5 py-3 font-black text-slate-700"
            >
              Về trang tổng quan
            </button>
          </div>
        </section>
      </main>
    );
  }
}
