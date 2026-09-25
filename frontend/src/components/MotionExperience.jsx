"use client";
import { useEffect, useRef } from "react";
import { animate, MotionConfig, useReducedMotion } from "framer-motion";

const targets = ".panel,.resource-card,.stat-card,.conductor-package,.conductor-allocation,.page-heading,.forecast-card,.heatmap-cell,.agent-directory-card,.cited-claim,.offer-timeline>div,.message,.decision-action,.intelligence-card,.agent-feature-card";

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
        // Opacity only: leave CSS hover transforms and chart geometry untouched.
        const control = animate(entry.target, { opacity: [.35, 1] }, { duration: .32, delay: Math.min(stagger++ * .025, .12) });
        animations.add(control);
        control.then(() => animations.delete(control));
      }
    }, { threshold: .04 });
    const scan = node => {
      if (!(node instanceof Element)) return;
      const observe = element => { if (!seen.has(element)) { seen.add(element); observer.observe(element); } };
      if (node.matches(targets)) observe(node);
      node.querySelectorAll(targets).forEach(observe);
    };
    scan(root.current);
    const mutation = new MutationObserver(records => records.forEach(record => {
      record.addedNodes.forEach(scan);
      record.removedNodes.forEach(node => {
        if (!(node instanceof Element)) return;
        observer.unobserve(node);
        node.querySelectorAll(targets).forEach(element => observer.unobserve(element));
      });
    }));
    mutation.observe(root.current, { childList: true, subtree: true });
    return () => { mutation.disconnect(); observer.disconnect(); animations.forEach(control => control.complete()); };
  }, [reduced]);
  return <MotionConfig reducedMotion="user"><div ref={root} className="motion-experience">{children}</div></MotionConfig>;
}
