"use client";

import { useEffect } from "react";

export function TeacherSync() {
  useEffect(() => {
    fetch("/api/auth/sync", { method: "POST" })
      .then((res) => res.json())
      .then((teacher) => {
        if (teacher && teacher.id) {
          pendo.identify({
            visitor: {
              id: teacher.id,
              email: teacher.email,
              full_name: teacher.name,
              clerkUserId: teacher.clerkUserId,
              timezone: teacher.timezone,
              createdAt: teacher.createdAt,
            },
          });
        }
      });
  }, []);

  return null;
}
