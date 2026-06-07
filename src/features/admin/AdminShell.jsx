import AppShell from "../../shared/components/AppShell";
import { ADMIN_NAV } from "./adminNav";

export default function AdminShell({ title, subtitle, onLogout, children, actions }) {
  return (
    <AppShell
      role="admin"
      title={title}
      subtitle={subtitle}
      navItems={ADMIN_NAV}
      userName="Admin Quảng"
      userLabel="Admin Portal"
      onLogout={onLogout}
      actions={actions}
    >
      {children}
    </AppShell>
  );
}
