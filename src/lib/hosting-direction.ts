import "server-only";

export type HostingDirection = {
  primaryProvider: "render";
  primaryServiceType: "web";
  runtimeArtifact: "next_standalone";
  persistenceStrategy: "persistent_disk";
  persistencePath: string;
  optionalSecondaryPath: "manual_vercel_workflow";
};

const hostingDirection: HostingDirection = {
  primaryProvider: "render",
  primaryServiceType: "web",
  runtimeArtifact: "next_standalone",
  persistenceStrategy: "persistent_disk",
  persistencePath: "/var/data",
  optionalSecondaryPath: "manual_vercel_workflow",
};

export function getHostingDirection() {
  return hostingDirection;
}
