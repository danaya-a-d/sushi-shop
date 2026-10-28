// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CartProvider, useCart } from "@/components/cart/CartProvider";
import { CART_STORAGE_KEY } from "@/lib/cart-storage";
import { formatPrice } from "@/lib/format-price";
import type { ProductsByIds } from "@/lib/api/browser";
import { createFakeCatalog, deferred, makeProduct } from "@/test-utils/fixtures";
import { CheckoutForm } from "./CheckoutForm";

const SUCCESS_NOTICE = /Форма заполнена корректно/;

// У товаров "1" и "2" в управляемом ответе API цена 1250 ₸
const twoItems = [
  { productId: "1", quantity: 1 },
  { productId: "2", quantity: 1 },
];

function seedCart(items: { productId: string; quantity: number }[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items }));
}

let catalog = createFakeCatalog();

function renderCheckout() {
  const user = userEvent.setup();
  render(
    <CartProvider fetchProducts={catalog.fetchProducts}>
      <CheckoutForm recommended={<p>Рекомендации</p>} />
    </CartProvider>,
  );
  return user;
}

/** Ждёт, пока корзина восстановится из localStorage, товары проверит API и кнопка станет доступна. */
async function renderForm() {
  const user = renderCheckout();
  await screen.findByRole("button", { name: "Оформить заказ" });
  await waitFor(() => expect(submit()).toBeEnabled());
  return user;
}

const field = (name: string) => screen.getByRole("textbox", { name });
const queryField = (name: string) => screen.queryByRole("textbox", { name });
const radio = (name: RegExp) => screen.getByRole("radio", { name });
const submit = () => screen.getByRole("button", { name: "Оформить заказ" });

/** Сумма заказа в блоке «Итого»: цены позиций выше не мешают. */
function expectTotal(amount: number) {
  const block = within(screen.getByRole("heading", { name: "Итого:" }).parentElement as HTMLElement);
  // Intl разделяет тысячи неразрывным пробелом, поэтому сравниваем с нормализованными пробелами
  const normalize = (text: string) => text.replace(/\s/g, " ");
  expect(block.getByText((text) => normalize(text) === normalize(formatPrice(amount)))).toBeInTheDocument();
}

async function fillContacts(user: ReturnType<typeof userEvent.setup>) {
  await user.type(field("Имя и фамилия"), "Иван Петров");
  await user.type(field("Номер телефона"), "+380501234567");
}

async function fillAddress(user: ReturnType<typeof userEvent.setup>) {
  await user.type(field("Улица"), "Хрещатик");
  await user.type(field("Дом"), "25");
}

