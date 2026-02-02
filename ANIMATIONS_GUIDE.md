# GSAP Animations Guide

This guide documents the premium GSAP animations implemented throughout the form builder application.

## Overview

The animations system uses GSAP 3.14+ with professional-grade easing functions and effects. All animations are performance-optimized and use cubic bezier easing for smooth motion.

## Core Animation Functions

### Entry Animations

#### `animateIn(element, delay)`
Premium fade and scale entry animation with elastic easing.
- **Duration**: 0.6s
- **Effects**: Opacity, scale, Y position, rotation
- **Easing**: `elastic.out(1, 0.5)`

```typescript
import { animateIn } from '$lib/animations';

animateIn(element, 0.1); // with 100ms delay
```

#### `bounceIn(element, duration)`
Bounce in animation with elastic effect.
- **Duration**: 0.6s (default)
- **Effects**: Opacity, scale, Y position
- **Easing**: `elastic.out(1.2, 0.75)`

```typescript
import { bounceIn } from '$lib/animations';

bounceIn(element, 0.5); // 500ms duration
```

#### `flipIn(element, duration)`
Flip in animation with 3D perspective.
- **Duration**: 0.6s (default)
- **Effects**: Opacity, rotation (Y axis), scale
- **Easing**: `cubic.out`

```typescript
import { flipIn } from '$lib/animations';

flipIn(element, 0.6);
```

#### `zoomIn(element, duration)`
Zoom in animation with scale effect.
- **Duration**: 0.4s (default)
- **Effects**: Opacity, scale
- **Easing**: `back.out(1.5)`

```typescript
import { zoomIn } from '$lib/animations';

zoomIn(element, 0.4);
```

#### `slideInLeft(element, duration)`
Slide in from left with rotation.
- **Duration**: 0.5s (default)
- **Effects**: Opacity, X position, rotation Y
- **Easing**: `power3.out`

```typescript
import { slideInLeft } from '$lib/animations';

slideInLeft(element, 0.5);
```

#### `slideInRight(element, duration)`
Slide in from right with rotation.
- **Duration**: 0.5s (default)
- **Effects**: Opacity, X position, rotation Y
- **Easing**: `power3.out`

```typescript
import { slideInRight } from '$lib/animations';

slideInRight(element, 0.5);
```

#### `rotateIn(element, duration)`
Rotate in animation with scale.
- **Duration**: 0.6s (default)
- **Effects**: Opacity, rotation Z, scale
- **Easing**: `cubic.out`

```typescript
import { rotateIn } from '$lib/animations';

rotateIn(element, 0.6);
```

### Exit Animations

#### `animateOut(element, duration)`
Smooth slide up and fade out exit animation.
- **Duration**: 0.4s (default)
- **Effects**: Opacity, Y position, scale, rotation
- **Easing**: `power3.in`

```typescript
import { animateOut } from '$lib/animations';

await animateOut(element, 0.4);
```

#### `zoomOut(element, duration)`
Zoom out animation.
- **Duration**: 0.4s (default)
- **Effects**: Opacity, scale
- **Easing**: `back.in(1.5)`

```typescript
import { zoomOut } from '$lib/animations';

await zoomOut(element, 0.4);
```

#### `slideOutLeft(element, duration)`
Slide out to left.
- **Duration**: 0.4s (default)
- **Effects**: Opacity, X position, rotation Y
- **Easing**: `power3.in`

```typescript
import { slideOutLeft } from '$lib/animations';

await slideOutLeft(element, 0.4);
```

#### `slideOutRight(element, duration)`
Slide out to right.
- **Duration**: 0.4s (default)
- **Effects**: Opacity, X position, rotation Y
- **Easing**: `power3.in`

```typescript
import { slideOutRight } from '$lib/animations';

await slideOutRight(element, 0.4);
```

#### `bounceOut(element, duration)`
Bounce out animation.
- **Duration**: 0.5s (default)
- **Effects**: Opacity, scale, Y position
- **Easing**: `back.in(1.5)`

```typescript
import { bounceOut } from '$lib/animations';

await bounceOut(element, 0.5);
```

### Transition Animations

#### `slideQuestion(element, direction, duration)`
Premium slide question transition with perspective.
- **Duration**: 0.5s (default)
- **Direction**: `'next'` or `'prev'`
- **Effects**: Opacity, X position, rotation Y
- **Easing**: `cubic.out`

```typescript
import { slideQuestion } from '$lib/animations';

slideQuestion(element, 'next', 0.5);
slideQuestion(element, 'prev', 0.5);
```

#### `pageTransition(currentElement, nextElement)`
Smooth page transition with fade.
- **Duration**: 0.4s (staggered)
- **Effects**: Opacity, Y position
- **Easing**: `cubic.in/out`

```typescript
import { pageTransition } from '$lib/animations';

await pageTransition(currentEl, nextEl);
```

#### `slideDropdown(element)`
Premium dropdown slide down animation.
- **Duration**: 0.35s
- **Effects**: Opacity, Y position, scaleY
- **Easing**: `back.out(1.2)`

