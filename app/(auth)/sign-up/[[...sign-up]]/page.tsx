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
        <h1
          className="text-4xl font-semibold text-[#001524] text-center"
          style={{ fontFamily: "Grand Hotel, cursive" }}
        >
          Create Your Account
        </h1>

        <p className="text-center text-[#15616D] font-medium">
          Sign up to start accepting bookings
        </p>

        {/* SignUp component with routing */}
        <SignUp
          routing="path"
          path="/sign-up"
          forceRedirectUrl="/setup"
        />

        <label className="flex items-start gap-2 text-sm mt-2">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            required
            className="mt-1"
          />
          <span>
            I agree to the{" "}
            <Link href="/privacy" className="text-[#15616D] underline">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/terms" className="text-[#15616D] underline">
              Terms of Service
            </Link>
            .
          </span>
        </label>

        <button
          type="submit"
          disabled={!accepted}
          className={`mt-4 px-4 py-3 rounded-full text-white font-medium transition-transform ${
            accepted
              ? "bg-[#15616D] hover:scale-105"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}
