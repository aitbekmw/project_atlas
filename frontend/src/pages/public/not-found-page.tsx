import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[70svh] flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight">Страница не найдена</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Такого маршрута в Atlas нет. Вернитесь к заказам или в кабинет.
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link to="/">На главную</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/jobs">Найти заказы</Link>
        </Button>
      </div>
    </div>
  );
}
