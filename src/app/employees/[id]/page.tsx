import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Header from "@/components/ui/Header";
import EmployeeDetail from "./EmployeeDetail";

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const emp = await prisma.employee.findUnique({
    where: { id: params.id },
    include: {
      attendance: { orderBy: [{ year: "desc" }, { month: "desc" }] },
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
      <EmployeeDetail employee={data} />
    </div>
  );
}
