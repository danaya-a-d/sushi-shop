"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/Button";
import { type FetchProductsPage, fetchProductsPage } from "@/lib/api/browser";
import { appendUnique } from "@/lib/catalog-utils";
import type { CategorySlug } from "@/types/category";
import type { Product } from "@/types/product";

type CatalogProductsProps = {
  category: CategorySlug;
  /** Первая страница: загружена на сервере и попадает в HTML (SEO) */
  initialProducts: readonly Product[];
  /** Курсор второй страницы или null, если товаров больше нет */
  initialCursor: string | null;
  /** Загрузка следующих страниц; в тестах подменяется */
  fetchPage?: FetchProductsPage;
  className?: string;
};

type LoadStatus = "idle" | "loading" | "error";

/**
 * Сетка каталога с кнопкой «Показать ещё». Клиентским сделан только этот блок: первая страница
 * приходит с сервера готовой (и рендерится в HTML), следующие браузер запрашивает у NestJS.
 *
 * Смена категории — это переход на другой URL: страница вызывает этот компонент с `key={category}`,
 * поэтому список и курсор сбрасываются, а запрос предыдущей категории отменяется при размонтировании.
 */
export function CatalogProducts({
  category,
  initialProducts,
  initialCursor,
  fetchPage = fetchProductsPage,
  className,
}: CatalogProductsProps) {
  const [products, setProducts] = useState<readonly Product[]>(initialProducts);
  const [cursor, setCursor] = useState(initialCursor);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [announcement, setAnnouncement] = useState("");

  // Запрос идёт не больше одного: повторное нажатие (двойной клик, Enter) игнорируется
  const loadingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const interruptedRef = useRef(false);

  // Cache Components прячет ушедшую страницу через <Activity>: компонент не размонтируется, его состояние
  // живёт, но эффекты очищаются при скрытии и запускаются снова при показе. Скрытие отменяет запрос в
  // полёте; при показе (и при обычном монтировании, где флага нет) снимаем зависшее «Загрузка…»,
  // чтобы кнопка не осталась заблокированной. Настоящее размонтирование состояние не трогает.
  useEffect(() => {
    if (interruptedRef.current) {
      interruptedRef.current = false;
      setStatus("idle");
    }
    return () => {
      if (!loadingRef.current) return;
      abortRef.current?.abort();
      abortRef.current = null;
      loadingRef.current = false;
      interruptedRef.current = true;
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || cursor === null) return;
    loadingRef.current = true;
    setStatus("loading");

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const page = await fetchPage({ category, cursor, signal: controller.signal });
      // Скрытие или размонтирование (смена категории, уход со страницы) отменяет запрос: ответ игнорируется
      if (controller.signal.aborted) return;

      const next = appendUnique(products, page.items);
      setAnnouncement(
        page.nextCursor === null
          ? "Показаны все товары"
          : `Загружено ещё товаров: ${next.length - products.length}`,
      );
      setProducts(next);
      setCursor(page.nextCursor);
      setStatus("idle");
    } catch {
      if (controller.signal.aborted) return;
      // Уже показанные карточки и курсор остаются, повторная попытка берёт ту же страницу
      setStatus("error");
    } finally {
      // Отменённый запрос уже освободил флаг; новый запрос мог начаться после показа страницы
      if (abortRef.current === controller) {
        abortRef.current = null;
        loadingRef.current = false;
      }
    }
  }, [category, cursor, fetchPage, products]);

  const isLoading = status === "loading";

  return (
    <>
      <ProductGrid products={products} className={className} />

      {cursor !== null && (
        <div className="mt-10 flex flex-col items-center gap-4 md:mt-[60px]">
          {status === "error" && (
            <p role="alert" className="text-center text-base md:text-xl">
              Не удалось загрузить товары. Показанные карточки сохранены.
            </p>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={loadMore}
            disabled={isLoading}
            aria-busy={isLoading}
            className="disabled:opacity-60 disabled:hover:bg-accent"
          >
            {isLoading ? "Загрузка…" : status === "error" ? "Повторить" : "Показать ещё"}
          </Button>
        </div>
      )}

      {/* Озвучивает результат для скринридеров; визуально скрыт */}
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </>
  );
}
