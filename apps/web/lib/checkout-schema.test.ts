import { describe, expect, it } from "vitest";
import {
  type CheckoutFormValues,
  checkoutDefaultValues,
  checkoutSchema,
  deliveryOptions,
  getDeliveryFee,
  paymentOptions,
} from "./checkout-schema";

const validCourier: CheckoutFormValues = {
  ...checkoutDefaultValues,
  name: "Иван Петров",
  phone: "+380 50 123 45 67",
  delivery: "courier",
  street: "Хрещатик",
  house: "25",
};

const validPickup: CheckoutFormValues = {
  ...checkoutDefaultValues,
  name: "Ivan Petrov",
  phone: "0501234567",
  delivery: "pickup",
};

/** Ошибки по именам полей: поле → сообщения */
function errorsOf(values: unknown): Record<string, string[]> {
  const result = checkoutSchema.safeParse(values);
  if (result.success) return {};
  const byField: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0]);
    (byField[field] ??= []).push(issue.message);
  }
  return byField;
}

describe("checkoutSchema: значения по умолчанию", () => {
  it("по умолчанию курьер и «Картой при получении»", () => {
    expect(checkoutDefaultValues.delivery).toBe("courier");
    expect(checkoutDefaultValues.payment).toBe("card_on_delivery");
  });

  it("пустая форма с умолчаниями не проходит проверку", () => {
    expect(checkoutSchema.safeParse(checkoutDefaultValues).success).toBe(false);
  });
});

describe("checkoutSchema: контактные данные", () => {
  it("принимает корректные данные для курьера", () => {
    expect(checkoutSchema.safeParse(validCourier).success).toBe(true);
  });

  it("принимает корректные данные для самовывоза", () => {
    expect(checkoutSchema.safeParse(validPickup).success).toBe(true);
  });

  it.each(["Иван Петров", "Anna-Maria Smith", "Мария Ивановна О'Нил", "Жан-Люк Пикар", "Ли Чжун"])(
    "принимает имя «%s»",
    (name) => {
      expect(errorsOf({ ...validPickup, name }).name).toBeUndefined();
    },
  );

  it("убирает пробелы по краям", () => {
    const result = checkoutSchema.safeParse({ ...validPickup, name: "  Иван  ", phone: " 0501234567 " });
    expect(result.success && result.data.name).toBe("Иван");
    expect(result.success && result.data.phone).toBe("0501234567");
  });

  it("пустые имя и телефон дают ошибки обоих полей", () => {
    const errors = errorsOf({ ...validPickup, name: "", phone: "" });
    expect(errors.name).toEqual(["Введите имя и фамилию"]);
    expect(errors.phone).toEqual(["Введите номер телефона"]);
  });

  it("имя из одних пробелов считается пустым", () => {
    expect(errorsOf({ ...validPickup, name: "   " }).name).toEqual(["Введите имя и фамилию"]);
  });

  it.each(["1", "И", "Иван123", "Иван_Петров", "<b>Иван</b>", "- Иван"])(
    "отклоняет имя «%s»",
    (name) => {
      expect(errorsOf({ ...validPickup, name }).name).toBeDefined();
    },
  );

  it.each(["+380501234567", "+1 (415) 555-26-71", "050-123-45-67", "8 800 555 35 35", "+44 20 7946 0958"])(
    "принимает телефон «%s»",
    (phone) => {
      expect(errorsOf({ ...validPickup, phone }).phone).toBeUndefined();
    },
  );

  it.each(["abc", "12345", "+38050abc4567", "1234567890123456", "++380501234567", "050 123 45 67 доб. 5"])(
    "отклоняет телефон «%s»",
    (phone) => {
      expect(errorsOf({ ...validPickup, phone }).phone).toEqual(["Введите корректный номер телефона"]);
    },
  );
});

