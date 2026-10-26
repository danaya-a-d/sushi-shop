"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { Button } from "@/components/ui/Button";

type DataUnavailableProps = {
  /** Что не удалось загрузить: «меню», «товар» */
  subject?: string;
  /** Выровнять по центру блока (по умолчанию), либо по левому краю */
  className?: string;
};

/**
 * Состояние «API недоступен» для серверных данных. Кнопка заново запрашивает страницу
 * (router.refresh): ошибки в кэш не попадают, поэтому запрос уходит в API снова.
 */
export function DataUnavailable({ subject = "меню", className = "" }: DataUnavailableProps) {
  const router = useRouter();

  return (
    <div role="alert" className={`py-10 text-center ${className}`}>
      <p className="font-heading text-xl md:text-2xl">Не удалось загрузить {subject}</p>
      <p className="mt-3 text-base md:text-xl">
        Сервер временно недоступен. Попробуйте ещё раз чуть позже.
      </p>
      <Button
        type="button"
        size="s"
        className="mt-6"
        onClick={() => startTransition(() => router.refresh())}
      >
        Повторить
      </Button>
    </div>
  );
}
