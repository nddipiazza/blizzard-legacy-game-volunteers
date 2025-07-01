import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextAuthProvider } from "@/components/NextAuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Blizzard Legacy Game Volunteer Platform",
  description: "Join our community of C++ game developers volunteering to help maintain Blizzard's legacy games like StarCraft 2.",
};

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);
  
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextAuthProvider session={session}>
          <div className="flex flex-col min-h-screen">
            <Navigation />
            <main className="flex-grow pt-16">
              {children}
            </main>
            <Footer />
          </div>
        </NextAuthProvider>
      </body>
    </html>
  );
}