describe("checkoutSchema: доставка и адрес", () => {
  it("самовывоз проходит без адреса", () => {
    const errors = errorsOf({ ...validPickup, street: "", house: "" });
    expect(errors).toEqual({});
  });

  it("при самовывозе введённый ранее адрес не мешает и не проверяется", () => {
    const result = checkoutSchema.safeParse({ ...validPickup, street: "Хрещатик", house: "25" });
    expect(result.success).toBe(true);
  });

  it("курьер без улицы и дома: ошибки обоих полей", () => {
    const errors = errorsOf({ ...validCourier, street: "", house: "" });
    expect(errors.street).toEqual(["Укажите улицу"]);
    expect(errors.house).toEqual(["Укажите дом"]);
  });

  it("курьер с пустой улицей: ошибка только улицы", () => {
    const errors = errorsOf({ ...validCourier, street: "" });
    expect(Object.keys(errors)).toEqual(["street"]);
  });

  it("курьер: улица из пробелов считается пустой", () => {
    expect(errorsOf({ ...validCourier, street: "   " }).street).toEqual(["Укажите улицу"]);
  });

  it("курьер с пустым домом: ошибка только дома", () => {
    expect(Object.keys(errorsOf({ ...validCourier, house: "" }))).toEqual(["house"]);
  });

  it("квартира, этаж, домофон и комментарий необязательны", () => {
    const result = checkoutSchema.safeParse({
      ...validCourier,
      apartment: "",
      floor: "",
      intercom: "",
      comment: "",
    });
    expect(result.success).toBe(true);
  });

  it("принимает заполненные необязательные поля", () => {
    const result = checkoutSchema.safeParse({
      ...validCourier,
      apartment: "12",
      floor: "3",
      intercom: "12К",
      comment: "Позвоните за 10 минут",
    });
    expect(result.success).toBe(true);
  });

  it("смена доставки меняет набор обязательных полей для одних и тех же значений", () => {
    const withoutAddress = { ...validPickup, street: "", house: "" };
    expect(checkoutSchema.safeParse(withoutAddress).success).toBe(true);
    expect(checkoutSchema.safeParse({ ...withoutAddress, delivery: "courier" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...withoutAddress, delivery: "pickup" }).success).toBe(true);
  });

  it("отклоняет неизвестный способ доставки (в том числе удалённый «другому»)", () => {
    expect(errorsOf({ ...validPickup, delivery: "other" }).delivery).toBeDefined();
    expect(errorsOf({ ...validPickup, delivery: "" }).delivery).toBeDefined();
  });

  it("ошибка неверного способа доставки не скрывает ошибки других полей", () => {
    const errors = errorsOf({ ...validPickup, delivery: "other", name: "" });
    expect(errors.delivery).toBeDefined();
    expect(errors.name).toBeDefined();
  });
});

describe("checkoutSchema: ограничения длины", () => {
  it.each([
    ["name", 101],
    ["street", 101],
    ["house", 21],
    ["apartment", 21],
    ["floor", 11],
    ["intercom", 21],
    ["comment", 501],
  ] as const)("поле %s не принимает %i символов", (field, length) => {
    const values = { ...validCourier, [field]: "а".repeat(length) };
    expect(errorsOf(values)[field]).toBeDefined();
  });

  it.each([
    ["name", 100],
    ["street", 100],
    ["house", 20],
    ["apartment", 20],
    ["floor", 10],
    ["intercom", 20],
    ["comment", 500],
  ] as const)("поле %s принимает ровно %i символов", (field, length) => {
    const values = { ...validCourier, [field]: "а".repeat(length) };
    expect(errorsOf(values)[field]).toBeUndefined();
  });

  it("длинный телефон отклоняется", () => {
    expect(errorsOf({ ...validPickup, phone: "1".repeat(31) }).phone).toBeDefined();
  });
});

describe("checkoutSchema: оплата", () => {
  it.each(paymentOptions.map((option) => option.value))("принимает «%s»", (payment) => {
    expect(checkoutSchema.safeParse({ ...validCourier, payment }).success).toBe(true);
  });

  it("«Картой на сайте» недоступна", () => {
    expect(errorsOf({ ...validCourier, payment: "card_online" }).payment).toBeDefined();
    expect(paymentOptions.some((option) => option.value === ("card_online" as string))).toBe(false);
  });

  it("пустое и неизвестное значение отклоняются", () => {
    expect(errorsOf({ ...validCourier, payment: "" }).payment).toBeDefined();
    expect(errorsOf({ ...validCourier, payment: "crypto" }).payment).toBeDefined();
  });
});

describe("стоимость доставки", () => {
  it("самовывоз бесплатный, курьер стоит 60 грн", () => {
    expect(getDeliveryFee("pickup")).toBe(0);
    expect(getDeliveryFee("courier")).toBe(60);
  });

  it("доступны только два способа доставки", () => {
    expect(deliveryOptions.map((option) => option.value)).toEqual(["pickup", "courier"]);
  });
});
