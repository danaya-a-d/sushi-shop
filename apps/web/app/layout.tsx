import type { Metadata } from "next";
import { Gabriela, Montserrat } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import "./globals.css";

const gabriela = Gabriela({
  variable: "--font-gabriela",
  subsets: ["cyrillic", "latin"],
  weight: "400",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["cyrillic", "latin"],
});

export const metadata: Metadata = {
  title: "I love Sushi — доставка суши и роллов",
  description:
    "Широкий выбор суши и роллов с доставкой по городу. Закажите онлайн в I love Sushi.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${gabriela.variable} ${montserrat.variable} antialiased`}
    >
      <body className="flex min-h-screen flex-col">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
