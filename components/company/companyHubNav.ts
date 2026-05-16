import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Map as MapIcon,
  Truck,
  ClipboardList,
  Users,
  CreditCard,
  BarChart3,
  SlidersHorizontal,
  ClipboardCheck,
  FileJson,
} from "lucide-react";

export type CompanyHubNavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
};

/** Active nav uses exact pathname match only for these (no /child matching). */
export const COMPANY_HUB_EXACT_PATHS = new Set([
  "/company/dashboard",
  "/company/dispatch",
]);

export const COMPANY_HUB_NAV: CompanyHubNavItem[] = [
  { href: "/company/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/company/dispatch", label: "Dispatch", Icon: MapIcon },
  { href: "/company/fleet", label: "Fleet", Icon: Truck },
  { href: "/company/inspections", label: "Inspections", Icon: ClipboardCheck },
  {
    href: "/company/inspection-templates",
    label: "Templates",
    Icon: FileJson,
  },
  { href: "/company/jobs", label: "Jobs", Icon: ClipboardList },
  { href: "/company/drivers", label: "Drivers", Icon: Users },
  { href: "/company/billing", label: "Billing", Icon: CreditCard },
  { href: "/company/reports", label: "Reports", Icon: BarChart3 },
  { href: "/company/settings", label: "Settings", Icon: SlidersHorizontal },
];
