import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "View match history, selected session details, player score controls, and session video in 501 Hub.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
