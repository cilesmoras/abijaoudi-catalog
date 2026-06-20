/**
 * Decorative animated hero backdrop. Pure CSS (no JS) so it can render inside
 * a Server Component. Sits behind the hero content, ignores pointer events,
 * and is hidden from assistive tech.
 *
 * Inspired by Framer-style hero scenes: soft gradient wash + a scatter of
 * gently floating "objects" — here, the grocery / produce / electronics items
 * a Cataloo catalog is made of.
 *
 * Geometry (position, size, rotation, depth) is set via inline styles rather
 * than Tailwind utilities so the values are guaranteed to apply regardless of
 * JIT class scanning.
 */

type FloatingItem = {
  emoji: string;
  /** Position offsets as CSS values, e.g. "6%". */
  pos: { top?: string; bottom?: string; left?: string; right?: string };
  /** Square chip side length in px. */
  box: number;
  /** Emoji font size in px. */
  font: number;
  /** Static tilt in degrees. */
  rotate: number;
  /** Float animation duration (s) and out-of-phase delay (s). */
  duration: number;
  delay: number;
  /** Depth cues. */
  opacity?: number;
  blur?: number;
  /** Hide on smaller screens to avoid clutter. */
  hide?: "md" | "lg";
};

const floatingItems: FloatingItem[] = [
  // Foreground — crisp, near the edges
  { emoji: "🍎", pos: { left: "6%", top: "20%" }, box: 64, font: 30, rotate: -8, duration: 15, delay: 0 },
  { emoji: "🥦", pos: { left: "11%", top: "58%" }, box: 56, font: 26, rotate: 7, duration: 18, delay: -4 },
  { emoji: "🍌", pos: { right: "7%", top: "18%" }, box: 64, font: 30, rotate: 10, duration: 16, delay: -2 },
  { emoji: "📱", pos: { right: "6%", top: "52%" }, box: 56, font: 26, rotate: -6, duration: 19, delay: -7 },
  // Mid depth — md and up
  { emoji: "🥕", pos: { left: "19%", top: "9%" }, box: 48, font: 22, rotate: -12, duration: 20, delay: -9, opacity: 0.9, hide: "md" },
  { emoji: "🍅", pos: { right: "19%", top: "70%" }, box: 56, font: 26, rotate: 9, duration: 17, delay: -5, hide: "md" },
  { emoji: "🎧", pos: { right: "23%", top: "8%" }, box: 48, font: 22, rotate: 6, duration: 21, delay: -11, opacity: 0.9, hide: "md" },
  { emoji: "🍇", pos: { left: "4%", bottom: "14%" }, box: 48, font: 22, rotate: 8, duration: 22, delay: -13, opacity: 0.85, hide: "md" },
  { emoji: "🥛", pos: { right: "4%", bottom: "16%" }, box: 48, font: 22, rotate: 5, duration: 19, delay: -15, opacity: 0.85, hide: "md" },
  // Far depth — lg only, blurred for parallax
  { emoji: "🥑", pos: { left: "31%", top: "5%" }, box: 44, font: 20, rotate: -10, duration: 23, delay: -3, opacity: 0.7, blur: 1.5, hide: "lg" },
  { emoji: "💻", pos: { right: "33%", bottom: "9%" }, box: 44, font: 20, rotate: -7, duration: 24, delay: -6, opacity: 0.7, blur: 1.5, hide: "lg" },
  { emoji: "🧀", pos: { left: "25%", bottom: "7%" }, box: 44, font: 20, rotate: -9, duration: 20, delay: -8, opacity: 0.7, blur: 1.5, hide: "lg" },
];

const hideClass: Record<NonNullable<FloatingItem["hide"]>, string> = {
  md: "hidden md:block",
  lg: "hidden lg:block",
};

export function HeroBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {/* Soft animated mesh gradient wash — blue → indigo to match the brand icon */}
      <div
        className="animate-aurora-hue absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(40% 50% at 20% 20%, rgba(59,130,246,0.20), transparent 60%)," +
            "radial-gradient(45% 55% at 80% 15%, rgba(79,70,229,0.18), transparent 60%)," +
            "radial-gradient(50% 60% at 60% 80%, rgba(99,102,241,0.16), transparent 60%)",
        }}
      />

      {/* Floating blurred orbs (depth) */}
      <div className="animate-aurora absolute -left-24 top-[-6rem] h-80 w-80 rounded-full bg-blue-400/30 blur-3xl" />
      <div
        className="animate-float absolute right-[-4rem] top-10 h-72 w-72 rounded-full bg-indigo-400/30 blur-3xl"
        style={{ animationDelay: "-6s" }}
      />
      <div
        className="animate-float absolute bottom-[-6rem] left-1/3 h-72 w-72 rounded-full bg-sky-400/25 blur-3xl"
        style={{ animationDelay: "-12s" }}
      />

      {/* Floating grocery / produce / electronics items */}
      {floatingItems.map((item) => (
        <div
          key={item.emoji}
          className={`animate-float absolute ${item.hide ? hideClass[item.hide] : ""}`}
          style={{
            ...item.pos,
            opacity: item.opacity,
            filter: item.blur ? `blur(${item.blur}px)` : undefined,
            animationDuration: `${item.duration}s`,
            animationDelay: `${item.delay}s`,
          }}
        >
          <div
            className="flex items-center justify-center rounded-2xl bg-white/85 shadow-xl shadow-blue-900/10 ring-1 ring-black/5 backdrop-blur"
            style={{
              width: item.box,
              height: item.box,
              fontSize: item.font,
              lineHeight: 1,
              transform: `rotate(${item.rotate}deg)`,
            }}
          >
            <span>{item.emoji}</span>
          </div>
        </div>
      ))}

      {/* Faint grid texture, faded out toward the edges */}
      <div
        className="absolute inset-0 opacity-[0.3]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(15,23,42,0.05) 1px, transparent 1px)," +
            "linear-gradient(to bottom, rgba(15,23,42,0.05) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 35%, black 40%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 35%, black 40%, transparent 80%)",
        }}
      />

      {/* Bottom fade into the page background */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-white" />
    </div>
  );
}
