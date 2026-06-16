import type { Metadata } from "next";
import "./globals.css";
import NavMenu from "./components/NavMenu";
import IntroExperience from "./components/IntroExperience";

export const metadata: Metadata = {
  title: "Eisa's Portfolio",
  description: "Personal portfolio of Eisa Siddiqui",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <IntroExperience />
        <NavMenu />
        {children}
      </body>
    </html>
  );
}
