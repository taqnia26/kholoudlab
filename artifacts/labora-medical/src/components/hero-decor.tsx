import { Dna, Droplet, FlaskConical, HeartPulse, Microscope, type LucideIcon } from "lucide-react"

const BUBBLES: Array<{ Icon: LucideIcon; className: string; delay: string; size: string }> = [
  { Icon: Droplet, className: "top-[4%] right-[8%]", delay: "0s", size: "h-16 w-16" },
  { Icon: Dna, className: "top-[16%] left-[10%]", delay: "-2.5s", size: "h-14 w-14" },
  { Icon: FlaskConical, className: "top-[56%] left-[8%]", delay: "-4.5s", size: "h-12 w-12" },
  { Icon: Microscope, className: "top-[2%] left-[44%]", delay: "-1.5s", size: "h-12 w-12" },
  { Icon: HeartPulse, className: "top-[30%] left-[2%]", delay: "-3.5s", size: "h-11 w-11" },
]

const DOTS = [
  "top-[10%] right-[30%]", "top-[24%] right-[4%]", "top-[8%] left-[28%]", "top-[40%] left-[22%]", "top-[20%] right-[56%]", "top-[46%] right-[14%]",
]

/** Decorative, non-interactive backdrop for the hero text column (desktop only). */
export function HeroDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute -inset-x-6 -top-12 bottom-0 z-0 hidden lg:block">
      <span className="hero-orb absolute -top-6 right-0 h-72 w-72 bg-primary/25" />
      <span className="hero-orb absolute left-6 top-40 h-56 w-56 bg-[#7c3aed]/20" style={{ animationDelay: "-6s" }} />

      <svg className="absolute right-[-6%] top-[-4%] h-[26rem] w-[26rem] text-primary" viewBox="0 0 400 400" fill="none">
        <circle cx="200" cy="200" r="150" stroke="currentColor" strokeOpacity="0.14" strokeWidth="1.5" />
        <circle className="hero-ring-spin" cx="200" cy="200" r="185" stroke="currentColor" strokeOpacity="0.28" strokeWidth="1.5" strokeDasharray="3 14" strokeLinecap="round" />
        <circle className="hero-ring-spin-rev" cx="200" cy="200" r="110" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1.5" strokeDasharray="40 22" strokeLinecap="round" />
      </svg>

      {DOTS.map((position, index) => (
        <span key={position} className={`hero-dot absolute h-2 w-2 rounded-full bg-primary/50 ${position}`} style={{ animationDelay: `${-index * 0.9}s` }} />
      ))}

      {BUBBLES.map(({ Icon, className, delay, size }) => (
        <span
          key={className}
          className={`hero-float absolute flex items-center justify-center rounded-2xl border border-white/80 bg-white/60 text-primary shadow-lg shadow-primary/10 backdrop-blur-md ${size} ${className}`}
          style={{ animationDelay: delay }}
        >
          <Icon className="h-1/2 w-1/2" strokeWidth={1.75} />
        </span>
      ))}
    </div>
  )
}

/** Animated heartbeat line shown under the hero call to action. */
export function HeroPulseLine() {
  return (
    <div aria-hidden="true" className="relative z-10 mt-16 hidden max-w-xl lg:block">
      <svg viewBox="0 0 600 90" className="h-24 w-full text-primary" fill="none" preserveAspectRatio="none">
        <path d="M0 45 H170 L195 45 L215 12 L245 78 L270 28 L288 45 H600" stroke="currentColor" strokeOpacity="0.14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path className="hero-ecg" d="M0 45 H170 L195 45 L215 12 L245 78 L270 28 L288 45 H600" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" pathLength="100" />
      </svg>
    </div>
  )
}
