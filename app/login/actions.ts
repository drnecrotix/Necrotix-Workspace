"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminCookie } from "@/lib/admin-auth";

export async function login(formData: FormData) {
  const configuredKey = process.env.ADMIN_ACCESS_KEY;
  const submittedKey = formData.get("accessKey");
  if (!configuredKey || configuredKey.length < 24 || submittedKey !== configuredKey) redirect("/login?error=invalid");
  (await cookies()).set("nw-admin", adminCookie(configuredKey), { httpOnly:true, secure:process.env.NODE_ENV === "production", sameSite:"strict", path:"/", maxAge:60*60*8 });
  redirect("/dashboard");
}
