import React from "react";
import { MAIN_NAV_ITEMS, type NavItem } from "@/config/navigation";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/Badge";
import { ExternalLink } from "lucide-react";

export interface NavLinksProps {
  readonly activeHref?: string;
  readonly activeRoute?: string;
  readonly onItemClick?: () => void;
  readonly className?: string;
  readonly vertical?: boolean;
}

export const NavLinks: React.FC<NavLinksProps> = ({
  activeHref,
  activeRoute,
  onItemClick,
  className,
  vertical = false,
}) => {
  return (
    <nav
      aria-label={vertical ? "Mobile Navigation" : "Primary Navigation"}
      className={cn(
        vertical ? "flex flex-col space-y-2" : "flex items-center space-x-1",
        className
      )}
    >
      {MAIN_NAV_ITEMS.map((item: NavItem) => {
        const isActive =
          (activeRoute && item.routeId && activeRoute === item.routeId) ||
          activeHref === item.href;

        return (
          <a
            key={item.label}
            href={item.href}
            onClick={onItemClick}
            target={item.isExternal ? "_blank" : undefined}
            rel={item.isExternal ? "noopener noreferrer" : undefined}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60",
              isActive
                ? "text-white bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            )}
          >
            <span>{item.label}</span>
            {item.badge && (
              <Badge variant="cyan" size="sm" className="ml-1">
                {item.badge}
              </Badge>
            )}
            {item.isExternal && (
              <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
            )}
          </a>
        );
      })}
    </nav>
  );
};
