import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { AuthDivider, GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Logo } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/context/auth-context";
import { useI18n } from "@/i18n/locale-context";
import { formatKgPhone, isKgPhone, isPersonName, isStrongPassword } from "@/lib/auth-form";
import { cn, getErrorMessage, getHttpStatus } from "@/lib/utils";

type Values = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  role: "customer" | "worker";
};

export function RegisterPage() {
  const { t } = useI18n();
  const { register: registerAccount } = useAuth();
  const navigate = useNavigate();
  const [emailTaken, setEmailTaken] = useState(false);

  const schema = useMemo(
    () =>
      z
        .object({
          first_name: z
            .string()
            .trim()
            .min(2, t("register.nameInvalid"))
            .refine(isPersonName, t("register.nameInvalid")),
          last_name: z
            .string()
            .trim()
            .min(2, t("register.nameInvalid"))
            .refine(isPersonName, t("register.nameInvalid")),
          email: z.string().trim().email(t("auth.emailInvalid")),
          phone: z.string().refine(isKgPhone, t("register.phoneInvalid")),
          password: z.string(),
          confirm_password: z.string(),
          role: z.enum(["customer", "worker"]),
        })
        .superRefine((values, ctx) => {
          if (!isStrongPassword(values.password, values.email)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["password"],
              message: t("register.passwordWeak"),
            });
          }
          if (values.password !== values.confirm_password) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["confirm_password"],
              message: t("auth.passwordMismatch"),
            });
          }
        }),
    [t],
  );

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "+996 ",
      password: "",
      confirm_password: "",
      role: "customer",
    },
  });

  return (
    <div className="mx-auto w-full max-w-lg overflow-x-hidden px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:py-12">
      <Card className="w-full min-w-0">
        <CardHeader className="items-center text-center">
          <Logo />
          <CardTitle className="mt-4">{t("register.title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("register.subtitle")}</p>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={form.handleSubmit(async (values) => {
              setEmailTaken(false);
              try {
                await registerAccount({
                  first_name: values.first_name,
                  last_name: values.last_name,
                  email: values.email,
                  phone: values.phone,
                  password: values.password,
                  role: values.role,
                });
                toast.success(t("auth.created"));
                navigate(`/verify-email?email=${encodeURIComponent(values.email.trim().toLowerCase())}`);
              } catch (error) {
                const message = getErrorMessage(error);
                if (
                  getHttpStatus(error) === 400 &&
                  (message === t("error.emailExists") || message === t("auth.emailAlreadyExists"))
                ) {
                  setEmailTaken(true);
                }
                form.setError("root", { message });
                toast.error(message);
              }
            })}
          >
            {form.formState.errors.root ? (
              <div className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <p>{form.formState.errors.root.message}</p>
                {emailTaken ? (
                  <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row">
                    <Button asChild variant="outline" className="min-h-11 flex-1">
                      <Link to="/login">{t("auth.signIn")}</Link>
                    </Button>
                    <Button asChild variant="outline" className="min-h-11 flex-1">
                      <Link to="/forgot-password">{t("auth.restorePassword")}</Link>
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid min-w-0 gap-2">
                <Label htmlFor="first_name">{t("register.firstName")} *</Label>
                <Input
                  id="first_name"
                  autoComplete="given-name"
                  placeholder={t("register.placeholderFirstName")}
                  {...form.register("first_name")}
                />
                {form.formState.errors.first_name ? (
                  <p className="text-xs text-destructive">{form.formState.errors.first_name.message}</p>
                ) : null}
              </div>
              <div className="grid min-w-0 gap-2">
                <Label htmlFor="last_name">{t("register.lastName")} *</Label>
                <Input
                  id="last_name"
                  autoComplete="family-name"
                  placeholder={t("register.placeholderLastName")}
                  {...form.register("last_name")}
                />
                {form.formState.errors.last_name ? (
                  <p className="text-xs text-destructive">{form.formState.errors.last_name.message}</p>
                ) : null}
              </div>
            </div>

            <div className="grid min-w-0 gap-2">
              <Label htmlFor="email">{t("register.email")} *</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={t("register.placeholderEmail")}
                {...form.register("email")}
              />
              {form.formState.errors.email ? (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              ) : null}
            </div>

            <div className="grid min-w-0 gap-2">
              <Label htmlFor="phone">{t("register.phone")} *</Label>
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

            <div className="grid min-w-0 gap-2">
              <Label htmlFor="password">{t("register.password")} *</Label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                placeholder={t("register.placeholderPassword")}
                showLabel={t("register.showPassword")}
                hideLabel={t("register.hidePassword")}
                {...form.register("password")}
              />
              <p className="text-xs leading-5 text-muted-foreground">{t("register.passwordRequirements")}</p>
              {form.formState.errors.password ? (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              ) : null}
            </div>

            <div className="grid min-w-0 gap-2">
              <Label htmlFor="confirm_password">{t("register.confirmPassword")} *</Label>
              <PasswordInput
                id="confirm_password"
                autoComplete="new-password"
                placeholder={t("register.placeholderConfirmPassword")}
                showLabel={t("register.showPassword")}
                hideLabel={t("register.hidePassword")}
                {...form.register("confirm_password")}
              />
              {form.formState.errors.confirm_password ? (
                <p className="text-xs text-destructive">{form.formState.errors.confirm_password.message}</p>
              ) : null}
            </div>

            <fieldset className="grid min-w-0 gap-2">
              <legend className="text-sm font-medium">{t("register.role")} *</legend>
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
                      <input
                        type="radio"
                        className="mt-1"
                        value={role}
                        {...form.register("role")}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">
                          {role === "customer" ? t("register.customer") : t("register.worker")}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                          {role === "customer"
                            ? t("register.customerDescription")
                            : t("register.workerDescription")}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <p className="text-xs leading-5 text-muted-foreground">{t("register.nextStep")}</p>
            {import.meta.env.DEV ? (
              <p className="text-xs leading-5 text-muted-foreground">{t("register.devHint")}</p>
            ) : null}

            <p className="text-xs leading-5 text-muted-foreground">
              {t("register.terms")}{" "}
              <Link to="/terms" className="font-semibold text-primary underline-offset-4 hover:underline">
                {t("legal.termsLink")}
              </Link>{" "}
              {t("register.termsAnd")}{" "}
              <Link to="/privacy" className="font-semibold text-primary underline-offset-4 hover:underline">
                {t("legal.privacyLink")}
              </Link>
              .
            </p>

            <Button type="submit" className="h-12 w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? t("auth.creating") : t("register.submit")}
            </Button>
          </form>
          <div className="mt-4 grid gap-3">
            <AuthDivider />
            <GoogleAuthButton />
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("auth.hasAccount")}{" "}
            <Link to="/login" className="font-semibold text-primary">
              {t("nav.login")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
