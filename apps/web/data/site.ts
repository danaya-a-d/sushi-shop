export type NavItem = {
  label: string;
  href: string;
  /** Другие маршруты, на которых пункт тоже считается активным */
  alsoActiveOn?: readonly string[];
};

export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Главная", href: "/" },
  { label: "О нас", href: "/about" },
  { label: "Меню и акции", href: "/catalog", alsoActiveOn: ["/products"] },
];

export type SocialLink = {
  label: string;
  href: string;
  icon: string;
};

export const SOCIAL_LINKS: readonly SocialLink[] = [
  { label: "Instagram", href: "https://instagram.com", icon: "/icons/instagram.svg" },
  { label: "Telegram", href: "https://t.me", icon: "/icons/telegram.svg" },
  { label: "Facebook", href: "https://facebook.com", icon: "/icons/facebook.svg" },
];

/** Моковый номер для кнопки «Перезвонить» */
export const CALLBACK_PHONE = "+380000000000";
