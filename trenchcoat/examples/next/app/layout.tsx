import "trenchcoat/tokens.css";
import type { ReactNode } from "react";

export const metadata = { title: "Trenchcoat · Next.js" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
