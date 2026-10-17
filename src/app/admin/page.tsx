import { AppShell } from "@/components/app-shell";
import { SourceEditor } from "@/components/source-editor";
export default function AdminPage() {
  return (
    <AppShell admin>
      <SourceEditor />
    </AppShell>
  );
}
