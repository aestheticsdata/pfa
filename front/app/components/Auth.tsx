"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@auth/store/userStore";

export default function Auth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !user) {
      router.push("/login");
    }
  }, [user, router, isMounted]);

  if (!isMounted) {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

