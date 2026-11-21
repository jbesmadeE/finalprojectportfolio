import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "JB Esmade — Portfolio",
  description:
    "John Brian Esmade, E-commerce Virtual Asistant SEO analysis, AI Automation.",
  verification: {
    google: "7nUzGqxcpEObOYLsroBkoXmWrB-tFMvciJOcYQClfh0",
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          async
          src="https://www.googletagmanager.com/gtm.js?id=GTM-P7KFPN4J"
        />
        <script>{`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());`}</script>
      </head>
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
