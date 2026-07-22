import { cn } from "@lib/utils";

type AccountAvatarProps = {
  initials: string;
  className?: string;
};

/** Initials chip, shared by the desktop dropdown trigger and the drawer account block. */
const AccountAvatar = ({ initials, className }: AccountAvatarProps) => (
  <span
    className={cn(
      "grid size-[30px] flex-shrink-0 place-items-center rounded-full border border-line bg-surface-hi text-2xs font-medium text-ink-2",
      className,
    )}
  >
    {initials}
  </span>
);

export default AccountAvatar;
