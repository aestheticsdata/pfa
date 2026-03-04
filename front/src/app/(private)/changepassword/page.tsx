"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ChangePassword() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/forgotPassword");
  }, [router]);

  return null;
}

