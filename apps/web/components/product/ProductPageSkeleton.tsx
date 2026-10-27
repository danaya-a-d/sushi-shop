import { Container } from "@/components/layout/Container";

/**
 * Заглушка страницы товара на время загрузки данных. Повторяет сетку ProductDetails
 * (те же контейнеры, отступы и пропорции фото), чтобы при появлении контента не было скачков.
 */
export function ProductPageSkeleton() {
  return (
    <div aria-hidden="true">
      <Container className="mt-6 md:mt-8 lg:mt-10">
        <div className="h-6 w-64 max-w-full animate-pulse rounded-full bg-lavender/70" />
      </Container>

      <Container className="mt-6 md:mt-10 lg:mt-[60px]">
        <div className="grid gap-y-8 md:mx-auto md:max-w-[630px] md:gap-y-10 lg:max-w-none lg:grid-cols-[minmax(0,630px)_minmax(0,520px)] lg:items-center lg:justify-between lg:gap-x-12">
          <div className="relative aspect-[630/620] w-full">
            <div className="absolute top-0 left-[4%] h-[92%] w-[92%] animate-pulse rounded-tl-[40px] rounded-tr-[130px] rounded-br-[130px] rounded-bl-[130px] bg-lime/50 md:rounded-tl-[100px] md:rounded-tr-[300px] md:rounded-br-[300px] md:rounded-bl-[300px] lg:rounded-tr-[450px] lg:rounded-br-[450px] lg:rounded-bl-[450px]" />
          </div>

          <div className="flex flex-col gap-6 md:gap-8 lg:gap-9">
            <div className="flex flex-col gap-4">
              <div className="h-10 w-3/4 animate-pulse rounded-full bg-lavender/70 md:h-14" />
              <div className="h-4 w-full animate-pulse rounded-full bg-lavender/50 md:h-6" />
              <div className="h-4 w-2/3 animate-pulse rounded-full bg-lavender/50 md:h-6" />
            </div>
            <div className="h-[120px] animate-pulse rounded-[30px] bg-lavender/40 md:rounded-[50px]" />
          </div>
        </div>
      </Container>
    </div>
  );
}
