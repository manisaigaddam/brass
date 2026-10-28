import Link from "next/link";
import { CreateBillForm } from "@/components/CreateBillForm";
import { Mark } from "@/components/Mark";

export default function NewBillPage() {
  return (
    <main className="desk">
      <Link className="brand" href="/">
        <Mark />
        <strong>Brass</strong>
      </Link>
      <h1>New bill</h1>
      <p className="lede">This creates one payment and closes after it is paid. A second person cannot pay it.</p>
      <CreateBillForm />
    </main>
  );
}
