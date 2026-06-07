import AppShell from "../../shared/components/AppShell";
import { DRIVER_NAV } from "./driverNav";

export default function DriverShell({ title, subtitle, onLogout, children, actions }) {
  return (
    <AppShell
      role="driver"
      title={title}
      subtitle={subtitle}
      navItems={DRIVER_NAV}
      userName="Ngọc Quảng"
      userLabel="Driver Portal"
      onLogout={onLogout}
      actions={actions}
    >
      {children}
    </AppShell>
  );
}
