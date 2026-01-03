import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Dinheiro - Dashboard",
  description: "Financial intelligence and tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={cn("bg-bg text-text antialiased min-h-screen selection:bg-primary selection:text-white")}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