```typescript
import { slideDropdown } from '$lib/animations';

slideDropdown(dropdownEl);
```

#### `slideDropdownOut(element)`
Smooth dropdown slide up animation.
- **Duration**: 0.2s
- **Effects**: Opacity, Y position, scaleY
- **Easing**: `power3.in`

```typescript
import { slideDropdownOut } from '$lib/animations';

await slideDropdownOut(dropdownEl);
```

### Attention-Seeking Animations

#### `shakeElement(element)`
Enhanced shake animation for validation errors.
- **Effects**: X position, background color pulse
- **Repeats**: 4 times
- **Duration**: 0.08s per shake

```typescript
import { shakeElement } from '$lib/animations';

shakeElement(inputElement);
```

#### `bounceError(element)`
Enhanced error bounce animation with color.
- **Duration**: 0.4s
- **Effects**: Opacity, Y position, background color
- **Easing**: `back.out(1.5)`

```typescript
import { bounceError } from '$lib/animations';

bounceError(errorElement);
```

#### `wobble(element)`
Wobble animation for attention.
- **Duration**: 0.5s total
- **Effects**: Rotation Z
- **Repeats**: 4 times

```typescript
import { wobble } from '$lib/animations';

wobble(element);
```

#### `heartbeat(element)`
Heartbeat animation.
- **Duration**: 0.4s total
- **Effects**: Scale
- **Repeats**: 2 times

```typescript
import { heartbeat } from '$lib/animations';

heartbeat(element);
```

#### `swing(element)`
Swing animation.
- **Duration**: 0.4s
- **Effects**: Rotation Z
- **Repeats**: 3 times
- **Origin**: Top center

```typescript
import { swing } from '$lib/animations';

swing(element);
```

#### `tada(element)`
Tada celebration animation.
- **Duration**: 0.5s total
- **Effects**: Rotation Z, scale
- **Repeats**: 4 times

```typescript
import { tada } from '$lib/animations';

tada(element);
```

#### `jello(element)`
Jello animation.
- **Duration**: 0.32s total
- **Effects**: Skew X
- **Repeats**: 4 times

```typescript
import { jello } from '$lib/animations';

jello(element);
```

#### `blink(element)`
Blink animation.
- **Duration**: 0.6s total
- **Effects**: Opacity
- **Repeats**: 5 times

```typescript
import { blink } from '$lib/animations';

blink(element);
```

### Progress & Status Animations

#### `animateProgress(element, progress, duration)`
Premium progress bar animation.
- **Duration**: 0.7s (default)
- **Property**: width
- **Easing**: `power3.out`

```typescript
import { animateProgress } from '$lib/animations';

animateProgress(progressBar, 75, 0.7);
```

#### `animateCheckmark(element)`
Premium checkmark animation.
- **Duration**: 0.5s
- **Effects**: Scale, opacity, rotation Z
- **Easing**: `elastic.out(1, 0.5)`

```typescript
import { animateCheckmark } from '$lib/animations';

animateCheckmark(checkmarkElement);
```

#### `pulse(element, duration)`
Continuous pulse animation.
- **Duration**: 1s (default)
- **Effects**: Opacity, scale
- **Easing**: `sine.inOut`
- **Repeats**: Infinite

```typescript
import { pulse } from '$lib/animations';

pulse(element, 1.0);
```

#### `colorPulse(element, color)`
Premium color pulse animation with glow.
- **Duration**: 0.8s
- **Effects**: Box shadow (glow effect)
- **Easing**: `power2.out`

```typescript
import { colorPulse } from '$lib/animations';

colorPulse(element, '#3b82f6');
```

### Interaction Animations

#### `focusInputField(element)`
Premium input field focus animation with glow.
- **Duration**: 0.3s
- **Effects**: Box shadow
- **Easing**: `power2.out`

```typescript
import { focusInputField } from '$lib/animations';

inputElement.addEventListener('focus', () => {
  focusInputField(inputElement);
});
```

#### `blurInputField(element)`
Smooth input field blur animation.
- **Duration**: 0.3s
- **Effects**: Box shadow
- **Easing**: `power2.out`

```typescript
import { blurInputField } from '$lib/animations';

inputElement.addEventListener('blur', () => {
  blurInputField(inputElement);
});
```

#### `pressButton(element)`
Enhanced button press animation.
- **Duration**: 0.25s total
- **Effects**: Scale
- **Easing**: `power2.in/out`

```typescript
import { pressButton } from '$lib/animations';

button.addEventListener('click', () => {
  pressButton(button);
});
```

#### `rippleEffect(element, event)`
Premium ripple click animation.
- **Duration**: 0.7s
- **Effects**: Radial expansion, opacity
- **Easing**: `power2.out`

```typescript
import { rippleEffect } from '$lib/animations';

element.addEventListener('click', (event) => {
  rippleEffect(element, event as MouseEvent);
});
```

#### `flipCard(element, duration)`
Premium flip card animation.
- **Duration**: 0.6s (default)
- **Effects**: Rotation Y (360°)
- **Easing**: `back.inOut(1.2)`

