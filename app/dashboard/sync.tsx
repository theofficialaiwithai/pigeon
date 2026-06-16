"use client";

import { useEffect } from "react";

export function TeacherSync() {
  useEffect(() => {
    fetch("/api/auth/sync", { method: "POST" });
  }, []);

  return null;
}
