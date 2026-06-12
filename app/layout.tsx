import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eisa Siddiqui — Portfolio",
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
        {children}
      </body>
    </html>
  );
}
