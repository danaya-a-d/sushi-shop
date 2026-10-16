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
  { value: "courier", label: "Курьер на дом", fee: 60 },
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

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message);

export const checkoutSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, { error: "Введите имя и фамилию", abort: true })
      .min(2, { error: "Имя слишком короткое", abort: true })
      .max(100, { error: "Не больше 100 символов", abort: true })
      .regex(NAME_PATTERN, "Используйте буквы, пробел и дефис"),
    phone: z
      .string()
      .trim()
      .min(1, { error: "Введите номер телефона", abort: true })
      .max(30, { error: "Номер слишком длинный", abort: true })
      .refine(isValidPhone, "Введите корректный номер телефона"),
    delivery: z.enum(deliveryValues, "Выберите способ доставки"),
    // Адресные поля всегда присутствуют в значениях формы (чтобы введённое не терялось
    // при переключении доставки), а обязательность проверяется в superRefine ниже.
    street: optionalText(100, "Не больше 100 символов"),
    house: optionalText(20, "Не больше 20 символов"),
    apartment: optionalText(20, "Не больше 20 символов"),
    floor: optionalText(10, "Не больше 10 символов"),
    intercom: optionalText(20, "Не больше 20 символов"),
    comment: optionalText(500, "Не больше 500 символов"),
    payment: z.enum(paymentValues, "Выберите способ оплаты"),
  })
  .superRefine((values, context) => {
    if (values.delivery !== "courier") return;

    if (values.street === "") {
      context.addIssue({
        code: "custom",
        path: ["street"],
        message: "Укажите улицу",
      });
    }
    if (values.house === "") {
      context.addIssue({
        code: "custom",
        path: ["house"],
        message: "Укажите дом",
      });
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
