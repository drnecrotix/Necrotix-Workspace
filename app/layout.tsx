import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Necrotix Workspace",
  description: "Project delivery and client collaboration for NecrotixLab Services.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
