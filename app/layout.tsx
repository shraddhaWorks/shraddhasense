import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Attendance and Salary Manager",
  description: "Role based admin and employee attendance app",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#09090b",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full bg-zinc-950 text-zinc-100 antialiased`}
      style={{ colorScheme: "dark" }}
    >
      <body className="flex min-h-dvh min-w-0 flex-col overflow-x-hidden bg-transparent pb-[env(safe-area-inset-bottom)]">
        <SiteHeader isAdmin={isAdmin} />
        {children}
      </body>
    </html>
  );
}
