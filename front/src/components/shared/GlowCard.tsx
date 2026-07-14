import { cn } from "@lib/utils";

type GlowCardProps = React.HTMLAttributes<HTMLElement> & {
  /** Rendered element. Defaults to `div`; use `section` for page-level cards. */
  as?: "div" | "section";
  /** Adds the hover lift/glow (category-tile style). */
  hover?: boolean;
};

/**
 * The signature pfa surface: `surface-elev` fill with the diagonal glow gradient
 * border and soft shadow (`.pfa-card`). Shared by every private-screen card so
 * the KPIs, charts and panels all read as the same material.
 */
const GlowCard = ({ as: Tag = "div", hover = false, className, children, ...rest }: GlowCardProps) => (
  <Tag
    className={cn("pfa-card", hover && "pfa-card-hover", className)}
    {...rest}
  >
    {children}
  </Tag>
);

export default GlowCard;
