import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import ChatWidget from "./components/ChatWidget";

export const metadata: Metadata = {
  title: "247ROI | Revenue That Runs 24/7",
  description:
    "Capture leads, book appointments, and grow revenue around the clock — even while you sleep. AI-powered systems built for businesses that want measurable ROI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <Providers>{children}</Providers>
        <ChatWidget />
      </body>
    </html>
  );
}
