import { type ReactNode } from "react";
import MarketingNavbar from "./Navbar";
import MarketingFooter from "./Footer";

type PageShellProps = {
  children: ReactNode;
  withFooter?: boolean;
};

export default function PageShell({ children, withFooter = true }: PageShellProps) {
  return (
    <main className="marketing-page-bg bg-[var(--bg)] text-[var(--text)]">
      <MarketingNavbar />
      {children}
      {withFooter ? <MarketingFooter /> : null}
    </main>
  );
}
