import React, { useEffect, useMemo, useRef, useState } from "react";
import { slides } from "./data/slides";
import { writingPassage } from "./data/writingPassage";

const AUTO_ADVANCE_MS = 9000;
const STAR_COUNT = 180;

const STAR_COLORS = [
  "rgba(255, 255, 255,",       // white
  "rgba(200, 220, 255,",       // blue-white
  "rgba(170, 200, 255,",       // cool blue
  "rgba(255, 240, 220,",       // warm white
  "rgba(255, 210, 180,",       // orange tint
];

function makeStars(count) {
  return Array.from({ length: count }, (_, index) => {
    const rand = Math.random();
    // most stars are tiny, few are bright — realistic distribution
    const isBright = rand > 0.92;
    const isMedium = rand > 0.7 && rand <= 0.92;
    const size = isBright ? 2.2 + Math.random() * 1.8 : isMedium ? 1.2 + Math.random() * 1 : 0.6 + Math.random() * 0.8;
    const baseOpacity = isBright ? 0.6 + Math.random() * 0.3 : isMedium ? 0.25 + Math.random() * 0.2 : 0.08 + Math.random() * 0.15;
    const color = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];

    return {
      id: `star-${index}`,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size,
      baseOpacity,
      color,
      isBright,
      twinkleDuration: isBright ? 2.5 + Math.random() * 3 : 4 + Math.random() * 6,
      twinkleDelay: Math.random() * 8
    };
  });
}

function buildLinkProps(slide) {
  if (slide.external) {
    return {
      href: slide.href,
      target: "_blank",
      rel: "noopener noreferrer"
    };
  }

  return {
    href: slide.href
  };
}

