"use client";

import { SignUp } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    // Clerk handles redirect automatically if signed in
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFECD1] px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg flex flex-col gap-6">
        <h1 className="text-4xl font-semibold text-[#001524] text-center">
          Create Your Account
        </h1>

        <p className="text-center text-[#15616D] font-medium">
          Sign up to start accepting bookings
        </p>

        {/* SignUp component with routing */}
        <div className="w-full flex justify-center">
          <SignUp
            routing="path"
            path="/sign-up"
            forceRedirectUrl="/setup"
            signInUrl="/sign-in"
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
