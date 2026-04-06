import { useEffect, useMemo, useRef, useState } from "react";
import { slides } from "./data/slides";
import { writingPassage } from "./data/writingPassage";

const AUTO_ADVANCE_MS = 9000;
const STAR_COUNT = 48;

function makeStars(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `star-${index}`,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1.5 + Math.random() * 2.5,
    baseOpacity: 0.08 + Math.random() * 0.18,
    twinkleDuration: 3 + Math.random() * 5,
    twinkleDelay: Math.random() * 6
  }));
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
  const [cursorPosition, setCursorPosition] = useState({ x: -100, y: -100 });
  const autoTimerRef = useRef(null);
  const closeButtonRef = useRef(null);
  const aboutLayerRef = useRef(null);
  const pointerFrameRef = useRef(0);
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
                    const influence = Math.max(0, 1 - distance / 18);
                    const opacity = Math.min(1, star.baseOpacity + influence * 0.65);
                    const dimOpacity = Math.max(0.08, opacity * 0.45);
                    const scale = 1 + influence * 0.35;

                    return (
                      <span
                        key={star.id}
                        className="star"
                        style={{
                          left: `${star.x}%`,
                          top: `${star.y}%`,
                          width: `${star.size}px`,
                          height: `${star.size}px`,
                          "--star-dim": dimOpacity,
                          "--star-bright": opacity,
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

              <div className="pill-shell" role="tablist" aria-label="Sections">
                {slides.map((slide, index) => {
                  const selected = index === activeIndex;
                  return (
                    <button
                      key={slide.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      className={`pill-item ${selected ? "selected" : ""}`}
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
            <a href="#" onClick={(event) => event.preventDefault()} aria-disabled="true">
              Manifesto
            </a>
          </nav>
        </div>
      ) : null}
    </>
  );
}

export default App;
