import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAdminCookie } from "@/lib/admin-auth";

export default async function DashboardLayout({children}:{children:React.ReactNode}) {
  const secret = process.env.ADMIN_ACCESS_KEY ?? "";
  const cookie = (await cookies()).get("nw-admin")?.value;
  if (!verifyAdminCookie(cookie, secret)) redirect("/login");
  return children;
}
