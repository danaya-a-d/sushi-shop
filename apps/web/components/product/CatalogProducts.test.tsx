// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Activity } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CartProvider } from "@/components/cart/CartProvider";
import { CatalogProducts } from "@/components/product/CatalogProducts";
import { ApiError } from "@/lib/api/http";
import type { FetchProductsPage } from "@/lib/api/browser";
import { createFakeCatalog, deferred, makeProduct } from "@/test-utils/fixtures";
import type { Product, ProductsPage } from "@/types/product";

const products = (from: number, to: number): Product[] =>
  Array.from({ length: to - from + 1 }, (_, i) => makeProduct(String(from + i), { name: `Товар ${from + i}` }));

const pageOf = (items: Product[], nextCursor: string | null): ProductsPage => ({ items, nextCursor });

afterEach(cleanup);

function setup(props: {
  initial?: Product[];
  cursor?: string | null;
  fetchPage?: FetchProductsPage;
  category?: string;
}) {
  const fetchPage = props.fetchPage ?? vi.fn<FetchProductsPage>();
  const catalog = createFakeCatalog();
  const view = (category: string, initial: Product[], cursor: string | null) => (
    <CartProvider fetchProducts={catalog.fetchProducts}>
      <CatalogProducts
        key={category}
        category={category}
        initialProducts={initial}
        initialCursor={cursor}
        fetchPage={fetchPage}
      />
    </CartProvider>
  );
  const utils = render(
    view(props.category ?? "all", props.initial ?? products(1, 12), props.cursor === undefined ? "c1" : props.cursor),
  );
  return { fetchPage: fetchPage as ReturnType<typeof vi.fn<FetchProductsPage>>, view, ...utils };
}

const showMore = () => screen.queryByRole("button", { name: "Показать ещё" });
const cards = () => screen.getAllByRole("listitem");

