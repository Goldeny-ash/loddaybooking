"use client";

import { SignIn, useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.replace("/setup");
    }
  }, [isSignedIn, router]);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFECD1] px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
        <h1 className="text-4xl font-semibold text-[#001524] mb-6 text-center">
          Welcome Back
        </h1>
        <p className="text-center text-[#15616D] mb-6 font-medium">
          Sign in to manage your booking link
        </p>
        <div className="w-full flex justify-center">
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
