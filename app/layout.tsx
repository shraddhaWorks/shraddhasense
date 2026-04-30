import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-orange-200 bg-white">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-6 py-3 md:px-10">
            <Image src="/logo.svg" alt="Company logo" width={116} height={116} priority />
            <p className="text-sm font-semibold text-orange-900">
              Attendance and Salary Manager
            </p>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
