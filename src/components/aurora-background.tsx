// Fixed, decorative animated backdrop (CSS-driven, no JS) sitting behind all
// content. Pure presentation — hidden from assistive tech.
export function AuroraBackground() {
  return (
    <>
      <div className="aurora" aria-hidden>
        <span />
      </div>
      <div className="aurora-grid" aria-hidden />
    </>
  );
}
