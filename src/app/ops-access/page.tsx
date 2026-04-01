import { cookies } from "next/headers";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OpsAccessSurface } from "@/components/ops-access-surface";
import { StorefrontShell } from "@/components/storefront-shell";
import {
  getOpsAccessConfig,
  OPS_SESSION_COOKIE,
  sanitizeOpsNextPath,
  verifyOpsSessionToken,
} from "@/lib/ops-access";

type OpsAccessPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export const metadata: Metadata = {
  title: "الدخول الداخلي إلى ops",
  description:
    "بوابة داخلية تضبط الوصول إلى أسطح التشغيل والكتالوج والطلبات داخل مشروع Cozmateks.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function OpsAccessPage({
  searchParams,
}: OpsAccessPageProps) {
  const { next } = await searchParams;
  const nextPath = sanitizeOpsNextPath(next);
  const accessConfig = getOpsAccessConfig();
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(OPS_SESSION_COOKIE)?.value;

  if (
    accessConfig.mode === "protected" &&
    sessionToken &&
    (await verifyOpsSessionToken(sessionToken, accessConfig.accessCode))
  ) {
    redirect(nextPath);
  }

  return (
    <StorefrontShell activeHref="">
      <OpsAccessSurface accessMode={accessConfig.mode} nextPath={nextPath} />
    </StorefrontShell>
  );
}
