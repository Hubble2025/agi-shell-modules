import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavigationIconProps {
  icon: string | null;
  className?: string;
}

export function NavigationIcon({ icon, className = 'w-5 h-5' }: NavigationIconProps) {
  if (!icon) {
    return null;
  }

  const isEmoji = icon.length <= 4 && /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(icon);

  if (isEmoji) {
    return <span className={`${className} flex items-center justify-center`}>{icon}</span>;
  }

  const IconComponent = (LucideIcons as Record<string, LucideIcon>)[icon];

  if (!IconComponent) {
    console.warn(`Icon "${icon}" not found in Lucide React`);
    return null;
  }

  return <IconComponent className={className} />;
}
