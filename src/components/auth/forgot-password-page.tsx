"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { FormField } from "@/components/auth/auth-fields";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { getSupabaseBrowser } from "@/lib/auth/supabase-browser";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const { error: resetError } =
        await getSupabaseBrowser().auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setMessage("If an account exists, a reset link has been sent.");
    } catch (error) {
      setError(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell title="501 Hub - Forgot Password">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <FormField
          error={error}
          id="reset-email"
          label="Email"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(value) => {
            setEmail(value);
            setError("");
            setMessage("");
          }}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-brand-main hover:bg-brand-main-light focus-visible:border-brand-alt focus-visible:ring-brand-alt/35 h-9 w-full rounded-full text-sm font-bold text-white"
        >
          {isSubmitting ? "Sending..." : "Send Reset Link"}
        </Button>

        {message ? (
          <p className="bg-brand-alt/10 text-brand-main rounded-lg px-3 py-2 text-center text-sm font-medium">
            {message}
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
