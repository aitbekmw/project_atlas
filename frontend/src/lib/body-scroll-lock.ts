/**
 * Locks document scroll without a layout jump when the scrollbar disappears.
 * Restores the previous inline overflow and padding-right on release.
 */
export function lockBodyScroll(): () => void {
  const body = document.body;
  const html = document.documentElement;
  const scrollbar = Math.max(0, window.innerWidth - html.clientWidth);
  const previousOverflow = body.style.overflow;
  const previousPaddingRight = body.style.paddingRight;
  const previousPaddingRightHtml = html.style.paddingRight;
  const computedPadding = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;

  body.style.overflow = "hidden";
  if (scrollbar > 0) {
    const next = `${computedPadding + scrollbar}px`;
    body.style.paddingRight = next;
    html.style.paddingRight = next;
  }

  return () => {
    body.style.overflow = previousOverflow;
    body.style.paddingRight = previousPaddingRight;
    html.style.paddingRight = previousPaddingRightHtml;
    body.style.removeProperty("pointer-events");
  };
}
