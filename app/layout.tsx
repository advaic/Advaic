import "../styles/globals.css";
import SupabaseProvider from "./supabase-provider";
import ClientRootLayout from "@/app/ClientRootLayout";
import { Inter, Manrope } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata = {
  title: "Advaic",
  description: "Dein AI-gestützter Maklerassistent",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className={`${inter.variable} ${manrope.variable}`}>
        <SupabaseProvider initialSession={null}>
          <ClientRootLayout session={null}>{children}</ClientRootLayout>
        </SupabaseProvider>
      </body>
    </html>
  );
}
