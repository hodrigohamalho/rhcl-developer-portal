import { Landmark, ArrowLeftRight, Users, Fingerprint, Sparkles, Boxes, type LucideIcon } from "lucide-react";

interface Visual {
  Icon: LucideIcon;
  /** tailwind classes for the icon tile background + text */
  tile: string;
}

const MAP: { match: RegExp; visual: Visual }[] = [
  { match: /bank|open.?bank/i, visual: { Icon: Landmark, tile: "bg-indigo-50 text-indigo-600" } },
  { match: /pay|pix|transfer/i, visual: { Icon: ArrowLeftRight, tile: "bg-emerald-50 text-emerald-600" } },
  { match: /customer|profile|consent/i, visual: { Icon: Users, tile: "bg-amber-50 text-amber-600" } },
  { match: /identity|auth|iam/i, visual: { Icon: Fingerprint, tile: "bg-rose-50 text-rose-600" } },
  { match: /ai|ml|model|chat/i, visual: { Icon: Sparkles, tile: "bg-violet-50 text-violet-600" } },
];

export function productVisual(nameOrTags: string): Visual {
  for (const { match, visual } of MAP) {
    if (match.test(nameOrTags)) return visual;
  }
  return { Icon: Boxes, tile: "bg-brand-50 text-brand-600" };
}
