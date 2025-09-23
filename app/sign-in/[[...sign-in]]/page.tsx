"use client";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <SignIn routing="path" path="/sign-in" />
    </div>
  );
}