describe("CatalogProducts: «Показать ещё»", () => {
  it("первая страница показана сразу, кнопка есть, пока есть nextCursor", () => {
    setup({});
    expect(cards()).toHaveLength(12);
    expect(showMore()).toBeInTheDocument();
  });

  it("если товары закончились (nextCursor = null), кнопки нет", () => {
    setup({ initial: products(1, 5), cursor: null });
    expect(cards()).toHaveLength(5);
    expect(showMore()).not.toBeInTheDocument();
  });

  it("нажатие запрашивает следующую страницу с категорией и курсором и добавляет карточки", async () => {
    const fetchPage = vi.fn<FetchProductsPage>(async () => pageOf(products(13, 24), "c2"));
    setup({ fetchPage, category: "rolls" });

    await userEvent.click(showMore()!);

    await waitFor(() => expect(cards()).toHaveLength(24));
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(fetchPage.mock.calls[0][0]).toMatchObject({ category: "rolls", cursor: "c1" });
    // старые карточки не пропали и стоят первыми
    expect(screen.getByText("Товар 1")).toBeInTheDocument();
    expect(screen.getByText("Товар 24")).toBeInTheDocument();
    expect(showMore()).toBeInTheDocument();
  });

  it("следующий запрос использует новый курсор", async () => {
    const fetchPage = vi
      .fn<FetchProductsPage>()
      .mockResolvedValueOnce(pageOf(products(13, 24), "c2"))
      .mockResolvedValueOnce(pageOf(products(25, 30), null));
    setup({ fetchPage });

    await userEvent.click(showMore()!);
    await waitFor(() => expect(cards()).toHaveLength(24));
    await userEvent.click(showMore()!);

    await waitFor(() => expect(cards()).toHaveLength(30));
    expect(fetchPage.mock.calls[1][0]).toMatchObject({ cursor: "c2" });
    // список закончился: кнопка исчезла
    expect(showMore()).not.toBeInTheDocument();
  });

  it("дубликаты по id не добавляются", async () => {
    const fetchPage = vi.fn<FetchProductsPage>(async () => pageOf(products(10, 15), null));
    setup({ fetchPage, initial: products(1, 12) });

    await userEvent.click(showMore()!);

    await waitFor(() => expect(cards()).toHaveLength(15));
    expect(screen.getAllByText("Товар 11")).toHaveLength(1);
  });

  it("во время загрузки кнопка заблокирована, повторные нажатия не создают запросов", async () => {
    const pending = deferred<ProductsPage>();
    const fetchPage = vi.fn<FetchProductsPage>(() => pending.promise);
    setup({ fetchPage });

    await userEvent.click(showMore()!);
    const busy = screen.getByRole("button", { name: "Загрузка…" });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute("aria-busy", "true");
    await userEvent.click(busy);
    await userEvent.click(busy);

    expect(fetchPage).toHaveBeenCalledTimes(1);

    await act(async () => pending.resolve(pageOf(products(13, 14), null)));
    expect(cards()).toHaveLength(14);
  });

  it("ошибка: карточки сохранены, показано сообщение и «Повторить»; повтор берёт тот же курсор", async () => {
    const fetchPage = vi
      .fn<FetchProductsPage>()
      .mockRejectedValueOnce(new ApiError("API недоступен", "network"))
      .mockResolvedValueOnce(pageOf(products(13, 20), null));
    setup({ fetchPage });

    await userEvent.click(showMore()!);

    expect(await screen.findByRole("alert")).toHaveTextContent("Не удалось загрузить товары");
    expect(cards()).toHaveLength(12);

    await userEvent.click(screen.getByRole("button", { name: "Повторить" }));

    await waitFor(() => expect(cards()).toHaveLength(20));
    expect(fetchPage.mock.calls[1][0]).toMatchObject({ cursor: "c1" });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(showMore()).not.toBeInTheDocument();
  });

  it("смена категории сбрасывает список и курсор, ответ прежней категории игнорируется", async () => {
    const pending = deferred<ProductsPage>();
    const fetchPage = vi.fn<FetchProductsPage>(() => pending.promise);
    const { view, rerender } = setup({ fetchPage, category: "rolls" });

    await userEvent.click(showMore()!);
    expect(fetchPage).toHaveBeenCalledTimes(1);
    const { signal } = fetchPage.mock.calls[0][0];
    expect(signal?.aborted).toBe(false);

    // пользователь переключил категорию: страница рендерит компонент с другим key
    rerender(view("sashimi", products(101, 103), null));

    expect(signal?.aborted).toBe(true);
    expect(cards()).toHaveLength(3);
    expect(showMore()).not.toBeInTheDocument();

    // запоздавший ответ старой категории не должен попасть в новый список
    await act(async () => pending.resolve(pageOf(products(13, 24), "zzz")));
    expect(cards()).toHaveLength(3);
    expect(screen.queryByText("Товар 13")).not.toBeInTheDocument();
    expect(screen.getByText("Товар 101")).toBeInTheDocument();
  });

  it("после смены категории кнопка запрашивает уже новую категорию с её курсором", async () => {
    const fetchPage = vi.fn<FetchProductsPage>(async () => pageOf([], null));
    const { view, rerender } = setup({ fetchPage, category: "rolls" });

    rerender(view("soups", products(50, 61), "soups-c1"));
    await userEvent.click(showMore()!);

    expect(fetchPage.mock.calls[0][0]).toMatchObject({ category: "soups", cursor: "soups-c1" });
  });

  it("запрос, отменённый уходом со страницы, не оставляет ошибку и не обновляет состояние", async () => {
    const pending = deferred<ProductsPage>();
    const fetchPage = vi.fn<FetchProductsPage>(() => pending.promise);
    const { unmount } = setup({ fetchPage });
    await userEvent.click(showMore()!);

    unmount();
    await act(async () => pending.reject(new ApiError("aborted", "network")));

    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  describe("скрытие через Activity (Cache Components)", () => {
    const withMode = (mode: "visible" | "hidden", fetchPage: FetchProductsPage) => (
      <CartProvider fetchProducts={createFakeCatalog().fetchProducts}>
        <Activity mode={mode}>
          <CatalogProducts category="all" initialProducts={products(1, 12)} initialCursor="c1" fetchPage={fetchPage} />
        </Activity>
      </CartProvider>
    );

    it("запрос отменяется при скрытии, а после показа кнопка снова доступна и работает", async () => {
      const pending = deferred<ProductsPage>();
      const fetchPage = vi
        .fn<FetchProductsPage>()
        .mockImplementationOnce(() => pending.promise)
        .mockResolvedValueOnce(pageOf(products(13, 24), null));
      const { rerender } = render(withMode("visible", fetchPage));

      await userEvent.click(showMore()!);
      expect(screen.getByRole("button", { name: "Загрузка…" })).toBeDisabled();
      const { signal } = fetchPage.mock.calls[0][0];

      rerender(withMode("hidden", fetchPage));
      expect(signal?.aborted).toBe(true);
      // запоздавший ответ отменённого запроса не должен ни добавить карточки, ни сменить курсор
      await act(async () => pending.resolve(pageOf(products(13, 24), "stale")));

      rerender(withMode("visible", fetchPage));
      const button = screen.getByRole("button", { name: "Показать ещё" });
      expect(button).toBeEnabled();
      expect(screen.queryByRole("button", { name: "Загрузка…" })).not.toBeInTheDocument();
      expect(cards()).toHaveLength(12);

      await userEvent.click(button);
      await waitFor(() => expect(cards()).toHaveLength(24));
      expect(fetchPage).toHaveBeenCalledTimes(2);
      expect(fetchPage.mock.calls[1][0]).toMatchObject({ cursor: "c1" });
      expect(showMore()).not.toBeInTheDocument();
    });

    it("запрос, отменённый скрытием, не мешает новому: ответ первого игнорируется", async () => {
      const first = deferred<ProductsPage>();
      const second = deferred<ProductsPage>();
      const fetchPage = vi
        .fn<FetchProductsPage>()
        .mockImplementationOnce(() => first.promise)
        .mockImplementationOnce(() => second.promise);
      const { rerender } = render(withMode("visible", fetchPage));

      await userEvent.click(showMore()!);
      rerender(withMode("hidden", fetchPage));
      rerender(withMode("visible", fetchPage));
      await userEvent.click(showMore()!);
      expect(fetchPage).toHaveBeenCalledTimes(2);

      // поздний ответ первого запроса приходит, пока идёт второй: кнопка остаётся заблокированной
      await act(async () => first.resolve(pageOf(products(13, 24), "stale")));
      expect(screen.getByRole("button", { name: "Загрузка…" })).toBeDisabled();
      expect(cards()).toHaveLength(12);

      await act(async () => second.resolve(pageOf(products(13, 20), null)));
      expect(cards()).toHaveLength(20);
    });

    it("скрытие без запроса в полёте ничего не меняет", async () => {
      const fetchPage = vi.fn<FetchProductsPage>();
      const { rerender } = render(withMode("visible", fetchPage));
      rerender(withMode("hidden", fetchPage));
      rerender(withMode("visible", fetchPage));
      expect(showMore()).toBeEnabled();
      expect(fetchPage).not.toHaveBeenCalled();
    });
  });

  it("озвучивает результат для скринридеров", async () => {
    const fetchPage = vi.fn<FetchProductsPage>(async () => pageOf(products(13, 14), null));
    setup({ fetchPage });
    await userEvent.click(showMore()!);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Показаны все товары"));
  });
});
