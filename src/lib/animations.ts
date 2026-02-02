import { gsap } from 'gsap';
import { Draggable } from 'gsap/dist/Draggable';

gsap.registerPlugin(Draggable);

/**
 * Premium fade and scale entry animation with elastic easing
 */
export function animateIn(element: HTMLElement, delay = 0) {
  if (!element) return;
  gsap.fromTo(
    element,
    { opacity: 0, scale: 0.85, y: 30, rotationZ: -2 },
    { 
      opacity: 1, 
      scale: 1, 
      y: 0, 
      rotationZ: 0,
      duration: 0.6, 
      ease: 'elastic.out(1, 0.5)',
      delay 
    }
  );
}

/**
 * Smooth slide up and fade out exit animation
 */
export function animateOut(element: HTMLElement, duration = 0.4) {
  if (!element) return;
  return new Promise<void>((resolve) => {
    gsap.to(
      element,
      { 
        opacity: 0, 
        y: -30,
        scale: 0.9,
        rotationZ: -2,
        duration,
        ease: 'power3.in',
        onComplete: () => resolve()
      }
    );
  });
}

/**
 * Premium slide question transition with stagger effect
 */
export function slideQuestion(element: HTMLElement, direction: 'next' | 'prev', duration = 0.5) {
  if (!element) return;
  
  const fromX = direction === 'next' ? 80 : -80;
  
  gsap.fromTo(
    element,
    { opacity: 0, x: fromX, rotationY: direction === 'next' ? -10 : 10 },
    { 
      opacity: 1, 
      x: 0, 
      rotationY: 0,
      duration,
      ease: 'cubic.out',
      perspective: 1200
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
 * Premium input field focus animation with glow effect
 */
export function focusInputField(element: HTMLElement) {
  if (!element) return;
  gsap.to(
    element,
    {
      boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.2), 0 0 0 8px rgba(59, 130, 246, 0.1)',
      duration: 0.3,
      ease: 'power2.out'
    }
  );
}

/**
 * Smooth input field blur animation
 */
export function blurInputField(element: HTMLElement) {
  if (!element) return;
  gsap.to(
    element,
    {
      boxShadow: '0 0 0 0px rgba(59, 130, 246, 0)',
      duration: 0.3,
      ease: 'power2.out'
    }
  );
}

/**
 * Enhanced button press animation with ripple-like effect
 */
export function pressButton(element: HTMLElement) {
  if (!element) return;
  const timeline = gsap.timeline();
  
  timeline
    .to(element, 
      {
        scale: 0.92,
        duration: 0.1,
        ease: 'power2.in'
      }
    )
    .to(element,
      {
        scale: 1,
        duration: 0.15,
        ease: 'cubic.out'
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
 * Premium color pulse animation with glow effect
 */
export function colorPulse(element: HTMLElement, color: string = '#3b82f6') {
  if (!element) return;
  const timeline = gsap.timeline();
  
  const rgb = hexToRgb(color);
  const rgbString = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
  
  timeline
    .to(
      element,
      {
        boxShadow: `0 0 0 0 rgba(${rgbString}, 0.7)`,
        duration: 0.8,
        ease: 'power2.out'
      }
    )
    .to(
      element,
      {
        boxShadow: `0 0 0 20px rgba(${rgbString}, 0)`,
        duration: 0.8,
        ease: 'power2.out'
      },
      0
    )
    .set(element, { boxShadow: 'none' });
}

/**
 * Smooth page transition with fade
 */
export function pageTransition(currentElement: HTMLElement, nextElement: HTMLElement) {
  return new Promise<void>((resolve) => {
    const timeline = gsap.timeline();
    
    timeline
      .to(currentElement, {
        opacity: 0,
        duration: 0.4,
        ease: 'cubic.in'
      }, 0)
      .fromTo(
        nextElement,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: 'cubic.out',
          onComplete: () => resolve()
        },
        0.2
      );
  });
}

/**
 * Premium ripple click animation with radial gradient
 */
export function rippleEffect(element: HTMLElement, event: MouseEvent) {
  const rect = element.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const radius = Math.max(rect.width, rect.height);

  const ripple = document.createElement('span');
  ripple.style.position = 'absolute';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  ripple.style.width = ripple.style.height = '0px';
  ripple.style.borderRadius = '50%';
  ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
  ripple.style.pointerEvents = 'none';
  ripple.style.transform = 'translate(-50%, -50%)';
  ripple.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.5)';

  element.style.position = 'relative';
  element.style.overflow = 'hidden';
  element.appendChild(ripple);

  gsap.to(ripple, {
    width: radius * 2,
    height: radius * 2,
    opacity: 0,
    duration: 0.7,
    ease: 'power2.out',
    onComplete: () => ripple.remove()
  });
}
/**
 * Helper function to convert hex to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 59, g: 130, b: 246 };
}

/**
 * Premium flip card animation
 */
export function flipCard(element: HTMLElement, duration = 0.6) {
  if (!element) return;
  gsap.to(element, {
    rotationY: 360,
    duration,
    ease: 'back.inOut(1.2)'
  });
}

/**
 * Rotate in animation
 */
export function rotateIn(element: HTMLElement, duration = 0.6) {
  if (!element) return;
  gsap.fromTo(
    element,
    { opacity: 0, rotationZ: -180, scale: 0.8 },
    {
      opacity: 1,
      rotationZ: 0,
      scale: 1,
      duration,
      ease: 'cubic.out'
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
 * Zoom out animation
 */
export function zoomOut(element: HTMLElement, duration = 0.4) {
  if (!element) return;
  return new Promise<void>((resolve) => {
    gsap.to(element, {
      opacity: 0,
      scale: 0.5,
      duration,
      ease: 'back.in(1.5)',
      onComplete: () => resolve()
    });
  });
}

/**
 * Slide in from left
 */
export function slideInLeft(element: HTMLElement, duration = 0.5) {
  if (!element) return;
  gsap.fromTo(
    element,
    { opacity: 0, x: -100, rotationY: 10 },
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

/**
 * Slide out to right
 */
export function slideOutRight(element: HTMLElement, duration = 0.4) {
  if (!element) return;
  return new Promise<void>((resolve) => {
    gsap.to(element, {
      opacity: 0,
      x: 100,
      rotationY: -10,
      duration,
      ease: 'power3.in',
      onComplete: () => resolve()
    });
  });
}

/**
 * Bounce in animation
 */
export function bounceIn(element: HTMLElement, duration = 0.6) {
  if (!element) return;
  gsap.fromTo(
    element,
    { opacity: 0, scale: 0.3, y: 50 },
    {
      opacity: 1,
      scale: 1,
      y: 0,
      duration,
      ease: 'elastic.out(1.2, 0.75)'
    }
  );
}

/**
 * Bounce out animation
 */
export function bounceOut(element: HTMLElement, duration = 0.5) {
  if (!element) return;
  return new Promise<void>((resolve) => {
    gsap.to(element, {
      opacity: 0,
      scale: 0.3,
      y: 50,
      duration,
      ease: 'back.in(1.5)',
      onComplete: () => resolve()
    });
  });
}

/**
 * Flip in animation
 */
export function flipIn(element: HTMLElement, duration = 0.6) {
  if (!element) return;
  gsap.fromTo(
    element,
    { opacity: 0, rotationY: -180, scale: 0.9 },
    {
      opacity: 1,
      rotationY: 0,
      scale: 1,
      duration,
      ease: 'cubic.out'
    }
  );
}

/**
 * Wobble animation (for attention)
 */
export function wobble(element: HTMLElement) {
  if (!element) return;
  const timeline = gsap.timeline();
  
  timeline
    .to(element, { rotationZ: 3, duration: 0.1 })
    .to(element, { rotationZ: -3, duration: 0.1 })
    .to(element, { rotationZ: 3, duration: 0.1 })
    .to(element, { rotationZ: -3, duration: 0.1 })
    .to(element, { rotationZ: 0, duration: 0.1 });
}

/**
 * Heartbeat animation
 */
export function heartbeat(element: HTMLElement) {
  if (!element) return;
  const timeline = gsap.timeline();
  
  timeline
    .to(element, { scale: 1.1, duration: 0.1 })
    .to(element, { scale: 1, duration: 0.1 })
    .to(element, { scale: 1.1, duration: 0.1 })
    .to(element, { scale: 1, duration: 0.1 });
}

/**
 * Swing animation
 */
export function swing(element: HTMLElement) {
  if (!element) return;
  gsap.to(element, {
    rotationZ: 5,
    duration: 0.4,
    ease: 'sine.inOut',
    repeat: 3,
    yoyo: true,
    transformOrigin: '50% 0%'
  });
}

/**
 * Tada animation (celebration)
 */
export function tada(element: HTMLElement) {
  if (!element) return;
  const timeline = gsap.timeline();
  
  timeline
    .to(element, {
      rotationZ: -3,
      scale: 0.9,
      duration: 0.1
    })
    .to(element, {
      rotationZ: 3,
      scale: 1.1,
      duration: 0.1
    }, 0.1)
    .to(element, {
      rotationZ: -3,
      scale: 0.9,
      duration: 0.1
    }, 0.2)
    .to(element, {
      rotationZ: 3,
      scale: 1.1,
      duration: 0.1
    }, 0.3)
    .to(element, {
      rotationZ: 0,
      scale: 1,
      duration: 0.1
    }, 0.4);
}

/**
 * Jello animation
 */
export function jello(element: HTMLElement) {
  if (!element) return;
  gsap.to(element, {
    skewX: 12.5,
    duration: 0.08,
    repeat: 4,
    yoyo: true
  });
}

/**
 * Pulse animation
 */
export function pulse(element: HTMLElement, duration = 1) {
  if (!element) return;
  gsap.to(element, {
    opacity: 0.6,
    scale: 1.05,
    duration: duration / 2,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });
}

/**
 * Blink animation
 */
export function blink(element: HTMLElement) {
  if (!element) return;
  gsap.to(element, {
    opacity: 0,
    duration: 0.1,
    repeat: 5,
    yoyo: true
  });
}

/**
 * Create a timeline for complex sequences
 */
export function createAnimationTimeline() {
  return gsap.timeline();
}

/**
 * Get progress of an animation element (0-1)
 */
export function getAnimationProgress(target: HTMLElement): number {
  const animation = gsap.getProperty(target, 'duration');
  return gsap.getProperty(target, 'progress') as number || 0;
}

/**
 * Kill all animations on an element
 */
export function killAnimations(element: HTMLElement) {
  gsap.killTweensOf(element);
}

/**
 * Kill all animations globally
 */
export function killAllAnimations() {
  gsap.killAll();
}

/**
 * Pause all animations
 */
export function pauseAllAnimations() {
  gsap.globalTimeline.pause();
}

/**
 * Resume all animations
 */
export function resumeAllAnimations() {
  gsap.globalTimeline.resume();
}