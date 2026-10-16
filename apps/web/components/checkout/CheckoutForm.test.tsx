// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CartProvider } from "@/components/cart/CartProvider";
import { CART_STORAGE_KEY } from "@/lib/cart-storage";
import { formatPrice } from "@/lib/format-price";
import { CheckoutForm } from "./CheckoutForm";

const SUCCESS_NOTICE = /Форма заполнена корректно/;

// В моковом каталоге у товаров "1" и "2" цена 1250 грн
const twoItems = [
  { productId: "1", quantity: 1 },
  { productId: "2", quantity: 1 },
];

function seedCart(items: { productId: string; quantity: number }[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items }));
}

function renderCheckout() {
  const user = userEvent.setup();
  render(
    <CartProvider>
      <CheckoutForm recommended={<p>Рекомендации</p>} />
    </CartProvider>,
  );
  return user;
}

/** Ждёт, пока корзина восстановится из localStorage и появится форма. */
async function renderForm() {
  const user = renderCheckout();
  await screen.findByRole("button", { name: "Оформить заказ" });
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

    expectTotal(2560);

    await user.click(radio(/Самовывоз/));
    expectTotal(2500);

    await user.click(radio(/Курьер на дом/));
    expectTotal(2560);
  });

  it("изменение количества пересчитывает итог", async () => {
    seedCart(twoItems);
    const user = await renderForm();

    await user.click(screen.getByRole("button", { name: "Увеличить количество: Запеченный краб" }));
    expectTotal(3810);

    await user.click(screen.getByRole("button", { name: "Уменьшить количество: Радуга" }));
    expectTotal(2560);

    await user.click(radio(/Самовывоз/));
    expectTotal(2500);
  });

  it("удаление позиции пересчитывает итог", async () => {
    seedCart(twoItems);
    const user = await renderForm();

    await user.click(screen.getByRole("button", { name: "Удалить из корзины: Радуга" }));

    expectTotal(1310);
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
