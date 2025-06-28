"use client";

import React from "react";
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/nextjs";
import { ReactNode } from "react";

export default function AuthWrapper({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <SignedOut>
        <div>Please sign in to continue.</div>
      </SignedOut>
      <SignedIn>{children}</SignedIn>
    </ClerkProvider>
  );
}
