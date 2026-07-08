import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Header from "@/components/ui/Header";
import EmployeeDetail from "./EmployeeDetail";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "staff";

  const emp = await prisma.employee.findUnique({
    where: { id: params.id },
    include: {
      qualifications: { orderBy: { createdAt: "asc" } },
      experiences: { orderBy: { createdAt: "asc" } },
      accidents: { orderBy: { date: "desc" } },
      memos: { orderBy: { date: "desc" } },
      interviews: { orderBy: { date: "desc" } },
      aiEvaluations: { orderBy: { evaluatedAt: "desc" } },
    },
  });
  if (!emp) notFound();

  const data = JSON.parse(JSON.stringify(emp));
  return (
    <div>
      <Header />
      <EmployeeDetail employee={data} role={role} />
    </div>
  );
}
