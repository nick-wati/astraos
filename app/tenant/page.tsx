import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function TenantIndexPage() {
  const tenant = await prisma.tenant.findFirst({
    orderBy: {
      name: "asc"
    }
  });

  if (!tenant) {
    redirect("/admin");
  }

  redirect(`/tenant/${tenant.id}`);
}
