const GLYPHS: Array<{ char: string; className: string; delay: string; size: string }> = [
  { char: "؟", className: "top-[8%] right-[6%]", delay: "0s", size: "text-7xl" },
  { char: "?", className: "top-[30%] right-[16%]", delay: "-3s", size: "text-4xl" },
  { char: "؟", className: "bottom-[14%] right-[4%]", delay: "-6s", size: "text-6xl" },
  { char: "?", className: "top-[10%] left-[8%]", delay: "-2s", size: "text-5xl" },
  { char: "؟", className: "top-[44%] left-[3%]", delay: "-5s", size: "text-8xl" },
  { char: "?", className: "bottom-[10%] left-[14%]", delay: "-8s", size: "text-4xl" },
]

const BUBBLES = [
  "right-[12%] bottom-[6%] h-3 w-3", "right-[22%] bottom-[2%] h-2 w-2", "left-[10%] bottom-[4%] h-4 w-4",
  "left-[24%] bottom-[0%] h-2 w-2", "right-[3%] bottom-[30%] h-2.5 w-2.5", "left-[4%] bottom-[34%] h-3 w-3",
]

/** Decorative animated backdrop for the FAQ section. Non-interactive. */
export function FaqDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="faq-grid absolute inset-0" />
      <span className="hero-orb absolute -right-24 top-6 h-80 w-80 bg-primary/20" />
      <span className="hero-orb absolute -left-24 bottom-0 h-72 w-72 bg-[#7c3aed]/15" style={{ animationDelay: "-5s" }} />
      <span className="hero-orb absolute left-1/2 top-1/3 h-56 w-56 -translate-x-1/2 bg-[#d6427f]/10" style={{ animationDelay: "-9s" }} />

      {GLYPHS.map(({ char, className, delay, size }, index) => (
        <span key={index} className={`faq-glyph absolute hidden select-none font-extrabold text-primary/15 md:block ${size} ${className}`} style={{ animationDelay: delay }}>
          {char}
        </span>
      ))}

      {BUBBLES.map((className, index) => (
        <span key={className} className={`faq-bubble absolute rounded-full border border-primary/30 bg-primary/10 ${className}`} style={{ animationDelay: `${-index * 1.7}s` }} />
      ))}
    </div>
  )
}
