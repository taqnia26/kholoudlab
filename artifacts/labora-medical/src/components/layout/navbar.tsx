import { Link } from "wouter"
import { Button } from "@/components/ui/button"
import { Phone, Menu, X } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { cn, homeAnchor } from "@/lib/utils"

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const mobileToggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (!mobileMenuOpen) return

    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement as HTMLElement | null
    const focusableSelector =
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        !mobileMenuRef.current?.contains(target) &&
        !mobileToggleRef.current?.contains(target)
      ) {
        setMobileMenuOpen(false)
      }
    }
    const handleMenuKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false)
        return
      }
      if (event.key !== "Tab" || !mobileMenuRef.current) return

      const focusable = Array.from(
        mobileMenuRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleMenuKeyboard)
    document.addEventListener("pointerdown", closeOnOutsideClick)
    window.requestAnimationFrame(() => {
      mobileMenuRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus()
    })

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleMenuKeyboard)
      document.removeEventListener("pointerdown", closeOnOutsideClick)
      previousFocus?.focus()
    }
  }, [mobileMenuOpen])

  const navLinks = [
    { label: "الرئيسية", href: "/" },
    { label: "خدماتنا", anchor: "services" },
    { label: "باقات الفحص", anchor: "packages" },
    { label: "من نحن", href: "/about" },
  ]

  return (
    <header
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300 border-b border-transparent",
        isScrolled || mobileMenuOpen
          ? "bg-background/95 backdrop-blur-md shadow-sm border-border/50 py-3"
          : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 z-50">
            <img 
              src="/assets/kholoud-lab-logo.png" 
              alt="مختبر خلود للتحاليل الطبية | Kholoud Lab" 
              className="h-12 w-auto object-contain"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) =>
              link.anchor ? (
                <a
                  key={link.anchor}
                  href={homeAnchor(link.anchor)}
                  className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href ?? "/"}
                  className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ),
            )}
          </nav>

          {/* Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <a href="tel:+966559070400" className="flex items-center gap-2 text-primary font-medium hover:opacity-80 transition-opacity">
              <span className="font-en text-sm mt-1" dir="ltr">055 907 0400</span>
              <Phone className="h-4 w-4" />
            </a>
            <Button asChild className="rounded-full px-6">
              <a href={homeAnchor("book")}>احجز موعدك</a>
            </Button>
            <Link href="/staff/results" className="text-xs font-bold text-muted-foreground transition-colors hover:text-primary">
              بوابة الموظفين
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            ref={mobileToggleRef}
            type="button"
            aria-label={mobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            className="relative z-50 flex h-11 w-11 items-center justify-center rounded-full border border-primary/15 bg-white/90 text-primary shadow-sm transition-colors hover:bg-primary/5 lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <>
          <button
            type="button"
            aria-label="إغلاق القائمة"
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-[2px] lg:hidden"
          />

          {/* Mobile Menu */}
          <div
            ref={mobileMenuRef}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="القائمة الرئيسية"
            className="fixed inset-x-3 top-[5.5rem] z-40 max-h-[calc(100dvh-6.5rem)] overflow-y-auto rounded-[1.75rem] border border-primary/10 bg-white/95 p-4 shadow-2xl shadow-primary/15 backdrop-blur-xl lg:hidden"
          >
        <div className="mb-3 flex items-center justify-between px-2">
          <p className="text-sm font-bold text-primary">القائمة الرئيسية</p>
          <span className="rounded-full bg-primary/5 px-3 py-1 text-xs font-medium text-muted-foreground">
            مختبر خلود
          </span>
        </div>
        <nav className="grid gap-2">
          {navLinks.map((link) =>
            link.anchor ? (
              <a
                key={link.anchor}
                href={homeAnchor(link.anchor)}
                className="rounded-xl border border-transparent px-4 py-3 text-base font-bold text-foreground transition-colors hover:border-primary/10 hover:bg-primary/5 hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href ?? "/"}
                className="rounded-xl border border-transparent px-4 py-3 text-base font-bold text-foreground transition-colors hover:border-primary/10 hover:bg-primary/5 hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>
        <div className="mt-4 grid gap-3 border-t border-border/60 pt-4">
          <a href="tel:+966559070400" className="flex items-center justify-center gap-2 rounded-xl bg-primary/5 p-3 font-medium text-primary">
            <Phone className="h-5 w-5" />
            <span className="font-en text-lg" dir="ltr">055 907 0400</span>
          </a>
          <Button className="w-full rounded-xl" asChild onClick={() => setMobileMenuOpen(false)}>
            <a href={homeAnchor("book")}>احجز موعدك الآن</a>
          </Button>
          <Link
            href="/staff/results"
            className="pb-1 text-center text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
            onClick={() => setMobileMenuOpen(false)}
          >
            بوابة الموظفين
          </Link>
        </div>
          </div>
        </>
      )}
    </header>
  )
}
