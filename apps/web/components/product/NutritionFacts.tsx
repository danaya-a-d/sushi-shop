import type { Nutrition } from "@/types/product";

type NutritionFactsProps = {
  nutrition: Nutrition;
};

const items = (nutrition: Nutrition) => [
  { label: "Калорийность", value: `${nutrition.calories} ккал` },
  { label: "Белки", value: `${nutrition.protein} г` },
  { label: "Жиры", value: `${nutrition.fat} г` },
  { label: "Углеводы", value: `${nutrition.carbs} г` },
];

/** Компактный второстепенный блок: 2×2 на mobile и на узкой колонке (1024–1279), в один ряд на tablet и широком desktop. */
export function NutritionFacts({ nutrition }: NutritionFactsProps) {
  return (
    <section aria-labelledby="nutrition-title">
      <h2 id="nutrition-title" className="text-sm leading-[1.3] md:text-base">
        <span className="font-medium">Пищевая ценность</span>{" "}
        <span className="opacity-60">на 100 г</span>
      </h2>

      <dl className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3 lg:max-xl:grid-cols-2">
        {items(nutrition).map((item) => (
          <div
            key={item.label}
            className="rounded-[20px] bg-lavender/50 px-4 py-3"
          >
            <dt className="text-xs leading-[1.3] opacity-60">{item.label}</dt>
            <dd className="mt-1 text-base whitespace-nowrap leading-[1.3] font-medium md:text-lg">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
