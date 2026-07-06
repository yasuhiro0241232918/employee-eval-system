import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Header from "@/components/ui/Header";
import EmployeeForm from "../../EmployeeForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function EditEmployeePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "staff";
  if (role !== "admin") redirect(`/employees/${params.id}`);

  const emp = await prisma.employee.findUnique({
    where: { id: params.id },
    select: { id: true, employeeNo: true, name: true, birthDate: true, joinDate: true, department: true, position: true, grade: true, gradeNumber: true, company: true, address: true, photo: true },
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
