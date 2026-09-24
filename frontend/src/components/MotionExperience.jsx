"use client";
import { useEffect, useRef } from "react";
import { animate, MotionConfig, useReducedMotion } from "framer-motion";



export default function MotionExperience({ children }) {
  const root = useRef(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced || !root.current) return;
    const seen = new WeakSet(), animations = new Set();
    const observer = new IntersectionObserver(entries => {
      let stagger = 0;
      for (const entry of entries) if (entry.isIntersecting) {
        observer.unobserve(entry.target);
        const control = animate(entry.target, { opacity: [0.55, 1], y: [12, 0] }, { duration: 0.38, delay: Math.min(stagger++ * 0.035, 0.14), ease: [0.22, 1, 0.36, 1] });
        animations.add(control);
        control.then(() => animations.delete(control));
      }
    }, { threshold: 0.06 });
    const scan = () => root.current?.querySelectorAll(".panel,.resource-card,.stat-card,.conductor-package,.conductor-allocation,.page-heading").forEach(element => {
      if (!seen.has(element)) { seen.add(element); observer.observe(element); }
    });
    scan();
    const mutation = new MutationObserver(scan);
    mutation.observe(root.current, { childList: true, subtree: true });
    return () => { mutation.disconnect(); observer.disconnect(); animations.forEach(control => control.complete()); };
  }, [reduced]);
  return <MotionConfig reducedMotion="user"><div ref={root} className="motion-experience">{children}</div></MotionConfig>;
}