```typescript
import { flipCard } from '$lib/animations';

flipCard(cardElement, 0.6);
```

### Batch & Grouped Animations

#### `staggerElements(elements, duration, staggerDelay)`
Stagger animation for multiple elements.
- **Duration**: 0.5s (default)
- **Stagger Delay**: 0.12s (default)
- **Effects**: Opacity, Y position, rotation X
- **Easing**: `elastic.out(1, 0.6)`

```typescript
import { staggerElements } from '$lib/animations';

const elements = document.querySelectorAll('.item');
staggerElements(Array.from(elements), 0.5, 0.12);
```

### Timeline Management

#### `createAnimationTimeline()`
Create a custom animation timeline for complex sequences.

```typescript
import { createAnimationTimeline } from '$lib/animations';

const timeline = createAnimationTimeline();
timeline.to(element1, { duration: 0.5, opacity: 1 });
timeline.to(element2, { duration: 0.5, opacity: 1 }, 0.2);
timeline.play();
```

#### `killAnimations(element)`
Kill all animations on a specific element.

```typescript
import { killAnimations } from '$lib/animations';

killAnimations(element);
```

#### `killAllAnimations()`
Kill all active animations globally.

```typescript
import { killAllAnimations } from '$lib/animations';

killAllAnimations();
```

#### `pauseAllAnimations()`
Pause all active animations.

```typescript
import { pauseAllAnimations } from '$lib/animations';

pauseAllAnimations();
```

#### `resumeAllAnimations()`
Resume all paused animations.

```typescript
import { resumeAllAnimations } from '$lib/animations';

resumeAllAnimations();
```

## Animation Types for Forms

Available animation types for form blocks:

- **fade**: Classic fade in effect
- **slide**: Slide up animation
- **pulse**: Continuous pulse effect
- **bounce**: Elastic bounce in
- **zoom**: Scale zoom in
- **flip**: 3D flip animation
- **rotate**: Rotate in effect
- **slideLeft**: Slide from left
- **slideRight**: Slide from right
- **wobble**: Wobble attention effect
- **heartbeat**: Heartbeat pulse
- **swing**: Swing motion
- **tada**: Celebration tada
- **jello**: Jello wiggle
- **blink**: Blinking effect

## GSAP Easing Functions Used

### Primary Eases
- `elastic.out(1, 0.5)` - Elastic bounce at end
- `back.out(1.5)` - Overshoot at end
- `cubic.out` - Smooth deceleration
- `power3.out` - Strong deceleration
- `power3.in` - Strong acceleration
- `cubic.in` - Smooth acceleration
- `sine.inOut` - Smooth in and out

### Secondary Eases
- `power2.out` - Medium deceleration
- `power2.in` - Medium acceleration

## Performance Tips

1. **Use appropriate durations**: Keep animations between 0.3s-0.7s for UI feedback
2. **Avoid simultaneous animations**: Stagger animations for better visual flow
3. **Clean up**: Always kill animations when elements are removed
4. **GPU acceleration**: GSAP automatically optimizes for GPU when possible
5. **Use timelines**: For complex sequences, use timelines instead of nested callbacks

## Browser Support

All GSAP animations are compatible with:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Dependencies

- `gsap@^3.14.2` - Core library
- `gsap/dist/Draggable` - Draggable plugin (for swipe support)

## Examples

### Form Entry Animation
```typescript
import { animateIn, staggerElements } from '$lib/animations';

// On form load
animateIn(formContainer, 0);

// Animate all questions in stagger
const questions = Array.from(document.querySelectorAll('.question'));
staggerElements(questions, 0.5, 0.15);
```

### Form Submission
```typescript
import { tada, animateCheckmark } from '$lib/animations';

// Show success
tada(successMessage);
animateCheckmark(successIcon);
```

### Validation Feedback
```typescript
import { shakeElement, bounceError } from '$lib/animations';

// On validation error
if (hasError) {
  shakeElement(inputField);
  bounceError(errorMessage);
}
```

### Question Navigation
```typescript
import { slideOutRight, slideInLeft } from '$lib/animations';

async function navigateToNextQuestion() {
  await slideOutRight(currentQuestion);
  await slideInLeft(nextQuestion);
}
```

## Advanced Usage

### Custom Timeline for Complex Sequences
```typescript
import { createAnimationTimeline } from '$lib/animations';

const timeline = createAnimationTimeline();

timeline
  .to(element1, { opacity: 1, duration: 0.5 })
  .to(element2, { opacity: 1, duration: 0.5 }, 0.1)
  .to(element3, { opacity: 1, duration: 0.5 }, 0.2);

// Control timeline
timeline.pause();
timeline.resume();
timeline.reverse();
timeline.seek(1.5); // Jump to 1.5 seconds
```

## References

- [GSAP Documentation](https://gsap.com/docs/v3/)
- [GSAP Plugins](https://gsap.com/docs/v3/Plugins)
- [Easing Visualizer](https://gsap.com/docs/v3/Eases)
