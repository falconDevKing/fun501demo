"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";
import { FormEvent, useState } from "react";

import { FormField, PasswordField } from "@/components/auth/auth-fields";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { getSupabaseBrowser } from "@/lib/auth/supabase-browser";
import { cn } from "@/lib/utils";

type AuthMode = "signin" | "register";
type FieldName = "name" | "email" | "password" | "confirmPassword";
type FormValues = Record<FieldName, string>;
type FormErrors = Partial<Record<FieldName, string>>;

const emptyValues: FormValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === "register";

  function updateField(field: FieldName, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setMessage("");
    setSubmitError("");
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setErrors({});
    setMessage("");
    setSubmitError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  function validateForm() {
    const nextErrors: FormErrors = {};

    if (isRegister && !values.name.trim()) {
      nextErrors.name = "Name is required.";
    }

    if (!values.email.trim()) {
      nextErrors.email = "Email is required.";
    }

    if (!values.password) {
      nextErrors.password = "Password is required.";
    }

    if (isRegister) {
      if (!values.confirmPassword) {
        nextErrors.confirmPassword = "Confirm your password.";
      } else if (values.password !== values.confirmPassword) {
        nextErrors.confirmPassword = "Passwords do not match.";
      }
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
    setMessage("");

    try {
      const supabase = getSupabaseBrowser();

      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email: values.email.trim(),
          password: values.password,
          options: {
            data: {
              display_name: values.name.trim(),
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (error) {
          setSubmitError(error.message);
          return;
        }

        if (data.session) {
          router.push("/dashboard");
          return;
        }

        setMessage("Check your email to confirm your account.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: values.email.trim(),
        password: values.password,
      });

      if (error) {
        setSubmitError(error.message);
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <div className="mb-5 grid h-10 grid-cols-2 rounded-lg bg-slate-100 p-1">
        <TabButton
          isActive={mode === "signin"}
          label="Sign In"
          onClick={() => switchMode("signin")}
        />
        <TabButton
          isActive={mode === "register"}
          label="Register"
          onClick={() => switchMode("register")}
        />
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {isRegister ? (
          <FormField
            error={errors.name}
            id="name"
            label="Name"
            placeholder="Name"
            value={values.name}
            onChange={(value) => updateField("name", value)}
          />
        ) : null}

        <FormField
          error={errors.email}
          id="email"
          label="Email"
          placeholder="Email"
          type="email"
          value={values.email}
          onChange={(value) => updateField("email", value)}
        />

        <PasswordField
          error={errors.password}
          id="password"
          label="Password"
          rightAction={
            !isRegister ? (
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 underline-offset-2 hover:underline"
              >
                Forgot Password?
              </Link>
            ) : null
          }
          showPassword={showPassword}
          value={values.password}
          onChange={(value) => updateField("password", value)}
          onToggle={() => setShowPassword((current) => !current)}
        />

        {isRegister ? (
          <PasswordField
            error={errors.confirmPassword}
            id="confirm-password"
            label="Confirm Password"
            placeholder="Confirm password"
            showPassword={showConfirmPassword}
            value={values.confirmPassword}
            onChange={(value) => updateField("confirmPassword", value)}
            onToggle={() => setShowConfirmPassword((current) => !current)}
          />
        ) : null}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-brand-main hover:bg-brand-main-light focus-visible:border-brand-alt focus-visible:ring-brand-alt/35 mt-2 h-9 w-full rounded-full text-sm font-bold text-white"
        >
          {isSubmitting ? (
            "Please wait..."
          ) : (
            <>
              {isRegister ? "Create Account" : "Sign In"}
              {isRegister ? (
                <UserPlus className="size-4" />
              ) : (
                <LogIn className="size-4" />
              )}
            </>
          )}
        </Button>

        <AuthMessage error={submitError} message={message} />
      </form>
    </AuthShell>
  );
}

function TabButton({
  isActive,
  label,
  onClick,
}: {
  isActive: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
      className={cn(
        "focus-visible:ring-brand-alt/25 rounded-md text-sm font-semibold transition focus-visible:ring-3 focus-visible:outline-none",
        isActive
          ? "text-brand-main bg-white shadow-sm"
          : "hover:text-brand-main text-slate-500",
      )}
    >
      {label}
    </button>
  );
}

function AuthMessage({ error, message }: { error: string; message: string }) {
  if (!error && !message) {
    return null;
  }

  return (
    <p
      className={cn(
        "rounded-lg px-3 py-2 text-center text-sm font-medium",
        error ? "bg-red-50 text-red-700" : "bg-brand-alt/10 text-brand-main",
      )}
    >
      {error || message}
    </p>
  );
}
