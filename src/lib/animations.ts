import { gsap } from 'gsap';
import { Draggable } from 'gsap/dist/Draggable';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(Draggable);
}

/**
 * Horizontal Staggered Slide-Through Animation
 * Smooth horizontal slide with cascading opacity for premium feel
 */
export function slideQuestion(element: HTMLElement, direction: 'next' | 'prev', duration = 0.5) {
  if (!element) return;

  const fromX = direction === 'next' ? 100 : -100;

  // Animate the container as a smooth block with enhanced easing
  gsap.fromTo(
    element,
    { opacity: 0, x: fromX, scale: 0.98 },
    {
      opacity: 1,
      x: 0,
      scale: 1,
      duration: duration,
      ease: 'power2.out'
    }
  );

  // Get the main content div for opacity cascade effect
  const mainContent = element.querySelector(':scope > div') as HTMLElement;
  if (!mainContent) return;

  // Get direct children for cascading opacity (just visual, no position change)
  const contentChildren = Array.from(mainContent.children).filter(child =>
    child instanceof HTMLElement &&
    child.tagName !== 'SCRIPT' &&
    child.tagName !== 'STYLE'
  ) as HTMLElement[];

  if (contentChildren.length === 0) return;

  // Apply opacity cascade without position changes to avoid layout shifts
  gsap.fromTo(
    contentChildren,
    { opacity: 0, y: 10 },
    {
      opacity: 1,
      y: 0,
      duration: duration * 0.5,
      ease: 'power2.out',
      stagger: 0.04,
      delay: duration * 0.1
    }
  );
}

/**
 * Premium progress bar animation with bounce effect
 */
export function animateProgress(element: HTMLElement, progress: number, duration = 0.7) {
  if (!element) return;
  gsap.to(
    element,
    {
      width: `${progress}%`,
      duration,
      ease: 'power3.out'
    }
  );
}

/**
 * Enhanced shake animation for validation errors with slight color pulse
 */
export function shakeElement(element: HTMLElement) {
  if (!element) return;
  const timeline = gsap.timeline();

  timeline
    .fromTo(
      element,
      { x: 0, backgroundColor: 'rgba(255, 59, 48, 0)' },
      {
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        duration: 0.1
      },
      0
    )
    .fromTo(
      element,
      { x: 0 },
      {
        x: -10,
        duration: 0.08,
        ease: 'power2.inOut',
        repeat: 4,
        yoyo: true
      },
      0
    )
    .to(
      element,
      {
        backgroundColor: 'rgba(255, 59, 48, 0)',
        duration: 0.3,
        ease: 'power2.out'
      }
    );
}

/**
 * Premium dropdown slide down animation with perspective
 */
export function slideDropdown(element: HTMLElement) {
  if (!element) return;
  gsap.fromTo(
    element,
    { opacity: 0, y: -15, scaleY: 0.85 },
    {
      opacity: 1,
      y: 0,
      scaleY: 1,
      duration: 0.35,
      ease: 'back.out(1.2)',
      transformOrigin: 'top center'
    }
  );
}

/**
 * Smooth dropdown slide up animation
 */
export function slideDropdownOut(element: HTMLElement) {
  if (!element) return;
  return new Promise<void>((resolve) => {
    gsap.to(
      element,
      {
        opacity: 0,
        y: -15,
        scaleY: 0.85,
        duration: 0.2,
        ease: 'power3.in',
        transformOrigin: 'top center',
        onComplete: () => resolve()
      }
    );
  });
}

/**
 * Premium checkmark animation with bounce
 */
export function animateCheckmark(element: HTMLElement) {
  if (!element) return;
  const timeline = gsap.timeline();

  timeline
    .fromTo(
      element,
      { scale: 0, opacity: 0, rotationZ: -180 },
      {
        scale: 1,
        opacity: 1,
        rotationZ: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.5)'
      }
    );
}

/**
 * Enhanced error bounce animation with color indication
 */
export function bounceError(element: HTMLElement) {
  if (!element) return;
  const timeline = gsap.timeline();

  timeline
    .fromTo(
      element,
      { opacity: 0, y: 20, backgroundColor: 'rgba(239, 68, 68, 0)' },
      {
        opacity: 1,
        y: 0,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        duration: 0.4,
        ease: 'back.out(1.5)'
      }
    )
    .to(
      element,
      {
        backgroundColor: 'rgba(239, 68, 68, 0)',
        duration: 0.5,
        ease: 'power2.out'
      },
      0.8
    );
}

/**
 * Stagger animation for multiple elements with spring effect
 */
export function staggerElements(elements: HTMLElement[], duration = 0.5, staggerDelay = 0.12) {
  if (!elements.length) return;
  gsap.fromTo(
    elements,
    { opacity: 0, y: 30, rotationX: -90 },
    {
      opacity: 1,
      y: 0,
      rotationX: 0,
      duration,
      ease: 'elastic.out(1, 0.6)',
      stagger: {
        amount: staggerDelay * elements.length,
        from: 'start'
      }
    }
  );
}

/**
 * Zoom in animation with scale
 */
export function zoomIn(element: HTMLElement, duration = 0.4) {
  if (!element) return;
  gsap.fromTo(
    element,
    { opacity: 0, scale: 0.5 },
    {
      opacity: 1,
      scale: 1,
      duration,
      ease: 'back.out(1.5)'
    }
  );
}

/**
 * Slide in from right
 */
export function slideInRight(element: HTMLElement, duration = 0.5) {
  if (!element) return;
  gsap.fromTo(
    element,
    { opacity: 0, x: 100, rotationY: -10 },
    {
      opacity: 1,
      x: 0,
      rotationY: 0,
      duration,
      ease: 'power3.out'
    }
  );
}

/**
 * Slide out to left
 */
export function slideOutLeft(element: HTMLElement, duration = 0.4) {
  if (!element) return;
  return new Promise<void>((resolve) => {
    gsap.to(element, {
      opacity: 0,
      x: -100,
      rotationY: 10,
      duration,
      ease: 'power3.in',
      onComplete: () => resolve()
    });
  });
}