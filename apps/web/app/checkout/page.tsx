import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { RecommendedProducts } from "@/components/checkout/RecommendedProducts";
import { Container } from "@/components/layout/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";

export const metadata: Metadata = {
  title: "Оформление заказа — I love Sushi",
  description: "Оформление заказа в I love Sushi.",
  // Страница зависит от содержимого корзины пользователя, индексировать её незачем
  robots: { index: false },
};

// Серверная оболочка: заголовок и рекомендации рендерятся на сервере, а форма и корзина
// живут в клиентском CheckoutForm. Рекомендации передаются в него готовыми (как children).
export default function CheckoutPage() {
  return (
    <main className="lg:pb-[160px]">
      <Container className="mt-10 md:mt-[100px]">
        <SectionTitle as="h1" className="max-md:text-[28px]">Оформление заказа</SectionTitle>

        <div className="mt-[60px] md:mt-[76px] lg:mt-[100px]">
          <CheckoutForm recommended={<RecommendedProducts />} />
        </div>
      </Container>
    </main>
  );
}
