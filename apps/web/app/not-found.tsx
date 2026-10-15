import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";

// Собственная 404 вместо встроенной страницы Next.js (у неё свой <style> с чёрным фоном в тёмной теме).
// Header и Footer приходят из RootLayout.
export default function NotFound() {
  return (
    <main>
      <Container className="py-20 text-center md:py-[140px]">
        {/* На узком экране заголовок в одну строку: подсветка SectionTitle у двух строк превращается в сплошную полосу */}
        <SectionTitle as="h1" className="max-md:text-[26px]">
          Страница не найдена
        </SectionTitle>
        <p className="mt-6 text-base md:text-xl">
          Возможно, ссылка устарела или страница была перемещена. Посмотрите наше меню.
        </p>
        <Button href="/catalog" className="mt-8 md:mt-10">
          Вернуться в меню
        </Button>
      </Container>
    </main>
  );
}
