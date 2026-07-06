import Header from "@/components/ui/Header";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ImportForm from "./ImportForm";

export default async function ImportPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "staff";
  if (role !== "admin") redirect("/employees");

  return (
    <div>
      <Header />
      <main className="max-w-2xl mx-auto px-6 py-6">
        <ImportForm />
      </main>
    </div>
  );
}
