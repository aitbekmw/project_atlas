import { Link } from "react-router-dom";

import { Logo } from "@/components/layout/navbar";
import { useI18n } from "@/i18n/locale-context";
import type { MessageKey } from "@/i18n/messages";

export function Footer() {
  const { t } = useI18n();
  const customerLinks: { to: string; labelKey: MessageKey }[] = [
    { to: "/register", labelKey: "nav.placeOrder" },
    { to: "/categories", labelKey: "nav.categories" },
    { to: "/register", labelKey: "footer.becomeCustomer" },
  ];
  const workerLinks: { to: string; labelKey: MessageKey }[] = [
    { to: "/jobs", labelKey: "nav.jobs" },
    { to: "/how-it-works", labelKey: "nav.how" },
    { to: "/register", labelKey: "footer.becomeWorker" },
  ];
  const companyLinks: { to: string; labelKey: MessageKey }[] = [
    { to: "/reviews", labelKey: "nav.reviews" },
    { to: "/terms", labelKey: "legal.termsTitle" },
    { to: "/privacy", labelKey: "legal.privacyTitle" },
  ];

  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid max-w-[90rem] gap-5 px-4 py-4 sm:grid-cols-2 sm:py-5 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-6">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">{t("footer.tagline")}</p>
        </div>
        <FooterColumn title={t("footer.customers")} links={customerLinks} />
        <FooterColumn title={t("footer.workers")} links={workerLinks} />
        <FooterColumn title={t("footer.company")} links={companyLinks} />
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-[90rem] flex-col gap-2 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Atlas</p>
          <p>{t("footer.backend")}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { to: string; labelKey: MessageKey }[];
}) {
  const { t } = useI18n();
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <nav className="mt-4 grid gap-2 text-sm text-muted-foreground">
        {links.map((link) =>
          link.to.includes("#") ? (
            <a key={`${link.to}-${link.labelKey}`} href={link.to} className="transition-colors duration-200 hover:text-foreground">
              {t(link.labelKey)}
            </a>
          ) : (
            <Link key={`${link.to}-${link.labelKey}`} to={link.to} className="transition-colors duration-200 hover:text-foreground">
              {t(link.labelKey)}
            </Link>
          ),
        )}
      </nav>
    </div>
  );
}
