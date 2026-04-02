export type ReleaseEvidenceCheck = {
  id: string;
  title: string;
  count: number;
};

export type ReleaseEvidenceReport = {
  generatedAt: string;
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
};
