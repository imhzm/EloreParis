# Event Design Checklist

## Questions First

- What business or product question will this answer?
- What exact conversion or activation step matters?
- Which dimensions are actually needed later?

## Event Set

- Entry view or entry source
- Intent click or start action
- Submit or transition event
- Success event
- Failure event when it changes triage or conversion analysis

## Properties

- Keep names stable and machine-friendly.
- Prefer enums or bounded values over raw free text.
- Avoid sensitive data and large payloads.

## Verification

- No duplicate firing
- Works on mobile and desktop
- Success and error paths both observable
- Event names match existing taxonomy
