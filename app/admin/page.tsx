import { AdminShell } from "@/components/admin/AdminShell";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/server/admin-auth";
import { getAllKnowledgeForAdmin } from "@/lib/server/knowledge-store";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await hasAdminSession())) redirect("/admin/login");
  return <AdminShell initialEntries={getAllKnowledgeForAdmin()} />;
}
