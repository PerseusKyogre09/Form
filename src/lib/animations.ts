import { gsap } from 'gsap';

/**
 * Smooth fade and scale entry animation
 */
export function animateIn(element: HTMLElement, delay = 0) {
  if (!element) return;
  gsap.fromTo(
    element,
    { opacity: 0, scale: 0.95, y: 20 },
    { 
      opacity: 1, 
      scale: 1, 
      y: 0, 
      duration: 0.5, 
      ease: 'back.out',
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
        y: -20,
        duration,
        ease: 'power2.in',
        onComplete: () => resolve()
      }
    );
  });
}

/**
 * Slide question transition (left to right, right to left)
 */
export function slideQuestion(element: HTMLElement, direction: 'next' | 'prev', duration = 0.4) {
  if (!element) return;
  
  const fromX = direction === 'next' ? 50 : -50;
  
  gsap.fromTo(
    element,
    { opacity: 0, x: fromX },
    { 
      opacity: 1, 
      x: 0, 
      duration,
      ease: 'power2.out'
    }
  );
}

/**
 * Animate progress bar filling
 */
export function animateProgress(element: HTMLElement, progress: number, duration = 0.6) {
  if (!element) return;
  gsap.to(
    element,
    { 
      width: `${progress}%`, 
      duration,
      ease: 'power2.inOut'
    }
  );
}

/**
 * Shake animation for validation errors
 */
export function shakeElement(element: HTMLElement) {
  if (!element) return;
  gsap.fromTo(
    element,
    { x: 0 },
    {
      x: -8,
      duration: 0.1,
      ease: 'power2.inOut',
      repeat: 3,
      yoyo: true,
      onComplete: () => {
        gsap.set(element, { x: 0 });
      }
    }
  );
}

/**
 * Smooth input field focus animation
 */
export function focusInputField(element: HTMLElement) {
  if (!element) return;
  gsap.to(
    element,
    {
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
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
 * Button press animation
 */
export function pressButton(element: HTMLElement) {
  if (!element) return;
  gsap.fromTo(
    element,
    { scale: 1 },
    {
      scale: 0.95,
      duration: 0.1,
      ease: 'power2.out',
      yoyo: true,
      repeat: 1
    }
  );
}

/**
 * Smooth dropdown slide down animation
 */
export function slideDropdown(element: HTMLElement) {
  if (!element) return;
  gsap.fromTo(
    element,
    { opacity: 0, y: -10, scaleY: 0.9 },
    {
      opacity: 1,
      y: 0,
      scaleY: 1,
      duration: 0.3,
      ease: 'back.out',
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
        y: -10,
        scaleY: 0.9,
        duration: 0.2,
        ease: 'power2.in',
        transformOrigin: 'top center',
        onComplete: () => resolve()
      }
    );
  });
}

/**
 * Checkmark animation (success)
 */
export function animateCheckmark(element: HTMLElement) {
  if (!element) return;
  gsap.fromTo(
    element,
    { scale: 0, opacity: 0 },
    {
      scale: 1,
      opacity: 1,
      duration: 0.4,
      ease: 'back.out'
    }
  );
}

/**
 * Error bounce animation
 */
export function bounceError(element: HTMLElement) {
  if (!element) return;
  gsap.fromTo(
    element,
    { opacity: 0, y: 10 },
    {
      opacity: 1,
      y: 0,
      duration: 0.3,
      ease: 'back.out'
    }
  );
}

/**
 * Stagger animation for multiple elements
 */
export function staggerElements(elements: HTMLElement[], duration = 0.4, staggerDelay = 0.1) {
  if (!elements.length) return;
  gsap.fromTo(
    elements,
    { opacity: 0, y: 20 },
    {
      opacity: 1,
      y: 0,
      duration,
      ease: 'power2.out',
      stagger: staggerDelay
    }
  );
}

/**
 * Color pulse animation (for highlights)
 */
export function colorPulse(element: HTMLElement, color: string = '#3b82f6') {
  if (!element) return;
  gsap.to(
    element,
    {
      boxShadow: `0 0 0 10px rgba(59, 130, 246, 0.5)`,
      duration: 0.6,
      ease: 'power2.out',
      onComplete: () => {
        gsap.set(element, { boxShadow: 'none' });
      }
    }
  );
}

/**
 * Smooth page transition (fade out current, fade in next)
 */
export function pageTransition(currentElement: HTMLElement, nextElement: HTMLElement) {
  return new Promise<void>((resolve) => {
    gsap.to(currentElement, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        gsap.fromTo(
          nextElement,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.3,
            ease: 'power2.out',
            onComplete: () => resolve()
          }
        );
      }
    });
  });
}

/**
 * Ripple click animation
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
  ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
  ripple.style.pointerEvents = 'none';
  ripple.style.transform = 'translate(-50%, -50%)';

  element.style.position = 'relative';
  element.style.overflow = 'hidden';
  element.appendChild(ripple);

  gsap.to(ripple, {
    width: radius * 2,
    height: radius * 2,
    opacity: 0,
    duration: 0.6,
    ease: 'power2.out',
    onComplete: () => ripple.remove()
  });
}
