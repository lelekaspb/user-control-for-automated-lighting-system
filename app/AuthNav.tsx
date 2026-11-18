import Link from "next/link";
import { getAuthMode, isLoggedIn } from "@/lib/auth";
import Icon from "./components/Icon";
import { logout } from "./login/actions";

// Reads the session cookie, so it must be rendered inside <Suspense>.
export default async function AuthNav() {
  if (getAuthMode() === "open") return null;
  if (await isLoggedIn()) {
    return (
      <form action={logout}>
        <button type="submit" className="nav-item w-full border-0 bg-transparent text-left">
          <Icon name="logOut" />
          <span>Log out</span>
        </button>
      </form>
    );
  }
  return (
    <Link href="/login" className="nav-item">
      <Icon name="logIn" />
      <span>Log in</span>
    </Link>
  );
}
