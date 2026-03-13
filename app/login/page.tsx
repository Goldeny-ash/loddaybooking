import type { Metadata } from "next";
import SignInScreen from "@/components/auth/SignInScreen";

export const metadata: Metadata = {
  title: "Login",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return <SignInScreen />;
}
