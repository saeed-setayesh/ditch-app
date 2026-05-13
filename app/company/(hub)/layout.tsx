import CompanyHubShell from "@/components/company/CompanyHubShell";

export default function CompanyHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CompanyHubShell>{children}</CompanyHubShell>;
}
