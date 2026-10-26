"use client";

import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";

/** Граница ошибок страниц: недоступный API или другой сбой при загрузке данных. */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main>
      <Container className="py-20 text-center md:py-[140px]">
        <SectionTitle as="h1">Что-то пошло не так</SectionTitle>
        <p className="mt-6 text-base md:text-xl">
          Не удалось загрузить данные. Проверьте соединение и попробуйте ещё раз.
        </p>
        <Button type="button" onClick={reset} className="mt-8 md:mt-10">
          Повторить
        </Button>
      </Container>
    </main>
  );
}
