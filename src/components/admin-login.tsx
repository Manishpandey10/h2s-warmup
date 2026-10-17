"use client";

import { useLanguage } from "./language-provider";
import { featureCopy } from "@/lib/feature-copy";
export function AdminCredentials({ email, password }: { email: string; password: string }) {
  const { language } = useLanguage(); const c = featureCopy(language);
  return <section className="card credentials" aria-labelledby="credentials-heading"><h2 id="credentials-heading">{c.testCredentials}</h2>
    {email && password ? <dl><dt>{c.email}</dt><dd><code>{email}</code></dd><dt>{c.password}</dt><dd><code>{password}</code></dd></dl> : <p>{c.adminTestMissing}</p>}
    <p className="hint">{c.adminTestHint}</p>
  </section>;
}
