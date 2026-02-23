"use client";

import { useEffect, useRef, useState } from "react";
import { useUserStore } from "@auth/store/userStore";
import axios from "axios";
import dynamic from "next/dynamic";

const LoginPage = dynamic(() => import("@app/login/page"), { ssr: false });

function getApiBase() {
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return process.env.NEXT_PUBLIC_REMOTE_HOST_FROM_LOCALHOST ?? "";
  }
  return "";
}

export default function Auth({ children }: { children: React.ReactNode }) {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [checked, setChecked] = useState(!!user);
  const didCheck = useRef(false);

  useEffect(() => {
    if (user || checked || didCheck.current) return;
    didCheck.current = true;

    axios
      .get(`${getApiBase()}/api/users/me`, { withCredentials: true })
      .then((res) => {
        if (res.data?.user) {
          setUser(res.data.user);
        }
      })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, [user, checked, setUser]);

  if (user) {
    return <>{children}</>;
  }

  if (!checked) {
    return null;
  }

  return <LoginPage />;
}
