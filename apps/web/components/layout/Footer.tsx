import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { NAV_ITEMS } from "@/data/site";
import { Logo } from "./Logo";
import { SocialLinks } from "./SocialLinks";

export function Footer() {
  return (
    <footer className="bg-lime">
      <Container className="grid grid-cols-2 items-center pt-[29px] pb-[33px] md:pt-10 md:pb-12 lg:grid-cols-[1fr_auto_1fr] lg:pb-[50px]">
        <Logo className="justify-self-start" />

        <SocialLinks
          className="justify-self-end gap-[15px] md:gap-5 lg:col-start-3 lg:row-start-1"
          iconClassName="size-6 md:size-[34px]"
        />

        <nav
          aria-label="Меню в подвале"
          className="col-span-2 row-start-2 mt-[49px] md:mt-[60px] lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:mt-0"
        >
          <ul className="flex items-center justify-center gap-3 whitespace-nowrap text-xl md:gap-[65px] md:text-2xl lg:gap-[69px]">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="transition-colors hover:text-primary focus-visible:text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="col-span-2 row-start-3 mt-[50px] text-center lg:col-span-3 text-base text-accent md:mt-[100px] md:text-2xl lg:mt-[77px]">
          © Все права защищены
        </p>
      </Container>
    </footer>
  );
}
