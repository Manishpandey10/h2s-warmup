import { AppShell } from "@/components/app-shell";
import { AdminCredentials } from "@/components/admin-login";

export const dynamic = "force-dynamic";
export default function AdminLoginPage() {
  return (
    <>
      <AppShell loginOnly admin />
      <div className="container narrow">
        <AdminCredentials
          email={process.env.ADMIN_TEST_EMAIL ?? ""}
          password={process.env.ADMIN_TEST_PASSWORD ?? ""}
        />
      </div>
    </>
  );
}
