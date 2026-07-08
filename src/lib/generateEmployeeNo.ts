import { prisma } from "@/lib/prisma";

export async function generateEmployeeNo(): Promise<string> {
  const employees = await prisma.employee.findMany({
    where: { employeeNo: { not: null } },
    select: { employeeNo: true },
  });

  const max = employees.reduce((acc, e) => {
    const n = parseInt(e.employeeNo ?? "0", 10);
    return isNaN(n) ? acc : Math.max(acc, n);
  }, 0);

  const next = max + 1;
  return String(next).padStart(3, "0");
}
