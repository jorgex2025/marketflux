# GSAP Animations in MarketFlux

This document outlines the GSAP (GreenSock Animation Platform) animations implemented in the MarketFlux marketplace.

## 🚀 Overview

GSAP animations have been integrated throughout the marketplace to create a smooth, engaging user experience. All animations are performance-optimized and respect user preferences for reduced motion.

## 📦 Dependencies

- `gsap` - Core animation library
- `@gsap/react` - React integration with `useGSAP` hook

## 🎬 Animation Components

### 1. AnimatedHero
**Location:** `src/components/animated/AnimatedHero.tsx`

**Features:**
- Text reveal animation with staggered timing
- Floating background elements
- Gradient background animation
- Responsive scaling

**Usage:**
```tsx
import { AnimatedHero } from '@/components/animated/AnimatedHero';

<AnimatedHero />
```

### 2. AnimatedProductGrid
**Location:** `src/components/animated/AnimatedProductGrid.tsx`

**Features:**
- Staggered product card entrance animations
- Hover effects with scale and lift animations
- Scroll-triggered title animation

**Usage:**
```tsx
import { AnimatedProductGrid } from '@/components/animated/AnimatedProductGrid';

<AnimatedProductGrid products={featuredProducts} />
```

### 3. ScrollReveal
**Location:** `src/components/animated/ScrollReveal.tsx`

**Features:**
- Elements animate in when scrolled into view
- Multiple direction options (up, down, left, right, fade)
- Configurable delay and duration
- Intersection Observer-based triggering

**Usage:**
```tsx
import { ScrollReveal } from '@/components/animated/ScrollReveal';

<ScrollReveal direction="up" delay={0.2}>
  <YourContent />
</ScrollReveal>
```

### 4. FloatingElement
**Location:** `src/components/animated/FloatingElement.tsx`

**Features:**
- Continuous floating animation
- Configurable Y and X offsets
- Adjustable duration and delay

**Usage:**
```tsx
import { FloatingElement } from '@/components/animated/FloatingElement';

<FloatingElement yOffset={10} duration={3}>
  <YourElement />
</FloatingElement>
```

### 5. PageTransition
**Location:** `src/components/animated/PageTransition.tsx`

**Features:**
- Smooth page entrance animations
- Automatic cleanup on route changes

**Usage:**
- Automatically applied via root layout

## 🎯 Specific Animations

### Homepage
- **Hero Section:** Text reveal with gradient background animation
- **Product Grid:** Staggered card entrance with hover effects
- **Stats Section:** Floating stats cards with scroll reveal
- **CTA Section:** Fade-in animation with floating background elements

### Navigation
- **Logo:** Scale animation on hover
- **Nav Links:** Lift animation on hover
- **Cart Icon:** Bounce animation when items change

### Cart Drawer
- **Slide-in:** Smooth slide from right with overlay fade
- **Items:** Staggered entrance animation
- **Hover Effects:** Background color transitions

## 🔧 Technical Implementation

### GSAP Setup
```tsx
// src/lib/gsap.ts - Core GSAP configuration
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

// Client-side only registration
if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}
```

### Provider Pattern
```tsx
// src/components/providers/gsap-provider.tsx
export function GSAPProvider({ children }) {
  useEffect(() => {
    gsap.registerPlugin(useGSAP, ScrollTrigger);
    // Cleanup on unmount
    return () => ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  }, []);

  return <>{children}</>;
}
```

### Hook Usage
```tsx
useGSAP(() => {
  // GSAP animations here
  gsap.fromTo(element, { opacity: 0 }, { opacity: 1 });
}, { scope: containerRef, dependencies: [data] });
```

## 📱 Responsive Design

All animations are responsive and adapt to different screen sizes:
- Reduced motion on mobile devices
- Optimized performance across devices
- Touch-friendly hover states

## ♿ Accessibility

- Respects `prefers-reduced-motion` setting
- Semantic HTML preserved
- Screen reader compatible
- Focus management maintained

## 🚀 Performance

- Tree-shaking enabled
- Minimal bundle size impact
- Hardware acceleration utilized
- Automatic cleanup prevents memory leaks

## 🎨 Customization

Animations can be easily customized by modifying:
- Duration and easing values
- Animation directions and offsets
- Color schemes and gradients
- Trigger points and delays

## 📝 Future Enhancements

Potential additions:
- Loading state animations
- Micro-interactions for buttons
- Page transition effects
- Skeleton loading animations
- Notification animations