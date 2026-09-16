import { redirect } from "next/navigation";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { hasAdminSession, isAdminSecretConfigured } from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await hasAdminSession()) redirect("/admin");
  return <AdminLogin configured={isAdminSecretConfigured()} />;
}
