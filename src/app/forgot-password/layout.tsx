import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Request a password reset link for your 501 Hub account.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
