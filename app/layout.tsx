import type { Metadata } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans, Inter, DM_Serif_Display, Instrument_Serif } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { PendoInitializer } from "@/components/PendoInitializer";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-plus-jakarta-sans",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-accent",
});

export const metadata: Metadata = {
  title: "Pigeon — Launch emails in your voice",
  description:
    "Pigeon writes your entire launch email sequence — 9 emails, your voice, your cadence — and sends them to ConvertKit automatically.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link
            href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,700&display=swap"
            rel="stylesheet"
          />
          <Script id="pendo-install" strategy="beforeInteractive">{`
(function(apiKey){
    (function(p,e,n,d,o){var v,w,x,y,z;o=p[d]=p[d]||{};o._q=o._q||[];
    v=['initialize','identify','updateOptions','pageLoad','track','trackAgent'];for(w=0,x=v.length;w<x;++w)(function(m){
    o[m]=o[m]||function(){o._q[m===v[0]?'unshift':'push']([m].concat([].slice.call(arguments,0)));};})(v[w]);
    y=e.createElement(n);y.async=!0;y.src='https://cdn.pendo.io/agent/static/'+apiKey+'/pendo.js';
    z=e.getElementsByTagName(n)[0];z.parentNode.insertBefore(y,z);})(window,document,'script','pendo');
})('d4c060c4-baec-4f07-aa6b-279e6b8e8c81');
`}</Script>
        </head>
        <body
          className={`${plusJakartaSans.variable} ${inter.variable} ${dmSerifDisplay.variable} ${instrumentSerif.variable} font-sans antialiased`}
        >
          <PendoInitializer />
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
