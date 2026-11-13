import type { Metadata, Viewport } from "next";
import { Rubik, Unbounded } from "next/font/google";
import "./globals.css";

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700", "800"],
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Roomie — знайди свого сусіда",
  description: "Знайди свого. Поділись своїм. Пошук сусіда по кімнаті серед студентів Львова.",
};

export const viewport: Viewport = {
  themeColor: "#3CCB98",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uk" className={`${unbounded.variable} ${rubik.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
