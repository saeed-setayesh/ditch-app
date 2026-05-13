"use client";

import type { ReactNode } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

type SignOutButtonProps = {
  callbackUrl?: string;
  className?: string;
  /** If omitted, shows LogOut icon + “Sign out” (flex gap-2). */
  children?: ReactNode;
};

export function SignOutButton({
  callbackUrl = "/login",
  className = "",
  children,
}: SignOutButtonProps) {
  return (
    <button
      type="button"
      onClick={() => void signOut({ callbackUrl })}
      className={`inline-flex items-center justify-center gap-2 ${className}`}
      aria-label="Sign out"
    >
      {children ?? (
        <>
          <LogOut className="size-4 shrink-0" aria-hidden />
          <span>Sign out</span>
        </>
      )}
    </button>
  );
}
