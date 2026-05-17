import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/features/ui/components/toast-provider";

export const metadata: Metadata = {
  title: "DentyHub",
  description: "Dental clinic management platform for patients, doctors, and supervisors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
