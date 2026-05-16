"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "react-query";
import { ChevronDown, Key, LogOut } from "lucide-react";
import { useAuth } from "@auth/context/AuthContext";
import useRequestHelper from "@helpers/useRequestHelper";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { ROUTES } from "@components/shared/config/constants";

const UserMenu = () => {
  const { user, clearAuth } = useAuth();
  const queryClient = useQueryClient();
  const { privateRequest } = useRequestHelper();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await privateRequest("/users/logout", { method: "POST" });
    } catch {
      // Session may already be expired.
    } finally {
      queryClient.clear();
      clearAuth();
      window.location.replace(ROUTES.login.path);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="text-gray-400 hover:text-gray-200 text-sm transition-colors flex items-center gap-2 max-w-[180px] sm:max-w-[240px] md:max-w-none outline-hidden">
        <span className="truncate">{user?.email}</span>
        <ChevronDown className="w-4 h-4 flex-shrink-0 transition-transform duration-200 data-[state=open]:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={12}
        className="w-64 bg-[#2a2a2a] border-gray-700/50 shadow-2xl"
      >
        <DropdownMenuItem
          onClick={() => router.push(ROUTES.changePassword.path)}
          className="px-4 py-3 text-gray-200 focus:bg-[#353535] focus:text-gray-100 gap-3 cursor-pointer"
        >
          <Key className="w-4 h-4 text-cyan-500" />
          <span className="text-sm">modifier le mot de passe</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-gray-700/50 my-0" />
        <DropdownMenuItem
          onClick={handleLogout}
          className="px-4 py-3 text-gray-200 focus:bg-[#353535] focus:text-gray-100 gap-3 cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-cyan-500" />
          <span className="text-sm">logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
