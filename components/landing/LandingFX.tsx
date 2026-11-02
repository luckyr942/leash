"use client";
import { useEffect } from "react";

/**
 * One client island for the static home page: scroll reveals, count-up numbers, the nav shadow,
 * the audience toggle, the grow scene (a card that expands to full width as you scroll) and the tabs.
 * Without JS or with reduced motion, everything is visible and static.
 */
export default function LandingFX() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("fx");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: (() => void)[] = [];
    const on = <K extends keyof WindowEventMap>(t: EventTarget, ev: K | string, fn: EventListener, opts?: AddEventListenerOptions) => {
      t.addEventListener(ev, fn, opts);
      cleanups.push(() => t.removeEventListener(ev, fn));
    };

    // Reveal on scroll
    const reveal = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            reveal.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => (reduce ? el.classList.add("in") : reveal.observe(el)));
    cleanups.push(() => reveal.disconnect());

    // Count-up numbers
    const counter = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          counter.unobserve(e.target);
          const el = e.target as HTMLElement;
          const to = Number(el.dataset.count ?? 0);
          if (reduce || to === 0) return void (el.textContent = String(to));
          const start = performance.now();
          const tick = (t: number) => {
            const p = Math.min(1, (t - start) / 1300);
            el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3))));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }),
      { threshold: 0.6 },
    );
    document.querySelectorAll("[data-count]").forEach((el) => counter.observe(el));
    cleanups.push(() => counter.disconnect());

    // Audience toggle (freelancers / their clients)
    const lp = document.querySelector<HTMLElement>(".lp");
    document.querySelectorAll<HTMLButtonElement>("[data-aud-btn]").forEach((b) =>
      on(b, "click", () => {
        if (lp) lp.dataset.aud = b.dataset.audBtn!;
        document.querySelectorAll("[data-aud-btn]").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
      }),
    );

    // Tabs
    document.querySelectorAll<HTMLElement>("[data-tabs]").forEach((box) => {
      const btns = [...box.querySelectorAll<HTMLButtonElement>("[data-tab]")];
      const pick = (i: number) => {
        box.dataset.active = String(i);
        btns.forEach((b, k) => {
          b.setAttribute("aria-selected", String(k === i));
          b.tabIndex = k === i ? 0 : -1;
        });
      };
      btns.forEach((b, i) => {
        on(b, "click", () => pick(i));
        on(b, "keydown", (e) => {
          const k = (e as KeyboardEvent).key;
          if (k !== "ArrowRight" && k !== "ArrowLeft") return;
          const n = (i + (k === "ArrowRight" ? 1 : btns.length - 1)) % btns.length;
          pick(n);
          btns[n].focus();
        });
      });
      pick(0);
    });

    // Scroll-driven: nav shadow + grow scene progress
    const nav = document.querySelector(".h-nav");
    const grow = document.querySelector<HTMLElement>(".grow");
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        nav?.classList.toggle("scrolled", window.scrollY > 8);
        if (grow) {
          const r = grow.getBoundingClientRect();
          const span = r.height - window.innerHeight;
          const p = reduce ? 1 : Math.min(1, Math.max(0, -r.top / Math.max(span, 1)));
          grow.style.setProperty("--p", p.toFixed(4));
          // Grow first (0 → .35), then step through the three words
          const stage = p < 0.5 ? 0 : p < 0.75 ? 1 : 2;
          grow.dataset.stage = String(stage);
        }
      });
    };
    onScroll();
    on(window, "scroll", onScroll, { passive: true });
    on(window, "resize", onScroll);

    return () => {
      cleanups.forEach((c) => c());
      cancelAnimationFrame(raf);
      root.classList.remove("fx");
    };
  }, []);
  return null;
}