function App() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [missionOpen, setMissionOpen] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: -100, y: -100 });
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const autoTimerRef = useRef(null);
  const closeButtonRef = useRef(null);
  const aboutLayerRef = useRef(null);
  const pointerFrameRef = useRef(0);
  const pillShellRef = useRef(null);
  const pillItemRefs = useRef([]);
  const dragStartRef = useRef({ x: 0, index: 0 });
  const activeSlide = slides[activeIndex];
  const aboutStars = useMemo(() => makeStars(STAR_COUNT), []);
  const fragmentTimings = useMemo(
    () => writingPassage.map(() => ({
      duration: 6 + Math.random() * 8,
      delay: Math.random() * -14
    })),
    []
  );

  const ctaProps = useMemo(() => buildLinkProps(activeSlide), [activeSlide]);

  useEffect(() => {
    function runCycle() {
      setActiveIndex((current) => (current + 1) % slides.length);
    }

    autoTimerRef.current = window.setInterval(runCycle, AUTO_ADVANCE_MS);

    return () => {
      if (autoTimerRef.current !== null) {
        window.clearInterval(autoTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    function handleOverlayKeys(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableSelectors = [
        "button:not([disabled])",
        "a[href]",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        "[tabindex]:not([tabindex='-1'])"
      ];

      const focusableElements = Array.from(
        document.querySelectorAll(focusableSelectors.join(","))
      ).filter((item) => item.closest(".menu-overlay"));

      if (!focusableElements.length) {
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleOverlayKeys);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleOverlayKeys);
    };
  }, [menuOpen]);

  function selectSlide(index) {
    setActiveIndex(index);
    if (autoTimerRef.current !== null) {
      window.clearInterval(autoTimerRef.current);
    }
    autoTimerRef.current = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, AUTO_ADVANCE_MS);
  }

  function closeOverlay(event) {
    if (event.target === event.currentTarget) {
      setMenuOpen(false);
    }
  }

  function updateCursorPosition(event) {
    const bounds = aboutLayerRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;

    if (pointerFrameRef.current) {
      window.cancelAnimationFrame(pointerFrameRef.current);
    }

    pointerFrameRef.current = window.requestAnimationFrame(() => {
      setCursorPosition({ x, y });
      pointerFrameRef.current = 0;
    });
  }

  function resetCursorPosition() {
    if (pointerFrameRef.current) {
      window.cancelAnimationFrame(pointerFrameRef.current);
      pointerFrameRef.current = 0;
    }
    setCursorPosition({ x: -100, y: -100 });
  }

  useEffect(() => {
    return () => {
      if (pointerFrameRef.current) {
        window.cancelAnimationFrame(pointerFrameRef.current);
      }
    };
  }, []);

  // Force re-render after mount so indicator gets initial position
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  function getIndicatorStyle() {
    if (!mounted) return { opacity: 0 };
    const el = pillItemRefs.current[activeIndex];
    if (!el) return { opacity: 0 };
    const shell = pillShellRef.current;
    if (!shell) return { opacity: 0 };
    const shellRect = shell.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const left = elRect.left - shellRect.left;
    const top = elRect.top - shellRect.top;
    return {
      width: elRect.width,
      height: elRect.height,
      transform: `translate(${left + dragOffset}px, ${top}px)`,
      transition: isDragging ? "none" : "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      opacity: 1
    };
  }

  function handleShellPointerDown(event) {
    // Only start drag, don't interfere with clicks
    const shell = pillShellRef.current;
    if (!shell) return;
    event.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: event.clientX, index: activeIndex };
    setDragOffset(0);

    function onMove(e) {
      const dx = e.clientX - dragStartRef.current.x;

      // Clamp drag to shell bounds
      const shellRect = shell.getBoundingClientRect();
      const firstEl = pillItemRefs.current[0];
      const lastEl = pillItemRefs.current[slides.length - 1];
      if (!firstEl || !lastEl) return;
      const currentEl = pillItemRefs.current[dragStartRef.current.index];
      const currentLeft = currentEl.getBoundingClientRect().left - shellRect.left;
      const minX = (firstEl.getBoundingClientRect().left - shellRect.left) - currentLeft;
      const maxX = (lastEl.getBoundingClientRect().left - shellRect.left) - currentLeft;
      setDragOffset(Math.max(minX, Math.min(maxX, dx)));
    }

    function onUp(e) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setIsDragging(false);
      setDragOffset(0);

      // Find closest pill to where indicator ended up
      const shellRect = shell.getBoundingClientRect();
      const currentEl = pillItemRefs.current[dragStartRef.current.index];
      const currentCenter = currentEl.getBoundingClientRect().left + currentEl.getBoundingClientRect().width / 2 - shellRect.left;
      const dx = e.clientX - dragStartRef.current.x;
      const dropCenter = currentCenter + dx;

      let closest = 0;
      let closestDist = Infinity;
      slides.forEach((_, i) => {
        const el = pillItemRefs.current[i];
        if (!el) return;
        const elCenter = el.getBoundingClientRect().left + el.getBoundingClientRect().width / 2 - shellRect.left;
        const dist = Math.abs(elCenter - dropCenter);
        if (dist < closestDist) {
          closestDist = dist;
          closest = i;
        }
      });

      if (closest !== dragStartRef.current.index) {
        selectSlide(closest);
      }
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <>
      <div className={`site-shell slide-${activeSlide.visual}`}>
        <header className="site-topbar">
          <a href="/" className="brand-mark" aria-label="Home">
            <img src="/images/BTN.png" alt="Brandon Nova logo" />
          </a>
          <button
            type="button"
            className="menu-toggle"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>
        </header>

        <main>
          <section className="hero" aria-label="Slide showcase">
            <div className="slide-background" aria-hidden="true">
              <div
                className="about-layer"
                ref={aboutLayerRef}
                onPointerMove={updateCursorPosition}
                onPointerLeave={resetCursorPosition}
              >
                <div className="starfield">
                  {aboutStars.map((star) => {
                    const dx = star.x - cursorPosition.x;
                    const dy = star.y - cursorPosition.y;
                    const distance = Math.hypot(dx, dy);
                    const influence = Math.max(0, 1 - distance / 22);
                    const opacity = Math.min(1, star.baseOpacity + influence * 0.85);
                    const dimOpacity = Math.max(0.04, star.baseOpacity * 0.4);
                    const scale = 1 + influence * 0.6;
                    const glowSize = star.isBright ? Math.round(4 + influence * 8) : Math.round(2 + influence * 4);

                    return (
                      <span
                        key={star.id}
                        className={`star${star.isBright ? " star-bright" : ""}`}
                        style={{
                          left: `${star.x}%`,
                          top: `${star.y}%`,
                          width: `${star.size}px`,
                          height: `${star.size}px`,
                          "--star-dim": dimOpacity,
                          "--star-bright": opacity,
                          background: `${star.color} ${opacity})`,
                          boxShadow: `0 0 ${glowSize}px ${star.color} ${opacity * 0.6})`,
                          transform: `translate(-50%, -50%) scale(${scale})`,
                          animationDuration: `${star.twinkleDuration}s`,
                          animationDelay: `${star.twinkleDelay}s`
                        }}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="writing-layer">
                <div className="writing-overlay" />
                <div className="writing-wall">
                  {writingPassage.map((line, index) => (
                    <span
                      key={index}
                      className="writing-fragment"
                      style={{
                        animationDuration: `${fragmentTimings[index].duration.toFixed(1)}s`,
                        animationDelay: `${fragmentTimings[index].delay.toFixed(1)}s`
                      }}
                    >
                      {line}
                    </span>
                  ))}
                </div>
              </div>
              <div className="venture-layer">
                <div className="venture-overlay" />
                <video
                  className="venture-video"
                  src="/images/BTNVEN.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </div>
            </div>

            <div className="hero-content">
              <p className="explanatory-text">{activeSlide.explanatory}</p>

              <div
                className="pill-shell"
                role="tablist"
                aria-label="Sections"
                ref={pillShellRef}
                onPointerDown={handleShellPointerDown}
              >
                <div
                  className="pill-indicator"
                  style={getIndicatorStyle()}
                />
                {slides.map((slide, index) => {
                  const selected = index === activeIndex;
                  return (
                    <button
                      key={slide.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      className={`pill-item ${selected ? "selected" : ""}`}
                      ref={(el) => { pillItemRefs.current[index] = el; }}
                      onClick={() => selectSlide(index)}
                    >
                      <span>{slide.label}</span>
                    </button>
                  );
                })}
              </div>

              <a className="slide-cta" {...ctaProps}>
                <span>{activeSlide.cta}</span>
                <span className="cta-arrow" aria-hidden="true">
                  &gt;
                </span>
              </a>
            </div>
          </section>

          <footer className="site-footer" aria-label="Footer">
            <div className="footer-brand">
              <img src="/images/BTN.png" alt="Brandon Nova logo" />
              <p>Brandon Nova</p>
            </div>
            <div className="footer-column">
              <h2>Socials</h2>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            </div>
            <div className="footer-column">
              <h2>Technical Profiles</h2>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
              <a href="https://design.brandontnova.com" target="_blank" rel="noopener noreferrer">Dev Portfolio</a>
              <a href="https://developer.palantir.com" target="_blank" rel="noopener noreferrer">Palantir Dev Community</a>
              <a href="https://mldiscord.com" target="_blank" rel="noopener noreferrer">mldiscord.com</a>
            </div>
            <div className="footer-column">
              <h2>Other Sites</h2>
              <a href="https://finnodec.com" target="_blank" rel="noopener noreferrer">Finnodec.com</a>
              <a href="https://www.novnotes.com" target="_blank" rel="noopener noreferrer">novnotes.com</a>
              <a href="https://venture.brandontnova.com" target="_blank" rel="noopener noreferrer">venture.brandontnova.com</a>
            </div>
          </footer>
        </main>
      </div>

      {menuOpen ? (
        <div
          className="menu-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          onMouseDown={closeOverlay}
        >
          <button
            type="button"
            className="menu-close"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            ref={closeButtonRef}
          >
            x
          </button>
          <nav className="overlay-nav" aria-label="Overlay navigation">
            <a href="https://venture.brandontnova.com" target="_blank" rel="noopener noreferrer">
              Portfolio
            </a>
            <a href="/about/">About</a>
            <button
              type="button"
              className="overlay-nav-button"
              onClick={() => { setMenuOpen(false); setMissionOpen(true); }}
            >
              Mission
            </button>
          </nav>
        </div>
      ) : null}

      {missionOpen ? (
        <div
          className="mission-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Mission statement"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setMissionOpen(false); }}
        >
          <div className="mission-content">
            <p className="mission-text">
              Enable everyone through the creation of tools and systems, free access of knowledge and skills, and discovery of will to power
            </p>
            <button
              type="button"
              className="mission-close"
              onClick={() => setMissionOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default App;
