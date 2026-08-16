/**
 * Apple-design spring configs for the Drive UI (per emilkowalski/skills apple-design SKILL.md).
 * Damping/response converted to Framer Motion stiffness/damping:
 *   stiffness = (2*pi/response)^2 * mass(=1)
 *   damping   = dampingRatio * 2 * sqrt(stiffness * mass)
 */

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const useDriveMotion = () => {
  const reduced = prefersReducedMotion();
  return {
    reduced,
    // Move/reposition: drag-select box, item settle after drop. damping 1.0, response 0.4s.
    move: reduced ? { duration: 0.15 } : { type: 'spring', stiffness: 247, damping: 31 },
    // Sheet/panel: preview slide-over, trash sheet. damping 0.8, response 0.3s.
    sheet: reduced ? { duration: 0.15 } : { type: 'spring', stiffness: 438, damping: 34 },
    // Hover/tap micro-feedback on grid tiles.
    micro: reduced ? { duration: 0.1 } : { type: 'spring', stiffness: 400, damping: 25 },
    // Instant tap highlight — snappy tween, not a spring (binary state flip).
    tap: { duration: 0.1 },
    // Centered modal (dialogs): scale+fade in place, same "sheet" family
    // timing (damping 0.8, response 0.3s) since it's also an overlay entrance.
    modal: reduced ? { duration: 0.15 } : { type: 'spring', stiffness: 438, damping: 34 },
  };
};

export default useDriveMotion;
