"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "react-query";
import {
  faSignOutAlt,
  faKey,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from "@auth/context/AuthContext";
import useRequestHelper from "@helpers/useRequestHelper";
import Dropdown from '@components/common/dropdown/Dropdown';
import UserMenuContent from './UserMenuContent';


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
      window.location.replace("/login");
    }
  };

  const listItems = [
    {
      id: "changepassword",
      label: "modifier le mot de passe",
      icon: faKey,
      callback: () => router.push("/changepassword"),
    },
    {
      id: "logout",
      label: "logout",
      icon: faSignOutAlt,
      callback: handleLogout,
    },
  ];

  return (
    <div className="mr-8 cursor-pointer bg-transparent">
      <Dropdown>
        <span className="whitespace-nowrap block overflow-hidden text-ellipsis">{user?.email}</span>
        <UserMenuContent listItems={listItems} />
      </Dropdown>
    </div>
  )
};

export default UserMenu;
