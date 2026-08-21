import { Link } from "react-router-dom";

import { Logo } from "@/components/layout/navbar";

const customerLinks = [
  { to: "/register", label: "Разместить заказ" },
  { to: "/categories", label: "Категории" },
  { to: "/register", label: "Стать заказчиком" },
];

const workerLinks = [
  { to: "/jobs", label: "Найти заказы" },
  { to: "/#how-it-works", label: "Как это работает" },
  { to: "/register", label: "Стать исполнителем" },
];

const companyLinks = [
  { to: "/reviews", label: "Отзывы" },
  { to: "/login", label: "Войти" },
  { to: "/register", label: "Регистрация" },
];

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
            Atlas — маркетплейс заказов для заказчиков и исполнителей. Опишите
            задачу, сравните отклики и договоритесь в чате.
          </p>
        </div>
        <FooterColumn title="Заказчикам" links={customerLinks} />
        <FooterColumn title="Исполнителям" links={workerLinks} />
        <FooterColumn title="Компания" links={companyLinks} />
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Atlas</p>
          <p>Маркетплейс заказов. Backend — FastAPI.</p>
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
  links: { to: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <nav className="mt-4 grid gap-2 text-sm text-muted-foreground">
        {links.map((link) =>
          link.to.includes("#") ? (
            <a key={link.to} href={link.to} className="transition-colors duration-200 hover:text-foreground">
              {link.label}
            </a>
          ) : (
            <Link key={link.to} to={link.to} className="transition-colors duration-200 hover:text-foreground">
              {link.label}
            </Link>
          ),
        )}
      </nav>
    </div>
  );
}
