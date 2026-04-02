import { cookies } from "next/headers";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OpsAccessSurface } from "@/components/ops-access-surface";
import { StorefrontShell } from "@/components/storefront-shell";
import {
  canRoleAccessOpsPath,
  getDefaultOpsPathForRole,
  getOpsAccessConfig,
  OPS_SESSION_COOKIE,
  sanitizeOpsNextPath,
  verifyOpsSessionToken,
} from "@/lib/ops-access";

type OpsAccessPageProps = {
  searchParams: Promise<{
    denied?: string;
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
  const { next, denied } = await searchParams;
  const nextPath = sanitizeOpsNextPath(next);
  const accessConfig = getOpsAccessConfig();
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(OPS_SESSION_COOKIE)?.value;

  const session = (
    accessConfig.mode === "protected" &&
    sessionToken &&
    (await verifyOpsSessionToken(sessionToken, accessConfig))
  ) || null;

  if (session) {
    redirect(
      canRoleAccessOpsPath(session.role, nextPath)
        ? nextPath
        : getDefaultOpsPathForRole(session.role),
    );
  }

  return (
    <StorefrontShell activeHref="">
      <OpsAccessSurface
        accessMode={accessConfig.mode}
        primaryAuthMethod={accessConfig.primaryAuthMethod}
        supportsAccessCodeAuth={accessConfig.supportsAccessCodeAuth}
        supportsIdentityAuth={accessConfig.supportsIdentityAuth}
        nextPath={nextPath}
        deniedPath={denied}
      />
    </StorefrontShell>
  );
}
