import { type FocusEvent } from "react";

/**
 * Renders a heading whose line breaks are authored in the content layer as
 * literal "\n", so copy decides its own line rhythm per locale without the
 * component knowing the language.
 */
export function MultilineTitle({ value }: { value: string }) {
  const [first, ...rest] = value.split("\n");
  return (
    <>
      {first}
      {rest.map((line) => (
        <span key={line}>
          <br />
          {line}
        </span>
      ))}
    </>
  );
}

/**
 * Brings a keyboard-focused element into view.
 *
 * `globals.css` sets `scroll-behavior: smooth` on <html>, which would otherwise
 * animate every focus move as the user tabs through a scene — disorienting, and
 * slow enough that focus can appear lost. Scrolling is forced to `auto` for the
 * duration of the jump and then restored, leaving deliberate in-page navigation
 * smooth. The reduced-motion rule in globals.css already pins the global value
 * to `auto`, so restoring the inline style cannot reintroduce motion there.
 */
export function keepFocusVisible(event: FocusEvent<HTMLElement>) {
  const target = event.currentTarget;
  requestAnimationFrame(() => {
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    target.scrollIntoView({ block: "center", inline: "nearest" });
    root.style.scrollBehavior = previous;
  });
}
