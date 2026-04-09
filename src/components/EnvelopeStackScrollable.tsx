import { cn } from "@/lib/utils";
import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

const SCROLL_TIMEOUT_OFFSET = 100;
const MIN_SCROLL_INTERVAL = 300;
const SCROLL_THRESHOLD = 20;
const TOUCH_SCROLL_THRESHOLD = 100;
const HOVER_SCALE_MULTIPLIER = 1.02;
const CARD_HEIGHT = 300;
const CARD_PADDING = 100;
const FRAME_OFFSET = -9;
const FRAMES_VISIBLE_LENGTH = 4;
const SNAP_DISTANCE = 50;
const TRANSITION_DURATION = 30;

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

export interface ScrollableCardStackProps {
  children:       React.ReactNode;
  className?:     string;
  selectedIndex?: number;
  onIndexChange?: (index: number) => void;
}

const ScrollableCardStack: React.FC<ScrollableCardStackProps> = ({ children, className = "", selectedIndex, onIndexChange }) => {
  const items = React.Children.toArray(children);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const isScrollingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef(0);
  const shouldReduceMotion = useReducedMotion();

  const maxIndex = items.length - 1;

  const finishScroll = useCallback(() => {
    isScrollingRef.current = false;
    setIsScrolling(false);
  }, []);

  const scrollToCard = useCallback(
    (direction: 1 | -1) => {
      if (isScrollingRef.current) return;
      const now = Date.now();
      if (now - lastScrollTime.current < MIN_SCROLL_INTERVAL) return;
      const newIndex = clamp(currentIndex + direction, 0, maxIndex);
      if (newIndex !== currentIndex) {
        lastScrollTime.current = now;
        isScrollingRef.current = true;
        setIsScrolling(true);
        setCurrentIndex(newIndex);
        setTimeout(finishScroll, TRANSITION_DURATION + SCROLL_TIMEOUT_OFFSET);
      }
    },
    [currentIndex, maxIndex, finishScroll]
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      if (isDragging || isScrollingRef.current || Math.abs(e.deltaY) < SCROLL_THRESHOLD) return;
      scrollToCard(e.deltaY > 0 ? 1 : -1);
    },
    [isDragging, scrollToCard]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isScrollingRef.current) return;
      if (document.querySelector('[role="dialog"]')) return;
      const active = document.activeElement;
      if (active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) return;

      switch (e.key) {
        case "ArrowUp":
        case "ArrowLeft":
          e.preventDefault();
          scrollToCard(-1);
          break;
        case "ArrowDown":
        case "ArrowRight":
          e.preventDefault();
          scrollToCard(1);
          break;
        case "Home":
          e.preventDefault();
          if (currentIndex !== 0) {
            isScrollingRef.current = true;
            setIsScrolling(true);
            setCurrentIndex(0);
            setTimeout(finishScroll, TRANSITION_DURATION + SCROLL_TIMEOUT_OFFSET);
          }
          break;
        case "End":
          e.preventDefault();
          if (currentIndex !== maxIndex) {
            isScrollingRef.current = true;
            setIsScrolling(true);
            setCurrentIndex(maxIndex);
            setTimeout(finishScroll, TRANSITION_DURATION + SCROLL_TIMEOUT_OFFSET);
          }
          break;
      }
    },
    [currentIndex, maxIndex, scrollToCard, finishScroll]
  );

  const touchStartY = useRef(0);
  const touchMoved = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchMoved.current = false;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || isScrolling) return;
      const deltaY = touchStartY.current - e.touches[0].clientY;
      if (Math.abs(deltaY) > TOUCH_SCROLL_THRESHOLD && !touchMoved.current) {
        scrollToCard(deltaY > 0 ? 1 : -1);
        touchMoved.current = true;
      }
    },
    [isDragging, isScrolling, scrollToCard]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    touchMoved.current = false;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    onIndexChange?.(currentIndex);
  }, [currentIndex, onIndexChange]);

  // Jump to externally controlled index
  useEffect(() => {
    if (selectedIndex == null || selectedIndex === currentIndex || isScrolling) return;
    isScrollingRef.current = true;
    setIsScrolling(true);
    setCurrentIndex(selectedIndex);
    setTimeout(finishScroll, TRANSITION_DURATION + SCROLL_TIMEOUT_OFFSET);
  }, [selectedIndex]);

  const getCardTransform = useCallback(
    (index: number) => ({
      y:      shouldReduceMotion ? 0 : clamp(
        (index - currentIndex) * FRAME_OFFSET,
        FRAME_OFFSET * FRAMES_VISIBLE_LENGTH,
        Infinity
      ),
      opacity: index < currentIndex ? 0 : 1,
      zIndex:  items.length - index,
    }),
    [currentIndex, items.length, shouldReduceMotion]
  );

  return (
    <section
      aria-atomic="true"
      aria-label="Scrollable card stack"
      aria-live="polite"
      className={cn("relative mx-auto h-fit w-fit min-w-[300px]", className)}
    >
      {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: Interactive scrollable widget requires event handlers */}
      <div
        aria-label="Scrollable card container"
        className="h-full w-full"
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchStart}
        ref={containerRef}
        role="application"
        style={{ minHeight: `${CARD_HEIGHT + CARD_PADDING}px`, perspectiveOrigin: "center 60%", touchAction: "none" }}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Required for keyboard navigation
        tabIndex={0}
      >
        {items.map((item, i) => {
          const transform = getCardTransform(i);
          const isActive = i === currentIndex;

          return (
            <motion.div
              animate={
                shouldReduceMotion
                  ? { x: "-50%" }
                  : { y: `calc(-50% + ${transform.y}px)`, x: "-50%", rotate: isActive ? -2 : 0 }
              }
              aria-hidden={!isActive}
              className="absolute top-1/2 left-1/2"
              data-active={isActive}
              initial={false}
              key={`scrollable-card-${i}`}
              style={{
                height: `${CARD_HEIGHT}px`,
                zIndex: transform.zIndex,
                pointerEvents: isActive ? "auto" : "none",
                transformOrigin: "center center",
                willChange: (!shouldReduceMotion && Math.abs(i - currentIndex) <= 2) ? "opacity, transform" : undefined,
                opacity: transform.opacity,
                transitionProperty: shouldReduceMotion ? "none" : "opacity",
                transitionDuration: shouldReduceMotion ? "0ms" : "200ms",
                transitionTimingFunction: "cubic-bezier(0.645, 0.045, 0.355, 1)",
              }}
              tabIndex={isActive ? 0 : -1}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 250, damping: 20, mass: 0.5, duration: 0.25 }
              }
              whileHover={
                shouldReduceMotion || !isActive
                  ? {}
                  : { scale: HOVER_SCALE_MULTIPLIER, transition: { type: "spring", stiffness: 250, damping: 20, mass: 0.5, duration: 0.25 } }
              }
            >
              <div className={cn("flex transition-all duration-200", isScrolling && isActive && "ring-2 ring-brand ring-opacity-50")}>
                {isScrolling && isActive && (
                  <div className="absolute -top-1 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-brand opacity-75" />
                )}
                <div className="relative w-full flex-1 overflow-visible">
                  {item}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default ScrollableCardStack;