beforeEach(() => {
  localStorage.clear();
  catalog = createFakeCatalog([
    makeProduct("1", { name: "Запеченный краб" }),
    makeProduct("2", { name: "Радуга" }),
  ]);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("CheckoutForm: пустая корзина", () => {
  it("показывает сообщение и ссылку на каталог вместо формы", async () => {
    renderCheckout();

    expect(await screen.findByRole("heading", { name: "Корзина пуста" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Вернуться в меню" })).toHaveAttribute("href", "/catalog");
    expect(screen.queryByRole("button", { name: "Оформить заказ" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});

describe("CheckoutForm: невалидная отправка", () => {
  it("пустая форма: ошибки имени, телефона, улицы и дома, без сообщения об успехе", async () => {
    seedCart(twoItems);
    const user = await renderForm();

    await user.click(submit());

    expect(await screen.findByText("Введите имя и фамилию")).toBeInTheDocument();
    expect(screen.getByText("Введите номер телефона")).toBeInTheDocument();
    expect(screen.getByText("Укажите улицу")).toBeInTheDocument();
    expect(screen.getByText("Укажите дом")).toBeInTheDocument();
    expect(field("Имя и фамилия")).toBeInvalid();
    expect(screen.queryByText(SUCCESS_NOTICE)).not.toBeInTheDocument();
  });

  it("ошибка исчезает после исправления поля и повторной отправки", async () => {
    seedCart(twoItems);
    const user = await renderForm();

    await user.click(submit());
    await screen.findByText("Введите имя и фамилию");

    await fillContacts(user);
    await fillAddress(user);
    await user.click(submit());

    expect(await screen.findByText(SUCCESS_NOTICE)).toBeInTheDocument();
    expect(screen.queryByText("Введите имя и фамилию")).not.toBeInTheDocument();
  });
});

describe("CheckoutForm: переключение доставки", () => {
  it("по умолчанию выбран курьер и видны адресные поля", async () => {
    seedCart(twoItems);
    await renderForm();

    expect(radio(/Курьер на дом/)).toBeChecked();
    expect(radio(/Самовывоз/)).not.toBeChecked();
    for (const name of ["Улица", "Дом", "Квартира", "Этаж", "Домофон"]) {
      expect(field(name)).toBeInTheDocument();
    }
  });

  it("самовывоз скрывает адрес, но оставляет контакты и комментарий", async () => {
    seedCart(twoItems);
    const user = await renderForm();

    await user.click(radio(/Самовывоз/));

    for (const name of ["Улица", "Дом", "Квартира", "Этаж", "Домофон"]) {
      expect(queryField(name)).not.toBeInTheDocument();
    }
    expect(field("Имя и фамилия")).toBeInTheDocument();
    expect(field("Комментарий к заказу")).toBeInTheDocument();
  });

  it("возврат к курьеру возвращает поля с ранее введёнными значениями", async () => {
    seedCart(twoItems);
    const user = await renderForm();

    await user.type(field("Улица"), "Хрещатик");
    await user.type(field("Дом"), "25");
    await user.type(field("Квартира"), "12");
    await user.type(field("Этаж"), "3");
    await user.type(field("Домофон"), "12К");

    await user.click(radio(/Самовывоз/));
    expect(queryField("Улица")).not.toBeInTheDocument();
    await user.click(radio(/Курьер на дом/));

    expect(field("Улица")).toHaveValue("Хрещатик");
    expect(field("Дом")).toHaveValue("25");
    expect(field("Квартира")).toHaveValue("12");
    expect(field("Этаж")).toHaveValue("3");
    expect(field("Домофон")).toHaveValue("12К");
  });

  it("при самовывозе ошибки улицы и дома пропадают вместе с полями", async () => {
    seedCart(twoItems);
    const user = await renderForm();

    await user.click(submit());
    await screen.findByText("Укажите улицу");

    await user.click(radio(/Самовывоз/));
    await user.click(radio(/Курьер на дом/));

    expect(screen.queryByText("Укажите улицу")).not.toBeInTheDocument();
    expect(screen.queryByText("Укажите дом")).not.toBeInTheDocument();
  });
});

describe("CheckoutForm: регрессия скрытого адреса при самовывозе", () => {
  it("слишком длинный скрытый адрес не блокирует самовывоз, у курьера лимиты действуют", async () => {
    seedCart(twoItems);
    const user = await renderForm();
    await fillContacts(user);

    await user.type(field("Улица"), "а".repeat(101));
    await user.type(field("Дом"), "1".repeat(21));
    await user.type(field("Квартира"), "2".repeat(21));
    await user.type(field("Этаж"), "3".repeat(11));
    await user.type(field("Домофон"), "4".repeat(21));

    await user.click(radio(/Самовывоз/));
    await user.click(submit());
    expect(await screen.findByText(SUCCESS_NOTICE)).toBeInTheDocument();

    await user.click(radio(/Курьер на дом/));
    expect(screen.queryByText(SUCCESS_NOTICE)).not.toBeInTheDocument();
    // Значения не потерялись, но снова проверяются
    expect(field("Улица")).toHaveValue("а".repeat(101));

    await user.click(submit());
    expect(await screen.findByText("Не больше 100 символов")).toBeInTheDocument();
    expect(screen.getAllByText(/^Не больше \d+ символов$/)).toHaveLength(5);
    expect(screen.queryByText(SUCCESS_NOTICE)).not.toBeInTheDocument();
  });
});

describe("CheckoutForm: успешная отправка", () => {
  it("показывает уведомление, не очищает корзину и не уходит на сервер", async () => {
    seedCart(twoItems);
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const locationBefore = window.location.href;
    const user = await renderForm();

    await fillContacts(user);
    await fillAddress(user);
    await user.click(submit());

    expect(await screen.findByText(SUCCESS_NOTICE)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Уменьшить количество: Запеченный краб/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Уменьшить количество: Радуга/ })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? "{}").items).toHaveLength(2);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(window.location.href).toBe(locationBefore);
  });

  it("изменение любого поля скрывает устаревшее уведомление", async () => {
    seedCart(twoItems);
    const user = await renderForm();

    await fillContacts(user);
    await fillAddress(user);
    await user.click(submit());
    await screen.findByText(SUCCESS_NOTICE);

    await user.type(field("Комментарий к заказу"), "Позвоните");

    expect(screen.queryByText(SUCCESS_NOTICE)).not.toBeInTheDocument();
  });

  it("смена доставки тоже скрывает уведомление", async () => {
    seedCart(twoItems);
    const user = await renderForm();

    await fillContacts(user);
    await user.click(radio(/Самовывоз/));
    await user.click(submit());
    await screen.findByText(SUCCESS_NOTICE);

    await user.click(radio(/Курьер на дом/));

    expect(screen.queryByText(SUCCESS_NOTICE)).not.toBeInTheDocument();
  });
});

describe("CheckoutForm: итоговая стоимость", () => {
  it("курьер добавляет стоимость доставки, самовывоз бесплатный", async () => {
    seedCart(twoItems);
    const user = await renderForm();

    expectTotal(3200);

    await user.click(radio(/Самовывоз/));
    expectTotal(2500);

    await user.click(radio(/Курьер на дом/));
    expectTotal(3200);
  });

  it("изменение количества пересчитывает итог", async () => {
    seedCart(twoItems);
    const user = await renderForm();

    await user.click(screen.getByRole("button", { name: "Увеличить количество: Запеченный краб" }));
    expectTotal(4450);

    await user.click(screen.getByRole("button", { name: "Уменьшить количество: Радуга" }));
    expectTotal(3200);

    await user.click(radio(/Самовывоз/));
    expectTotal(2500);
  });

  it("удаление позиции пересчитывает итог", async () => {
    seedCart(twoItems);
    const user = await renderForm();

    await user.click(screen.getByRole("button", { name: "Удалить из корзины: Радуга" }));

    expectTotal(1950);
  });
});

describe("CheckoutForm: недоступные возможности", () => {
  it("онлайн-оплата и промокод неактивны, по умолчанию «Картой при получении»", async () => {
    seedCart(twoItems);
    await renderForm();

    expect(radio(/Картой на сайте/)).toBeDisabled();
    expect(radio(/Картой при получении/)).toBeChecked();
    expect(screen.getByRole("textbox", { name: "Промокод" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Применить" })).toBeDisabled();
  });
});

describe("CheckoutForm: данные товаров из API", () => {
  it("пока товары загружаются, не показывает «Корзина пуста» и форму, сумма не выводится", async () => {
    const pending = deferred<ProductsByIds>();
    seedCart(twoItems);
    render(
      <CartProvider fetchProducts={() => pending.promise}>
        <CheckoutForm recommended={null} />
      </CartProvider>,
    );

    // позиции появляются сразу (заглушки), а не «пустая корзина»
    expect(await screen.findByRole("heading", { name: "Ваш заказ" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Корзина пуста" })).not.toBeInTheDocument();
    expect(submit()).toBeDisabled();
    expect(screen.getByText("Проверяем цены и наличие товаров…")).toBeInTheDocument();

    await act(async () =>
      pending.resolve({
        available: [makeProduct("1"), makeProduct("2")],
        unavailable: [],
        missing: [],
      }),
    );
    await waitFor(() => expect(submit()).toBeEnabled());
    expectTotal(3200);
  });

  it("недоступный товар остаётся в списке, блокирует оформление и убирается кнопкой удаления", async () => {
    seedCart(twoItems);
    catalog.deactivate("2");
    const user = renderCheckout();
    await screen.findByText("Товар временно недоступен");

    expect(screen.getByRole("alert")).toHaveTextContent(/больше недоступны/);
    expect(submit()).toBeDisabled();
    expect(localStorage.getItem(CART_STORAGE_KEY)).toContain('"productId":"2"');

    await user.click(screen.getByRole("button", { name: /Удалить из корзины: товар временно недоступен/ }));

    await waitFor(() => expect(submit()).toBeEnabled());
    expect(screen.queryByText("Товар временно недоступен")).not.toBeInTheDocument();
    expectTotal(1950);
  });

  it("удалённый из меню товар помечается отдельным текстом", async () => {
    seedCart(twoItems);
    catalog.remove("1");
    renderCheckout();

    expect(await screen.findByText("Товар удалён из меню")).toBeInTheDocument();
    expect(submit()).toBeDisabled();
  });

  it("ошибка API: сообщение с повтором, корзина сохранена, оформление закрыто; после повтора доступно", async () => {
    seedCart(twoItems);
    catalog.failNext();
    const user = renderCheckout();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/Не удалось проверить цены/);
    expect(submit()).toBeDisabled();
    expect(localStorage.getItem(CART_STORAGE_KEY)).toContain('"productId":"1"');
    expect(screen.queryByRole("heading", { name: "Корзина пуста" })).not.toBeInTheDocument();

    await user.click(within(alert).getByRole("button", { name: "Повторить" }));

    await waitFor(() => expect(submit()).toBeEnabled());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expectTotal(3200);
  });

  it("при открытии checkout перепроверяет актуальную цену", async () => {
    seedCart(twoItems);
    catalog.setProduct(makeProduct("2", { name: "Радуга", price: 1000 }));
    await renderForm();

    expectTotal(2950);
  });

  it("не отправляет форму при недоступных позициях даже при корректных данных", async () => {
    seedCart(twoItems);
    catalog.deactivate("2");
    const user = renderCheckout();
    await screen.findByText("Товар временно недоступен");

    await fillContacts(user);
    await fillAddress(user);
    await user.click(submit());

    expect(screen.queryByText(SUCCESS_NOTICE)).not.toBeInTheDocument();
  });

  it("пока идёт повторная проверка цен, кнопка заблокирована и форма не отправляется; после ответа — снова доступна", async () => {
    seedCart(twoItems);
    // первый запрос (восстановление) отвечает сразу, второй (перепроверка) ждёт ответа
    const gates: ReturnType<typeof deferred<ProductsByIds>>[] = [];
    let gated = false;
    const fetchProducts = vi.fn(async (ids: readonly string[]) => {
      if (!gated) return catalog.fetchProducts(ids);
      const gate = deferred<ProductsByIds>();
      gates.push(gate);
      return gate.promise;
    });
    const user = userEvent.setup();
    const RefreshButton = () => {
      const cart = useCart();
      return <button onClick={() => cart.refresh()}>перепроверить</button>;
    };
    render(
      <CartProvider fetchProducts={fetchProducts}>
        <CheckoutForm recommended={null} />
        <RefreshButton />
      </CartProvider>,
    );
    await waitFor(() => expect(submit()).toBeEnabled());
    await fillContacts(user);
    await fillAddress(user);

    gated = true;
    await user.click(screen.getByRole("button", { name: "перепроверить" }));

    expect(submit()).toBeDisabled();
    expect(screen.getByText("Проверяем цены и наличие товаров…")).toBeInTheDocument();
    // последняя известная сумма остаётся на экране
    expectTotal(3200);
    await user.click(submit());
    expect(screen.queryByText(SUCCESS_NOTICE)).not.toBeInTheDocument();

    await act(async () =>
      gates[0].resolve({
        available: [makeProduct("1", { name: "Запеченный краб" }), makeProduct("2", { name: "Радуга", price: 1000 })],
        unavailable: [],
        missing: [],
      }),
    );

    await waitFor(() => expect(submit()).toBeEnabled());
    expectTotal(2950);
    await user.click(submit());
    expect(await screen.findByText(SUCCESS_NOTICE)).toBeInTheDocument();
  });

  it("ошибка перепроверки блокирует отправку, но корзина и введённые данные сохраняются", async () => {
    seedCart(twoItems);
    let fail = false;
    const fetchProducts = vi.fn(async (ids: readonly string[]) => {
      if (fail) throw new Error("API недоступен");
      return catalog.fetchProducts(ids);
    });
    const user = userEvent.setup();
    const RefreshButton = () => {
      const cart = useCart();
      return <button onClick={() => cart.refresh()}>перепроверить</button>;
    };
    render(
      <CartProvider fetchProducts={fetchProducts}>
        <CheckoutForm recommended={null} />
        <RefreshButton />
      </CartProvider>,
    );
    await waitFor(() => expect(submit()).toBeEnabled());
    await fillContacts(user);

    fail = true;
    await user.click(screen.getByRole("button", { name: "перепроверить" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(submit()).toBeDisabled();
    expect(field("Имя и фамилия")).toHaveValue("Иван Петров");
    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? "null")).toEqual({ items: twoItems });
  });
});
