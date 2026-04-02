export class RequestHardeningError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 403) {
    super(message);
    this.name = "RequestHardeningError";
    this.statusCode = statusCode;
  }
}

function normalizeOriginSet(request: Request) {
  const requestUrl = new URL(request.url);
  const originSet = new Set<string>([requestUrl.origin]);
  const forwardedHost = request.headers.get("x-forwarded-host")?.trim();
  const hostHeader = forwardedHost || request.headers.get("host")?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.trim();
  const protocol = forwardedProto || requestUrl.protocol.slice(0, -1);

  if (hostHeader) {
    originSet.add(`${protocol}://${hostHeader}`);
  }

  return originSet;
}

function isLoopbackHostname(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  );
}

function isEquivalentLoopbackOrigin(
  candidateOrigin: string,
  requestOrigins: Set<string>,
) {
  try {
    const candidateUrl = new URL(candidateOrigin);

    if (!isLoopbackHostname(candidateUrl.hostname)) {
      return false;
    }

    return Array.from(requestOrigins).some((requestOrigin) => {
      const requestUrl = new URL(requestOrigin);

      return (
        isLoopbackHostname(requestUrl.hostname) &&
        requestUrl.protocol === candidateUrl.protocol &&
        requestUrl.port === candidateUrl.port
      );
    });
  } catch {
    return false;
  }
}

function matchesRequestOrigin(candidate: string | null, requestOrigins: Set<string>) {
  if (!candidate) {
    return false;
  }

  try {
    const normalizedCandidateOrigin = new URL(candidate).origin;
    return (
      requestOrigins.has(normalizedCandidateOrigin) ||
      isEquivalentLoopbackOrigin(normalizedCandidateOrigin, requestOrigins)
    );
  } catch {
    return false;
  }
}

export function assertTrustedMutationRequest(request: Request) {
  const requestOrigins = normalizeOriginSet(request);
  const originHeader = request.headers.get("origin");

  if (originHeader) {
    if (matchesRequestOrigin(originHeader, requestOrigins)) {
      return;
    }

    throw new RequestHardeningError(
      "This mutation request did not come from a trusted same-origin surface.",
    );
  }

  const refererHeader = request.headers.get("referer");

  if (matchesRequestOrigin(refererHeader, requestOrigins)) {
    return;
  }

  const fetchSiteHeader = request.headers.get("sec-fetch-site");

  if (fetchSiteHeader === "same-origin" || fetchSiteHeader === "same-site") {
    return;
  }

  throw new RequestHardeningError(
    "The request origin could not be verified for this protected mutation.",
  );
}
