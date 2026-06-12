import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Canada — Map & 3D View",
  description: "Interactive Leaflet map and 3D model of Canada",
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
