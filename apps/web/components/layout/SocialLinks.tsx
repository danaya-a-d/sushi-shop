import { SOCIAL_LINKS } from "@/data/site";
import { MaskIcon } from "@/components/ui/MaskIcon";

type SocialLinksProps = {
  className?: string;
  iconClassName?: string;
};

export function SocialLinks({
  className = "",
  iconClassName = "size-[34px]",
}: SocialLinksProps) {
  return (
    <ul className={`flex items-center ${className}`}>
      {SOCIAL_LINKS.map((social) => (
        <li key={social.label}>
          <a
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.label}
            className="block text-ink transition-colors hover:text-primary focus-visible:text-primary"
          >
            <MaskIcon src={social.icon} className={iconClassName} />
          </a>
        </li>
      ))}
    </ul>
  );
}
