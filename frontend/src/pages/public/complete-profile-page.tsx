import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { completeGoogleProfile } from "@/api/auth";
import { Logo } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { useI18n } from "@/i18n/locale-context";
import { formatKgPhone, isKgPhone } from "@/lib/auth-form";
import { cn, getErrorMessage } from "@/lib/utils";

type Values = {
  phone: string;
  role: "customer" | "worker";
};

export function CompleteProfilePage() {
  const { t } = useI18n();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const code = (params.get("code") ?? "").trim();

  const schema = useMemo(
    () =>
      z.object({
        phone: z.string().refine(isKgPhone, t("register.phoneInvalid")),
        role: z.enum(["customer", "worker"]),
      }),
    [t],
  );

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "+996 ", role: "customer" },
  });

  if (!code) {
    return (
      <div className="mx-auto w-full max-w-md overflow-x-hidden px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:py-12">
        <Card className="min-w-0">
          <CardHeader className="items-center text-center">
            <Logo />
            <CardTitle className="mt-4">{t("completeProfile.title")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("completeProfile.missingCode")}</p>
          </CardHeader>
          <CardContent>
            <Button asChild className="h-12 w-full">
              <Link to="/login">{t("nav.login")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md overflow-x-hidden px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:py-12">
      <Card className="min-w-0">
        <CardHeader className="items-center text-center">
          <Logo />
          <CardTitle className="mt-4">{t("completeProfile.title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("completeProfile.subtitle")}</p>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={form.handleSubmit(async (values) => {
              try {
                await completeGoogleProfile({
                  code,
                  phone: values.phone,
                  role: values.role,
                });
                await refreshUser();
                toast.success(t("auth.welcome"));
                navigate("/app/dashboard", { replace: true });
              } catch (error) {
                const message = getErrorMessage(error);
                form.setError("root", { message });
                toast.error(message);
              }
            })}
          >
            {form.formState.errors.root ? (
              <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            ) : null}
            <div className="grid min-w-0 gap-2">
              <Label htmlFor="phone">{t("completeProfile.phone")} *</Label>
              <Controller
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder={t("register.placeholderPhone")}
                    value={field.value}
                    onChange={(event) => field.onChange(formatKgPhone(event.target.value))}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                )}
              />
              {form.formState.errors.phone ? (
                <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
              ) : null}
            </div>
            <fieldset className="grid min-w-0 gap-2">
              <legend className="text-sm font-medium">{t("completeProfile.role")} *</legend>
              <div className="grid gap-2">
                {(["customer", "worker"] as const).map((role) => {
                  const selected = form.watch("role") === role;
                  return (
                    <label
                      key={role}
                      className={cn(
                        "flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border px-3 py-3",
                        selected ? "border-primary bg-primary/5" : "border-input",
                      )}
                    >
                      <input type="radio" className="mt-1" value={role} {...form.register("role")} />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">
                          {role === "customer" ? t("completeProfile.customer") : t("completeProfile.worker")}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                          {role === "customer"
                            ? t("completeProfile.customerDescription")
                            : t("completeProfile.workerDescription")}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <Button type="submit" className="h-12 w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? t("completeProfile.submitting") : t("completeProfile.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
