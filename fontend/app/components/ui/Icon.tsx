import type { ReactNode } from "react";

export type IconName =
  | "search"
  | "heart"
  | "bag"
  | "user"
  | "arrow"
  | "chevron"
  | "close"
  | "menu"
  | "truck"
  | "shield"
  | "return"
  | "support"
  | "star"
  | "plus"
  | "minus"
  | "check"
  | "filter"
  | "crown"
  | "instagram"
  | "undo"
  | "mail"
  | "facebook"
  | "youtube"
  | "pinterest"
  | "tiktok";

const iconPaths: Record<IconName, ReactNode> = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
  bag: <><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
  arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  close: <><path d="m18 6-12 12" /><path d="m6 6 12 12" /></>,
  menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
  truck: <><path d="M3 6h11v12H3z" /><path d="M14 10h4l3 3v5h-7" /><circle cx="7.5" cy="18.5" r="1.5" /><circle cx="17.5" cy="18.5" r="1.5" /></>,
  shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
  return: <><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l3 2" /></>,
  support: <><path d="M4 13v-2a8 8 0 0 1 16 0v2" /><path d="M4 13h3v6H6a2 2 0 0 1-2-2v-4Z" /><path d="M20 13h-3v6h1a2 2 0 0 0 2-2v-4Z" /><path d="M17 20c-1 1-2 1-4 1" /></>,
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  minus: <path d="M5 12h14" />,
  check: <path d="m5 12 4 4L19 6" />,
  filter: <><path d="M4 7h16" /><path d="M7 12h10" /><path d="M10 17h4" /></>,
  crown: <><path d="m2 8 5 4 5-8 5 8 5-4-2 12H4L2 8Z" /><path d="M5 21h14" /></>,
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" /></>,
  undo: <><path d="M9 14 4 9l5-5" /><path d="M4 9h9a7 7 0 0 1 0 14h-2" /></>,
  mail: <><rect x="2.5" y="4.5" width="19" height="15" rx="2" /><path d="m3 6 9 7 9-7" /></>,
  facebook: <path d="M14 21v-8h3l.5-4H14V7c0-1.2.4-2 2-2h2V1.4C17.2 1.2 16.1 1 15 1c-3.2 0-5 1.9-5 5.4V9H7v4h3v8h4Z" />,
  youtube: <><rect x="2" y="5" width="20" height="14" rx="4" /><path d="m10 9 5 3-5 3V9Z" /></>,
  pinterest: <><circle cx="12" cy="12" r="9" /><path d="m9 20 2-6m0 0c-1-4 0-6 2-6 2.5 0 2.5 3 1 5-1 2-3 1-3 0" /></>,
  tiktok: <><path d="M14 4v10.5a4 4 0 1 1-4-4" /><path d="M14 4c.5 2 2 3.5 4.5 4" /></>,
};

export function Icon({
  name,
  size = 18,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.55"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  );
}
