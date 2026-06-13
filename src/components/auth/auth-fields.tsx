"use client";

import { Eye, EyeOff } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const fieldClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-base text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-brand-alt focus:bg-white focus:ring-3 focus:ring-brand-alt/20";

export function FormField({
  error,
  id,
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  error?: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  value: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        className={cn(fieldClass, error && "border-red-500")}
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? (
        <p className="text-xs font-medium text-red-600">{error}</p>
      ) : null}
    </div>
  );
}

export function PasswordField({
  error,
  id,
  label,
  onChange,
  onToggle,
  placeholder = "Password",
  rightAction,
  showPassword,
  value,
}: {
  error?: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  onToggle: () => void;
  placeholder?: string;
  rightAction?: ReactNode;
  showPassword: boolean;
  value: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="block text-sm font-medium">
          {label}
        </label>
        {rightAction}
      </div>
      <div className="flex gap-3">
        <input
          id={id}
          className={cn(fieldClass, error && "border-red-500")}
          placeholder={placeholder}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          aria-label={showPassword ? "Hide password" : "Show password"}
          onClick={onToggle}
          className="hover:border-brand-alt hover:text-brand-main focus-visible:ring-brand-alt/20 flex size-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-slate-50 text-slate-900 transition focus-visible:ring-3 focus-visible:outline-none"
        >
          {showPassword ? (
            <EyeOff className="size-4" />
          ) : (
            <Eye className="size-4" />
          )}
        </button>
      </div>
      {error ? (
        <p className="text-xs font-medium text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
