# Lifecycle email provider decision

Status: implementation-ready, provider disabled. Reviewed 2026-07-15.

## Decision

- Primary: AWS SES in `me-south-1` (Bahrain).
- Fallback: Mailgun EU region.
- Keep consent, suppression, delivery evidence, and retry authority in the local ÉLORÉ database.
- Do not enable provider or lifecycle-delivery flags until the privacy owner approves the cross-border transfer assessment and the sending domain passes authentication checks.

## Why AWS SES is primary

- It lets operations pin sending to a documented AWS Region; Bahrain is the closest currently documented SES region to Saudi Arabia.
- It supports custom MAIL FROM/SPF, DKIM, DMARC alignment, regional suppression, and event delivery through SNS.
- Its usage model is pay-as-you-go and fits a worker/outbox architecture without coupling application consent to the provider.

Official references:

- SES regions and endpoints: https://docs.aws.amazon.com/general/latest/gr/ses.html
- SES regional differences: https://docs.aws.amazon.com/ses/latest/dg/regions.html
- Custom MAIL FROM and SPF: https://docs.aws.amazon.com/ses/latest/dg/mail-from.html
- DMARC: https://docs.aws.amazon.com/ses/latest/dg/send-email-authentication-dmarc.html
- SNS signature verification: https://docs.aws.amazon.com/sns/latest/dg/sns-verify-signature-of-message.html
- SES pricing: https://aws.amazon.com/ses/pricing/
- AWS region and privacy control: https://aws.amazon.com/compliance/data-privacy-faq/

## Fallback boundary

Mailgun EU is the fallback only after its EU endpoint is explicitly selected. Its documentation provides regional API endpoints, HMAC webhook verification, and suppression resources.

- Regions: https://documentation.mailgun.com/docs/mailgun/api-reference/api-overview
- Webhook verification: https://documentation.mailgun.com/docs/mailgun/user-manual/webhooks/securing-webhooks
- Bounces: https://documentation.mailgun.com/docs/mailgun/api-reference/send/mailgun/bounces
- Unsubscribes: https://documentation.mailgun.com/docs/mailgun/user-manual/tracking-messages/tracking-unsubscribes

## Release requirements

1. Approve the processor and cross-border transfer assessment under the Saudi privacy process.
2. Verify `elore-paris.com`, DKIM, SPF/custom MAIL FROM, and DMARC in monitoring mode before enforcement.
3. Move the provider account out of sandbox only after recipient and complaint handling tests pass.
4. Store provider credentials in the Hostinger environment only; never in Git or browser code.
5. Verify signed provider events, timestamp/replay protection, bounce/complaint suppression, and provider-message correlation.
6. Retry only confirmed pre-accept failures. An ambiguous provider response must be reconciled by provider message id or event evidence before another send.
7. Keep `LIFECYCLE_DELIVERY_ENABLED=false` and `LIFECYCLE_DELIVERY_PROVIDER_ENABLED=false` until the release decision is recorded.

## Data minimization

- Send only the destination, locale, template data, and unsubscribe URL required for the message.
- Never include payment data, order secrets, access tokens, internal payloads, or unnecessary profile data.
- Treat provider acceptance as `accepted`, not proof of inbox delivery. Delivery, bounce, and complaint are separate signed event facts.
