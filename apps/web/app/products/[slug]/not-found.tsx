import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";

export default function ProductNotFound() {
  return (
    <main>
      <Container className="py-20 text-center md:py-[140px]">
        <SectionTitle as="h1">Товар не найден</SectionTitle>
        <p className="mt-6 text-base md:text-xl">
          Возможно, ссылка устарела. Посмотрите наше меню.
        </p>
        <Button href="/catalog" className="mt-8 md:mt-10">
          Открыть меню
        </Button>
      </Container>
    </main>
  );
}
