"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({
  children,
  title = "501 Hub - Login",
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-5 py-8 text-slate-950">
      <section className="flex w-full max-w-80 flex-col items-center">
        <Link href="/" aria-label="Go to sign in">
          <Image
            src="/fun501Logo.png"
            alt="501 Hub logo"
            width={116}
            height={116}
            priority
            className="size-28 rounded-full object-contain"
          />
        </Link>

        <h1 className="mt-4 text-center text-lg font-semibold">{title}</h1>

        <div className="mt-5 w-full rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
          {children}
        </div>

        <p className="mt-5 text-sm text-slate-500">
          &copy; 501 Entertainment Demo 2026
        </p>
      </section>
    </main>
  );
}
