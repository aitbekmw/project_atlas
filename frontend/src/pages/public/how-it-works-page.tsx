import { usePageTitle } from "@/hooks/use-page-title";
import { useI18n } from "@/i18n/locale-context";

export function HowItWorksPage() {
  const { t } = useI18n();
  usePageTitle(t("seo.how"));
  const customerSteps = [t("how.c1"), t("how.c2"), t("how.c3"), t("how.c4"), t("how.c5")];
  const workerSteps = [t("how.w1"), t("how.w2"), t("how.w3"), t("how.w4"), t("how.w5")];

  return (
    <div className="atlas-page">
      <h1 className="atlas-page-title">{t("how.title")}</h1>
      <p className="atlas-page-lead">{t("how.hint")}</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <HowColumn title={t("how.forCustomer")} steps={customerSteps} />
        <HowColumn title={t("how.forWorker")} steps={workerSteps} />
      </div>
    </div>
  );
}

function HowColumn({ title, steps }: { title: string; steps: string[] }) {
  return (
    <section className="rounded-2xl border bg-card p-4">
      <h2 className="text-sm font-semibold text-primary">{title}</h2>
      <ol className="mt-3 grid gap-2">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3 rounded-xl bg-background/60 px-3 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className="self-center text-sm font-medium leading-snug">{step}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
