"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { PasswordField } from "@/components/auth/auth-fields";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { getSupabaseBrowser } from "@/lib/auth/supabase-browser";

type FieldName = "password" | "confirmPassword";
type FormValues = Record<FieldName, string>;
type FormErrors = Partial<Record<FieldName, string>>;

export function ResetPasswordPage() {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>({
    confirmPassword: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState("Checking reset link...");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    let isMounted = true;

    async function loadRecoverySession() {
      const code = new URLSearchParams(window.location.search).get("code");

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
        window.history.replaceState({}, "", "/reset-password");
      }

      const { data } = await supabase.auth.getSession();

      if (isMounted) {
        setStatus(
          data.session
            ? "Enter a new password."
            : "Open this page from your reset email link.",
        );
      }
    }

    loadRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setStatus("Enter a new password.");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  function updateField(field: FieldName, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError("");
  }

  function validateForm() {
    const nextErrors: FormErrors = {};

    if (!values.password) {
      nextErrors.password = "Password is required.";
    }

    if (!values.confirmPassword) {
      nextErrors.confirmPassword = "Confirm your password.";
    } else if (values.password !== values.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const { error } = await getSupabaseBrowser().auth.updateUser({
        password: values.password,
      });

      if (error) {
        setSubmitError(error.message);
        return;
      }

      router.push("/dashboard");
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell title="501 Hub Demo - Reset Password">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <p className="text-center text-sm text-slate-500">{status}</p>

        <PasswordField
          error={errors.password}
          id="new-password"
          label="New Password"
          placeholder="New password"
          showPassword={showPassword}
          value={values.password}
          onChange={(value) => updateField("password", value)}
          onToggle={() => setShowPassword((current) => !current)}
        />

        <PasswordField
          error={errors.confirmPassword}
          id="confirm-new-password"
          label="Confirm Password"
          placeholder="Confirm password"
          showPassword={showConfirmPassword}
          value={values.confirmPassword}
          onChange={(value) => updateField("confirmPassword", value)}
          onToggle={() => setShowConfirmPassword((current) => !current)}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-brand-main hover:bg-brand-main-light focus-visible:border-brand-alt focus-visible:ring-brand-alt/35 h-9 w-full rounded-full text-sm font-bold text-white"
        >
          {isSubmitting ? "Updating..." : "Update Password"}
        </Button>

        {submitError ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-700">
            {submitError}
          </p>
        ) : null}

        <Link
          href="/"
          className="text-brand-main text-center text-sm font-medium underline-offset-2 hover:underline"
        >
          Back to sign in
        </Link>
      </form>
    </AuthShell>
  );
}
