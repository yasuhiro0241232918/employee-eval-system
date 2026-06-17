import Header from "@/components/ui/Header";
import EmployeeForm from "../EmployeeForm";

export default function NewEmployeePage() {
  return (
    <div>
      <Header />
      <main className="max-w-2xl mx-auto px-6 py-6">
        <EmployeeForm />
      </main>
    </div>
  );
}
