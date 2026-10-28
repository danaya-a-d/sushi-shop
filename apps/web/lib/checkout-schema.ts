import { z } from "zod";

/**
 * Данные формы оформления заказа: единый источник правды для типов, проверок и
 * вариантов выбора. Zod-схема проверяет значения, а TypeScript-тип формы
 * выводится из неё (`z.infer`), поэтому они не могут разойтись.
 *
 * Стоимость доставки здесь демонстрационная: итоговую сумму и условия заказа
 * позже будет пересчитывать и проверять NestJS.
 */

export const deliveryOptions = [
  { value: "pickup", label: "Самовывоз из ресторана", fee: 0 },
  { value: "courier", label: "Курьер на дом", fee: 700 },
] as const;

export type DeliveryMethod = (typeof deliveryOptions)[number]["value"];

/** Способы оплаты, которые можно выбрать сейчас. «Картой на сайте» появится вместе с платёжной интеграцией. */
export const paymentOptions = [
  { value: "cash", label: "Наличными при получении" },
  { value: "card_on_delivery", label: "Картой при получении" },
] as const;

export type PaymentMethod = (typeof paymentOptions)[number]["value"];

const deliveryValues = deliveryOptions.map((option) => option.value) as [
  DeliveryMethod,
  ...DeliveryMethod[],
];
const paymentValues = paymentOptions.map((option) => option.value) as [
  PaymentMethod,
  ...PaymentMethod[],
];

export function getDeliveryFee(method: DeliveryMethod): number {
  return deliveryOptions.find((option) => option.value === method)?.fee ?? 0;
}

// Буквы любых алфавитов (кириллица, латиница и т. д.), пробелы, дефис, апостроф и точка.
const NAME_PATTERN = /^\p{L}[\p{L}\p{M}\s'’.-]*$/u;
// Международный вид: необязательный «+», затем цифры и привычные разделители.
const PHONE_PATTERN = /^\+?[\d\s().-]+$/;
const PHONE_MIN_DIGITS = 7;
// Максимум по стандарту E.164
const PHONE_MAX_DIGITS = 15;

function isValidPhone(value: string): boolean {
  if (!PHONE_PATTERN.test(value)) return false;
  const digits = value.replace(/\D/g, "").length;
  return digits >= PHONE_MIN_DIGITS && digits <= PHONE_MAX_DIGITS;
}

// Адресные поля: максимальная длина проверяется только для курьера (см. superRefine в схеме),
// иначе скрытое при самовывозе, но сохранённое в форме значение блокировало бы отправку.
const ADDRESS_LIMITS = {
  street: 100,
  house: 20,
  apartment: 20,
  floor: 10,
  intercom: 20,
} as const;

const ADDRESS_LIMIT_MESSAGES = {
  street: "Не больше 100 символов",
  house: "Не больше 20 символов",
  apartment: "Не больше 20 символов",
  floor: "Не больше 10 символов",
  intercom: "Не больше 20 символов",
} as const;

// Показывает только первую ошибку поля. Zod-овский `abort` здесь не годится: прерывающая ошибка поля
// отключает проверки всего объекта, и ошибки адреса не показывались бы, пока имя или телефон пусты.
function firstError(rules: readonly (readonly [valid: (value: string) => boolean, message: string])[]) {
  return (value: string, context: z.RefinementCtx) => {
    const failed = rules.find(([valid]) => !valid(value));
    if (failed) context.addIssue({ code: "custom", message: failed[1] });
  };
}

export const checkoutSchema = z
  .object({
    name: z
      .string()
      .trim()
      .superRefine(
        firstError([
          [(value) => value.length >= 1, "Введите имя и фамилию"],
          [(value) => value.length >= 2, "Имя слишком короткое"],
          [(value) => value.length <= 100, "Не больше 100 символов"],
          [(value) => NAME_PATTERN.test(value), "Используйте буквы, пробел и дефис"],
        ]),
      ),
    phone: z
      .string()
      .trim()
      .superRefine(
        firstError([
          [(value) => value.length >= 1, "Введите номер телефона"],
          [(value) => value.length <= 30, "Номер слишком длинный"],
          [isValidPhone, "Введите корректный номер телефона"],
        ]),
      ),
    delivery: z.enum(deliveryValues, "Выберите способ доставки"),
    // Адресные поля всегда присутствуют в значениях формы (чтобы введённое не терялось
    // при переключении доставки); обязательность и длина проверяются в superRefine ниже.
    street: z.string().trim(),
    house: z.string().trim(),
    apartment: z.string().trim(),
    floor: z.string().trim(),
    intercom: z.string().trim(),
    comment: z.string().trim().max(500, "Не больше 500 символов"),
    payment: z.enum(paymentValues, "Выберите способ оплаты"),
  })
  .superRefine((values, context) => {
    // Самовывоз: адрес скрыт и не участвует в проверке (значения остаются в форме)
    if (values.delivery !== "courier") return;

    if (values.street === "") {
      context.addIssue({ code: "custom", path: ["street"], message: "Укажите улицу" });
    }
    if (values.house === "") {
      context.addIssue({ code: "custom", path: ["house"], message: "Укажите дом" });
    }

    for (const field of Object.keys(ADDRESS_LIMITS) as (keyof typeof ADDRESS_LIMITS)[]) {
      if (values[field].length > ADDRESS_LIMITS[field]) {
        context.addIssue({ code: "custom", path: [field], message: ADDRESS_LIMIT_MESSAGES[field] });
      }
    }
  });

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export const checkoutDefaultValues: CheckoutFormValues = {
  name: "",
  phone: "",
  delivery: "courier",
  street: "",
  house: "",
  apartment: "",
  floor: "",
  intercom: "",
  comment: "",
  payment: "card_on_delivery",
};
