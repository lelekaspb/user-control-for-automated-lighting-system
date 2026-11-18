import Link from "next/link";
import { getAuthMode, isLoggedIn } from "@/lib/auth";
import { logout } from "./login/actions";

// Reads the session cookie, so it must be rendered inside <Suspense>.
export default async function AuthNav() {
  if (getAuthMode() === "open") return null;
  if (await isLoggedIn()) {
    return (
      <form action={logout} className="ml-auto">
        <button type="submit">Log out</button>
      </form>
    );
  }
  return (
    <Link href="/login" className="ml-auto">
      Log in
    </Link>
  );
}
