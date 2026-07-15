# Performance and Core Web Vitals

Use this playbook for public-facing websites, marketing pages, product surfaces, content-heavy pages, and release readiness.

## Default Rule

Performance is a default quality layer for public surfaces. Treat Core Web Vitals and responsive behavior as first-class requirements.

## Focus Areas

Check for:

- excessive JavaScript for simple marketing surfaces
- oversized images or video
- blocking resources
- poor font strategy
- layout shift from unstable media or late-loading UI
- heavy above-the-fold sections
- weak mobile rendering behavior

## Default Expectations

Aim for:

- fast initial rendering
- stable layouts
- responsive images and media
- minimal unnecessary client complexity
- sensible lazy loading
- good mobile interaction density

## Design Tradeoff Rule

Do not recommend visually heavy patterns that obviously hurt LCP, CLS, or interaction quality unless the tradeoff is explicit and worth it.

## Release Check

Before calling a public-facing implementation ready, confirm:

- performance expectations were considered
- the design does not sabotage Core Web Vitals
- image and media strategy is intentional
- accessibility and performance are not in conflict
