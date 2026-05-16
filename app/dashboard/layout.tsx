import type { ReactNode } from "react";
import { DriverDashboardThemeProvider } from "@/components/DriverDashboardTheme";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DriverDashboardThemeProvider>{children}</DriverDashboardThemeProvider>;
}
