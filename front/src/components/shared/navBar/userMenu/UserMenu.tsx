"use client";

import { useAuth } from "@auth/context/AuthContext";
import { ROUTES } from "@components/shared/config/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import useRequestHelper from "@helpers/useRequestHelper";
import { ChevronDown, KeyRound, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

const initialsFromEmail = (email?: string): string => {
  if (!email) return "?";
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[.\-_]+/).filter(Boolean);
  const letters = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : local.slice(0, 2);
  return (letters || "?").toUpperCase();
};

const UserMenu = () => {
  const { user } = useAuth();
  const { privateRequest } = useRequestHelper();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await privateRequest("/users/logout", { method: "POST" });
    } catch {
      // Session may already be expired.
    } finally {
      // A full-document navigation tears down the React tree, the auth context and the
      // React Query cache on its own, then re-runs the server `(private)` guard — the same
      // hard-redirect path as `redirectToLogin`. Clearing that client state here first would
      // only repaint the current page with emptied data (a flash of the blank dashboard)
      // before the browser leaves, so we navigate straight away.
      window.location.replace(ROUTES.login.path);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group flex cursor-pointer items-center gap-2.5 rounded-md outline-hidden">
        <span className="grid size-[30px] flex-shrink-0 place-items-center rounded-full border border-line bg-surface-hi text-2xs font-medium text-ink-2">
          {initialsFromEmail(user?.email)}
        </span>
        <span className="hidden max-w-[200px] truncate text-sm text-ink-2 xl:inline">{user?.email}</span>
        <ChevronDown className="size-4 flex-shrink-0 text-ink-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={12}
        className="w-64 p-1"
      >
        <DropdownMenuItem
          onClick={() => router.push(ROUTES.changePassword.path)}
          className="cursor-pointer gap-3 px-3 py-2.5 text-sm text-ink-2"
        >
          <KeyRound className="size-4 text-primary" />
          Modifier le mot de passe
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer gap-3 px-3 py-2.5 text-sm text-ink-2"
        >
          <LogOut className="size-4 text-ink-3" />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
