export type ReleaseEvidenceVerificationMode =
  | "local_smoke"
  | "live_postdeploy";

export type ReleaseEvidenceCheck = {
  id: string;
  title: string;
  count: number;
};

export type ReleaseEvidenceReport = {
  generatedAt: string;
  verificationMode: ReleaseEvidenceVerificationMode;
  targetBaseUrl: string;
  environment: string;
  commitReference: string | null;
  authorityStorage: {
    engine: string;
    durability: string;
  };
  summary: {
    publicRouteChecks: number;
    protectedRouteChecks: number;
    assetChecks: number;
    apiChecks: number;
  };
  checks: ReleaseEvidenceCheck[];
  notes: string[];
};
