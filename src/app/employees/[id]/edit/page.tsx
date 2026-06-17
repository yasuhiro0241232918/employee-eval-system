import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Header from "@/components/ui/Header";
import EmployeeForm from "../../EmployeeForm";

export default async function EditEmployeePage({ params }: { params: { id: string } }) {
  const emp = await prisma.employee.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, birthDate: true, joinDate: true, department: true, position: true, grade: true, gradeNumber: true, photo: true },
  });
  if (!emp) notFound();

  const employee = {
    ...emp,
    birthDate: emp.birthDate?.toISOString() ?? null,
    joinDate: emp.joinDate?.toISOString() ?? null,
  };

  return (
    <div>
      <Header />
      <main className="max-w-2xl mx-auto px-6 py-6">
        <EmployeeForm employee={employee} />
      </main>
    </div>
  );
}
