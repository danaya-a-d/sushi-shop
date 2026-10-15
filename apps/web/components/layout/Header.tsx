import { CartButton } from "@/components/cart/CartButton";
import { Container } from "@/components/layout/Container";
import { CallbackIcon } from "@/components/ui/icons";
import { CALLBACK_PHONE } from "@/data/site";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { NavLinks } from "./NavLinks";

export function Header() {
  return (
    <header className="relative z-30 bg-lime lg:bg-transparent">
      <Container className="grid h-[72px] grid-cols-[auto_1fr_auto] items-center md:h-[115px] md:grid-cols-[1fr_auto_1fr]">
        <MobileMenu />

        <Logo className="justify-self-center lg:justify-self-start" />

        <nav aria-label="Главное меню" className="hidden lg:block">
          <NavLinks
            className="flex items-center gap-[67px]"
            linkClassName="text-2xl"
          />
        </nav>

        {/* Видимые контуры телефона и корзины стоят на одной нижней линии (по макету) */}
        <div className="mb-6 flex items-end gap-[15px] self-end justify-self-end md:mb-11 md:gap-5 lg:mb-0 lg:items-center lg:gap-[25px] lg:self-center">
          <a
            href={`tel:${CALLBACK_PHONE}`}
            aria-label="Перезвонить"
            className="relative block text-ink transition-ui-fast after:absolute after:-inset-x-[7px] after:-inset-y-2.5 after:content-[''] hover:text-primary focus-visible:text-primary"
          >
            <CallbackIcon className="block size-6 md:size-[30px] lg:size-[34px]" />
          </a>
          <CartButton />
        </div>
      </Container>
    </header>
  );
}
