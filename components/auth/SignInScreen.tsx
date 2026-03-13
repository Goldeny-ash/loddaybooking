"use client";

import { SignIn, useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignInScreen() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.replace("/setup");
    }
  }, [isSignedIn, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFECD1] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-4xl font-semibold text-[#001524]">
          Welcome Back
        </h1>
        <p className="mb-6 text-center font-medium text-[#15616D]">
          Sign in to manage your booking link
        </p>
        <div className="flex w-full justify-center">
          <SignIn
            routing="path"
            path="/sign-in"
            forceRedirectUrl="/setup"
            signUpUrl="/sign-up"
            oauthFlow="redirect"
            appearance={{
              elements: {
                rootBox: "w-full",
                cardBox: "w-full shadow-none border-0 bg-transparent",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
