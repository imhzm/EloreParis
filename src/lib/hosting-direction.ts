import "server-only";

export type HostingDirection = {
  primaryProvider: "hostinger_vps";
  primaryServiceType: "systemd_node_service";
  runtimeArtifact: "next_standalone";
  persistenceStrategy: "persistent_disk";
  persistencePath: string;
  reverseProxy: "nginx";
  optionalSecondaryPath: "manual_preview_workflow";
};

const hostingDirection: HostingDirection = {
  primaryProvider: "hostinger_vps",
  primaryServiceType: "systemd_node_service",
  runtimeArtifact: "next_standalone",
  persistenceStrategy: "persistent_disk",
  persistencePath: "/var/lib/elore-paris",
  reverseProxy: "nginx",
  optionalSecondaryPath: "manual_preview_workflow",
};

export function getHostingDirection() {
  return hostingDirection;
}
