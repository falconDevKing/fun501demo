"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { getSupabaseBrowser } from "@/lib/auth/supabase-browser";

export function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    async function loadUser() {
      try {
        const code = new URLSearchParams(window.location.search).get("code");

        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
          window.history.replaceState({}, "", "/dashboard");
        }

        const { data } = await supabase.auth.getUser();

        if (!data.user) {
          router.replace("/");
          return;
        }

        setEmail(data.user.email ?? "");
      } catch (loadError) {
        setError(getAuthErrorMessage(loadError));
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [router]);

  async function handleSignOut() {
    try {
      await getSupabaseBrowser().auth.signOut();
      router.replace("/");
    } catch (signOutError) {
      setError(getAuthErrorMessage(signOutError));
    }
  }

  return (
    <AuthShell title="501 Hub Demo - Dashboard">
      <div className="flex flex-col gap-4 text-center">
        <p className="text-sm text-slate-600">
          {isLoading ? "Checking session..." : "You are signed in."}
        </p>

        {email ? <p className="text-brand-main font-medium">{email}</p> : null}

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}

        <Button
          type="button"
          onClick={handleSignOut}
          className="bg-brand-main hover:bg-brand-main-light focus-visible:border-brand-alt focus-visible:ring-brand-alt/35 h-9 w-full rounded-full text-sm font-bold text-white"
        >
          Sign Out
        </Button>
      </div>
    </AuthShell>
  );
}
