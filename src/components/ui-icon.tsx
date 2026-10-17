import type { ReactNode } from "react";

export type IconName =
  | "arrow"
  | "bike"
  | "briefcase"
  | "calendar"
  | "car"
  | "document"
  | "globe"
  | "hammer"
  | "heart"
  | "home"
  | "help"
  | "logout"
  | "microphone"
  | "moon"
  | "sparkles"
  | "sun"
  | "wallet";

const shapes: Record<IconName, ReactNode> = {
  arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  bike: <><circle cx="5" cy="17" r="3" /><circle cx="19" cy="17" r="3" /><path d="m5 17 4-8h4l4 8h-5l-3-8" /><path d="m15 7 2 2h2" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 10h18" /><path d="M8 14h3m-3 3h3" /></>,
  car: <><path d="m5 11 2-5h10l2 5" /><rect x="3" y="11" width="18" height="8" rx="2" /><path d="M7 19v2m10-2v2M7 15h1m8 0h1" /></>,
  document: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 4 6 4 9s-1 6-4 9c-3-3-4-6-4-9s1-6 4-9" /></>,
  hammer: <><path d="m14 4 6 6-3 3-6-6 3-3ZM13 9 4 18a2 2 0 0 0 3 3l9-9" /><path d="m12 6 3-3" /></>,
  heart: <><path d="M12 21s-8-5.5-8-11a4.5 4.5 0 0 1 8-2.7A4.5 4.5 0 0 1 20 10c0 5.5-8 11-8 11Z" /><path d="M9 14h6" /></>,
  home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" /><path d="M9 21v-7h6v7" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4.4 1.6c-1.1 1.2-1.9 1.5-1.9 3" /><path d="M12 17h.01" /></>,
  logout: <><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" /><path d="M12 12h9m-4-4 4 4-4 4" /></>,
  microphone: <><rect x="9" y="2" width="6" height="13" rx="3" /><path d="M5 10a7 7 0 0 0 14 0M12 17v5m-4 0h8" /></>,
  moon: <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5Z" />,
  sparkles: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 17 .7 1.3L21 19l-1.3.7L19 21l-.7-1.3L17 19l1.3-.7L19 17ZM5 17l.5 1L7 18.5 5.5 19 5 20l-.5-1L3 18.5 4.5 18 5 17Z" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  wallet: <><rect x="3" y="5" width="18" height="15" rx="2" /><path d="M3 9h18M16 15h2" /></>,
};

export function UiIcon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
    >
      {shapes[name]}
    </svg>
  );
}
