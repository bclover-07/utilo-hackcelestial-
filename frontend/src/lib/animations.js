"use client";
import { animate as animeAnimate } from "animejs";

/**
 * Animates a numeric element from startVal to endVal smoothly.
 * Supports formatting (currency ₹, percentage %, integer with commas).
 */
export function animateCounter(element, targetVal, options = {}) {
  if (!element) return;
  const num = typeof targetVal === "number" ? targetVal : parseFloat(`${targetVal}`.replace(/[^0-9.-]/g, ""));
  if (isNaN(num)) return;

  const duration = options.duration || 1000;
  const isCurrency = options.isCurrency || `${targetVal}`.includes("₹");
  const isPercent = options.isPercent || `${targetVal}`.includes("%");
  const isInteger = options.isInteger !== undefined ? options.isInteger : Number.isInteger(num);

  const startVal = options.startVal !== undefined ? options.startVal : 0;
  const obj = { val: startVal };

  try {
    animeAnimate(obj, {
      val: num,
      duration,
      ease: "outExpo",
      onUpdate: () => {
        let formatted = isInteger ? Math.round(obj.val).toLocaleString("en-IN") : obj.val.toFixed(1);
        if (isCurrency) formatted = `₹${formatted}`;
        if (isPercent) formatted = `${formatted}%`;
        element.textContent = formatted;
      },
    });
  } catch {
    // Fallback if anime fails
    element.textContent = isCurrency ? `₹${num.toLocaleString("en-IN")}` : isPercent ? `${num}%` : `${num.toLocaleString("en-IN")}`;
  }
}

/**
 * Adds a subtle elastic pulse attention effect to an element.
 */
export function pulseAttention(element) {
  if (!element) return;
  try {
    animeAnimate(element, {
      scale: [1, 1.04, 0.98, 1],
      duration: 500,
      ease: "outElastic(1, .6)",
    });
  } catch {
    // Graceful no-op
  }
}

/**
 * Staggers a list of child elements with a spring entrance.
 */
export function staggerEntrance(elements, options = {}) {
  if (!elements || elements.length === 0) return;
  try {
    animeAnimate(elements, {
      opacity: [0, 1],
      translateY: [16, 0],
      scale: [0.98, 1],
      delay: (el, i) => i * (options.delay || 40),
      duration: options.duration || 450,
      ease: "outCubic",
    });
  } catch {
    // Graceful no-op
  }
}
