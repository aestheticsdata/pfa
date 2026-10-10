import Button from "@components/ui/Button";
import { BUTTON_SIZE, BUTTON_VARIANT } from "@components/ui/variants";
import { signOut } from "@lib/auth/authActions";
import { PANEL_TEXT } from "@text/panel";

import type { SignOutButtonProps } from "@components/panel/topBar/interfaces/signOutTypes";

/** A form, so signing out works before the page's JavaScript has loaded. */
const SignOutButton = ({ variant = BUTTON_VARIANT.ghost, className, menuItem = false }: SignOutButtonProps) => (
  <form
    action={signOut}
    className={className}
  >
    <Button
      type="submit"
      variant={variant}
      size={BUTTON_SIZE.sm}
      data-testid="sign-out"
      className={menuItem ? "w-full justify-start border-0" : undefined}
    >
      {PANEL_TEXT.signOut}
    </Button>
  </form>
);

export default SignOutButton;
