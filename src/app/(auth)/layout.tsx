import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "../globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

export const metadata: Metadata = {
  title: "Problem2Profit: The Online Shark Tank",
  description: "Where your crazy idea might actually work. Submit problems, pitch solutions, and get funded.",
  icons: {
    icon: [{ url: '/logo.png', type: 'image/png', sizes: 'any' }],
    apple: [{ url: '/logo.png', type: 'image/png' }],
  },
   verification: {
    other: {
      "google-adsense-account": "ca-pub-1119691945074832",
    },
  },
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
         {siteKey && (
           <Script
            id="recaptcha-script"
            src={`https://www.google.com/recaptcha/enterprise.js?render=${siteKey}`}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
