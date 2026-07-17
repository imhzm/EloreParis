/**
 * The one rule for whether a catalogue image can be served to the public.
 *
 * It lives on its own because two places have to agree on it and, until this
 * file existed, only one of them knew it.
 *
 * The public projection has always applied it: getPublicCatalogSnapshot drops
 * any media whose URL fails here, then drops any product left with no media at
 * all. That part is right and is what keeps a hostile or malformed URL off the
 * storefront.
 *
 * The catalog authority did NOT apply it. It accepts any string up to 2,000
 * characters as a media URL. So an operator could import a product pointing at
 * an ordinary CDN — `https://cdn.example.com/bottle.jpg`, the most natural thing
 * to write — and every gate would pass: the import validated, readiness reported
 * ready: true, publish returned 200, the ops dashboard showed the catalogue
 * active. And the storefront showed nothing. `available: false`, no product, no
 * error, nowhere to look. Verified by importing exactly that URL through the
 * real ops API.
 *
 * A gate that reports ready for a catalogue that cannot render is worse than no
 * gate. Applying the rule at import turns a silent disappearance into a named
 * issue at the moment someone can still fix it.
 *
 * Local paths only, deliberately. The storefront serves its own images out of
 * /public and next/image is configured for no remote hosts, so a remote URL is
 * not a near-miss to be normalised — it is a record that cannot work here.
 */

export function safePublicMediaUrl(value: string) {
  const normalized = value.trim();
  if (
    normalized.startsWith("/") &&
    !normalized.startsWith("//") &&
    !normalized.includes("\\") &&
    !normalized.split("/").includes("..") &&
    /^\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]+$/.test(normalized)
  ) {
    return normalized;
  }
  return null;
}
