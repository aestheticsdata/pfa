"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ChangePassword() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/forgotPassword");
  }, [router]);

  return null;
}
