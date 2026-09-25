"use client";
import { useEffect, useRef } from "react";
import { animate, MotionConfig, useReducedMotion } from "framer-motion";
import { animateCounter } from "@/lib/animations";

const targets = [
  ".panel",
  ".resource-card",
  ".stat-card",
  ".stat",
  ".pulse-card",
  ".forecast-card",
  ".listing-card",
  ".offer-card",
  ".conductor-package",
  ".conductor-allocation",
  ".page-heading",
  ".heatmap-cell",
  ".agent-directory-card",
  ".cited-claim",
  ".offer-timeline>div",
  ".message",
  ".decision-action",
  ".intelligence-card",
  ".agent-feature-card",
  ".agent-card",
  ".readiness-grid article",
].join(",");

export default function MotionExperience({ children }) {
  const root = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || !root.current) return;
    const seen = new WeakSet();
    const animatedNumbers = new WeakSet();
    const animations = new Set();

    const observer = new IntersectionObserver(
      (entries) => {
        let stagger = 0;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            observer.unobserve(entry.target);
            const target = entry.target;

            // Framer Motion spring-eased entrance
            const control = animate(
              target,
              { opacity: [0, 1], y: [14, 0], scale: [0.985, 1] },
              {
                duration: 0.36,
                ease: [0.16, 1, 0.3, 1],
                delay: Math.min(stagger++ * 0.025, 0.18),
              }
            );
            animations.add(control);
            control.then(() => animations.delete(control));

            // Anime.js count-up effect on numeric metric displays
            const metricEls = target.querySelectorAll?.(".pulse-value, strong, .stat-value");
            if (metricEls) {
              metricEls.forEach((el) => {
                if (!animatedNumbers.has(el)) {
                  const raw = el.textContent?.trim();
                  if (raw && /^[₹\d,\.]+%?$/.test(raw)) {
                    animatedNumbers.add(el);
                    animateCounter(el, raw, { duration: 900 });
                  }
                }
              });
            }
          }
        }
      },
      { threshold: 0.05 }
    );

    const scan = (node) => {
      if (!(node instanceof Element)) return;
      const observe = (element) => {
        if (!seen.has(element)) {
          seen.add(element);
          observer.observe(element);
        }
      };
      if (node.matches(targets)) observe(node);
      node.querySelectorAll(targets).forEach(observe);
    };

    scan(root.current);

    const mutation = new MutationObserver((records) =>
      records.forEach((record) => {
        record.addedNodes.forEach(scan);
        record.removedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          observer.unobserve(node);
          node.querySelectorAll(targets).forEach((el) => observer.unobserve(el));
        });
      })
    );

    mutation.observe(root.current, { childList: true, subtree: true });

    return () => {
      mutation.disconnect();
      observer.disconnect();
      animations.forEach((control) => control.complete());
    };
  }, [reduced]);

  return (
    <MotionConfig reducedMotion="user">
      <div ref={root} className="motion-experience">
        {children}
      </div>
    </MotionConfig>
  );
}
