import { redirect } from "next/navigation";

export default function AccountIndexPage() {
  redirect("/me/listings");
}
