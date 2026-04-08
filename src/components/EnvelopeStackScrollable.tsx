import { cn } from "@/lib/utils";
import React from "react";
import { motion, useMotionValue, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

const SCROLL_TIMEOUT_OFFSET = 100;
const MIN_SCROLL_INTERVAL = 300;
const SCROLL_THRESHOLD = 20;
const TOUCH_SCROLL_THRESHOLD = 100;
const SCALE_FACTOR = 0.08;
const MIN_SCALE = 0.08;
const MAX_SCALE = 2;
const HOVER_SCALE_MULTIPLIER = 1.02;
const CARD_PADDING = 100;

export interface ScrollableCardStackProps {
  children:        React.ReactNode;
  className?:      string;
  selectedIndex?:  number;
  onIndexChange?:  (index: number) => void;
}

const ScrollableCardStack: React.FC<ScrollableCardStackProps> = ({ children, className = "", selectedIndex, onIndexChange }) => {
  const items = React.Children.toArray(children);
  const transitionDuration = 30;
  const cardHeight = 300;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollY = useMotionValue(0);
  const lastScrollTime = useRef(0);
  const shouldReduceMotion = useReducedMotion();

  const totalItems = items.length;
  const maxIndex = totalItems - 1;

  const FRAME_OFFSET = -30;
  const FRAMES_VISIBLE_LENGTH = 3;
  const SNAP_DISTANCE = 50;

  const clamp = useCallback(
    (val: number, [min, max]: [number, number]): number =>
      Math.min(Math.max(val, min), max),
    []
  );

  const scrollToCard = useCallback(
    (direction: 1 | -1) => {
      if (isScrolling) return;

      const now = Date.now();
      if (now - lastScrollTime.current < MIN_SCROLL_INTERVAL) return;

      const newIndex = clamp(currentIndex + direction, [0, maxIndex]);

      if (newIndex !== currentIndex) {
        lastScrollTime.current = now;
        setIsScrolling(true);
        setCurrentIndex(newIndex);
        scrollY.set(newIndex * SNAP_DISTANCE);
        setTimeout(() => {
          setIsScrolling(false);
        }, transitionDuration + SCROLL_TIMEOUT_OFFSET);
      }
    },
    [currentIndex, maxIndex, scrollY, isScrolling, transitionDuration, clamp]
  );

  const handleScroll = useCallback(
    (deltaY: number) => {
      if (isDragging || isScrolling) return;
      if (Math.abs(deltaY) < SCROLL_THRESHOLD) return;
      scrollToCard(deltaY > 0 ? 1 : -1);
    },
    [isDragging, isScrolling, scrollToCard]
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      handleScroll(e.deltaY);
    },
    [handleScroll]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isScrolling) return;

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
            setIsScrolling(true);
            setCurrentIndex(0);
            scrollY.set(0);
            setTimeout(() => setIsScrolling(false), transitionDuration + SCROLL_TIMEOUT_OFFSET);
          }
          break;
        case "End":
          e.preventDefault();
          if (currentIndex !== maxIndex) {
            setIsScrolling(true);
            setCurrentIndex(maxIndex);
            scrollY.set(maxIndex * SNAP_DISTANCE);
            setTimeout(() => setIsScrolling(false), transitionDuration + SCROLL_TIMEOUT_OFFSET);
          }
          break;
      }
    },
    [currentIndex, maxIndex, scrollY, isScrolling, scrollToCard, transitionDuration]
  );

  const touchStartY = useRef(0);
  const touchStartIndex = useRef(0);
  const touchStartTime = useRef(0);
  const touchMoved = useRef(false);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      touchStartIndex.current = currentIndex;
      touchStartTime.current = Date.now();
      touchMoved.current = false;
      setIsDragging(true);
    },
    [currentIndex]
  );

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
    if (!isDragging) scrollY.set(currentIndex * SNAP_DISTANCE);
    onIndexChange?.(currentIndex);
  }, [currentIndex, isDragging, scrollY]);

  // Jump to externally controlled index
  useEffect(() => {
    if (selectedIndex == null || selectedIndex === currentIndex || isScrolling) return;
    setIsScrolling(true);
    setCurrentIndex(selectedIndex);
    scrollY.set(selectedIndex * SNAP_DISTANCE);
    setTimeout(() => setIsScrolling(false), transitionDuration + SCROLL_TIMEOUT_OFFSET);
  }, [selectedIndex]);

  const getCardTransform = useCallback(
    (index: number) => {
      const offsetIndex = index - currentIndex;
      const isBehindCurrent = currentIndex > index;

      return {
        y: shouldReduceMotion ? 0 : clamp(offsetIndex * FRAME_OFFSET, [FRAME_OFFSET * FRAMES_VISIBLE_LENGTH, Number.POSITIVE_INFINITY]),
        scale: shouldReduceMotion ? 1 : clamp(1 - offsetIndex * SCALE_FACTOR, [MIN_SCALE, MAX_SCALE]),
        opacity: currentIndex > index ? 0 : 1,
        blur: !shouldReduceMotion && isBehindCurrent ? 2 : 0,
        zIndex: items.length - index,
      };
    },
    [currentIndex, items.length, clamp, shouldReduceMotion]
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
        onKeyDown={handleKeyDown}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchStart}
        ref={containerRef}
        role="application"
        style={{
          minHeight: `${cardHeight + CARD_PADDING}px`,
          perspectiveOrigin: "center 60%",
          touchAction: "none",
        }}
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
                  : { y: `calc(-50% + ${transform.y}px)`, scale: transform.scale, x: "-50%" }
              }
              aria-hidden={!isActive}
              className="absolute top-1/2 left-1/2"
              data-active={isActive}
              initial={false}
              key={`scrollable-card-${i}`}
              style={{
                height: `${cardHeight}px`,
                zIndex: transform.zIndex,
                pointerEvents: isActive ? "auto" : "none",
                transformOrigin: "center center",
                willChange: (!shouldReduceMotion && Math.abs(i - currentIndex) <= 2) ? "opacity, filter, transform" : undefined,
                filter: `blur(${transform.blur}px)`,
                opacity: transform.opacity,
                transitionProperty: shouldReduceMotion ? "none" : "opacity, filter",
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
                  : { scale: transform.scale * HOVER_SCALE_MULTIPLIER, transition: { type: "spring", stiffness: 250, damping: 20, mass: 0.5, duration: 0.25 } }
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
