type HostedUrlValidationOptions = {
  requireExplicitHttps?: boolean;
};

function normalizeCandidate(
  candidate: string | null | undefined,
  requireExplicitHttps: boolean,
) {
  const trimmed = candidate?.trim();

  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return requireExplicitHttps ? null : `https://${trimmed}`;
}

function normalizeHostname(hostname: string) {
  return hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, "")
    .replace(/\.$/, "");
}

function isNonPublicIpv4(hostname: string) {
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) {
    return false;
  }

  const [first, second, third] = hostname.split(".").map(Number);

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    first >= 224 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 0 && third === 0) ||
    (first === 192 && second === 0 && third === 2) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    (first === 198 && second === 51 && third === 100) ||
    (first === 203 && second === 0 && third === 113)
  );
}

function isNonPublicIpv6(hostname: string) {
  if (!hostname.includes(":")) {
    return false;
  }

  if (/^(?:fc|fd|fe[89ab])/i.test(hostname)) {
    return true;
  }

  const mappedIpv4 = hostname.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);

  if (!mappedIpv4) {
    return false;
  }

  const high = Number.parseInt(mappedIpv4[1], 16);
  const low = Number.parseInt(mappedIpv4[2], 16);
  const ipv4 = [high >>> 8, high & 0xff, low >>> 8, low & 0xff].join(".");
  return isNonPublicIpv4(ipv4);
}

function isNonPublicHostname(hostname: string) {
  const normalizedHostname = normalizeHostname(hostname);

  if (
    normalizedHostname === "localhost" ||
    normalizedHostname.endsWith(".localhost") ||
    normalizedHostname.endsWith(".local") ||
    normalizedHostname.endsWith(".internal") ||
    normalizedHostname.endsWith(".test") ||
    normalizedHostname.endsWith(".invalid") ||
    normalizedHostname.endsWith(".example") ||
    normalizedHostname === "0.0.0.0" ||
    normalizedHostname === "::" ||
    normalizedHostname === "::1"
  ) {
    return true;
  }

  return (
    (!normalizedHostname.includes(".") && !normalizedHostname.includes(":")) ||
    isNonPublicIpv4(normalizedHostname) ||
    isNonPublicIpv6(normalizedHostname)
  );
}

export function isHostedUrl(
  candidate?: string | null,
  options: HostedUrlValidationOptions = {},
) {
  const normalizedCandidate = normalizeCandidate(
    candidate,
    options.requireExplicitHttps ?? false,
  );

  if (!normalizedCandidate) {
    return false;
  }

  try {
    const parsedUrl = new URL(normalizedCandidate);

    if (
      options.requireExplicitHttps &&
      parsedUrl.protocol !== "https:"
    ) {
      return false;
    }

    return (
      ["http:", "https:"].includes(parsedUrl.protocol) &&
      Boolean(parsedUrl.hostname) &&
      !parsedUrl.username &&
      !parsedUrl.password &&
      !isNonPublicHostname(parsedUrl.hostname)
    );
  } catch {
    return false;
  }
}

export function isHostedHttpsUrl(candidate?: string | null) {
  return isHostedUrl(candidate, { requireExplicitHttps: true });
}
