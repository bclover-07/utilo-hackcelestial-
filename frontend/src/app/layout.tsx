import type { Metadata, Viewport } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import "./workspace.css";
import "./neo.css";
import "./conductor.css";
import "./agents.css";
import { AuthProvider } from "@/context/AuthContext";
import MotionExperience from "@/components/MotionExperience";
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
  display: "swap",
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});
export const metadata: Metadata = {
  title: "Utlio | Less idle. More possible.",
  description:
    "A B2B hospitality exchange for resources, requests, structured negotiation and quantity-aware booking.",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fffaf0",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${dmSans.variable} ${spaceGrotesk.variable}`}
    >
      <body>
        <AuthProvider><MotionExperience>{children}</MotionExperience></AuthProvider>
      </body>
    </html>
  );
}
