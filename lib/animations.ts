// Animation utilities for AQUI app using ReactBits-inspired animations
// Based on recommendations from ReactBits.dev components

import { useEffect, useRef } from 'react';

// Animation configuration types
export interface AnimationConfig {
  duration?: number;
  delay?: number;
  ease?: string;
  threshold?: number;
  stagger?: number;
}

// Default animation configurations
export const animationDefaults: AnimationConfig = {
  duration: 0.6,
  delay: 0,
  ease: 'power3.out',
  threshold: 0.1,
  stagger: 100,
};

// Fade In Up Animation (for vendor cards)
export const useFadeInUp = (config: AnimationConfig = {}) => {
  const ref = useRef<HTMLDivElement>(null);
  const finalConfig = { ...animationDefaults, ...config };

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Set initial state
    element.style.opacity = '0';
    element.style.transform = 'translateY(40px)';
    element.style.transition = `opacity ${finalConfig.duration}s ${finalConfig.ease}, transform ${finalConfig.duration}s ${finalConfig.ease}`;

    // Create intersection observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              element.style.opacity = '1';
              element.style.transform = 'translateY(0)';
            }, finalConfig.delay);
            observer.unobserve(element);
          }
        });
      },
      { threshold: finalConfig.threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [finalConfig]);

  return ref;
};

// Pop In Animation (for map markers)
export const usePopIn = (config: AnimationConfig = {}) => {
  const ref = useRef<HTMLDivElement>(null);
  const finalConfig = { ...animationDefaults, ...config };

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.style.opacity = '0';
    element.style.transform = 'scale(0.8)';
    element.style.transition = `opacity ${finalConfig.duration}s ${finalConfig.ease}, transform ${finalConfig.duration}s ${finalConfig.ease}`;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              element.style.opacity = '1';
              element.style.transform = 'scale(1)';
            }, finalConfig.delay);
            observer.unobserve(element);
          }
        });
      },
      { threshold: finalConfig.threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [finalConfig]);

  return ref;
};

// Slide In Bottom Animation (for modals)
export const useSlideInBottom = (config: AnimationConfig = {}) => {
  const ref = useRef<HTMLDivElement>(null);
  const finalConfig = { ...animationDefaults, ...config };

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.style.opacity = '0';
    element.style.transform = 'translateY(100%)';
    element.style.transition = `opacity ${finalConfig.duration}s ${finalConfig.ease}, transform ${finalConfig.duration}s ${finalConfig.ease}`;

    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    }, finalConfig.delay);
  }, [finalConfig]);

  return ref;
};

// Bounce Fade In Animation (for toasts)
export const useBounceFadeIn = (config: AnimationConfig = {}) => {
  const ref = useRef<HTMLDivElement>(null);
  const finalConfig = { ...animationDefaults, ...config, ease: 'elastic.out(1, 0.3)' };

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.style.opacity = '0';
    element.style.transform = 'scale(0.3)';
    element.style.transition = `opacity ${finalConfig.duration}s ${finalConfig.ease}, transform ${finalConfig.duration}s ${finalConfig.ease}`;

    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'scale(1)';
    }, finalConfig.delay);
  }, [finalConfig]);

  return ref;
};

// Cross Fade Animation (for page transitions)
export const useCrossFade = (config: AnimationConfig = {}) => {
  const ref = useRef<HTMLImageElement>(null);
  const finalConfig = { ...animationDefaults, ...config };

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.style.opacity = '0';
    element.style.transition = `opacity ${finalConfig.duration}s ${finalConfig.ease}`;

    setTimeout(() => {
      element.style.opacity = '1';
    }, finalConfig.delay);
  }, [finalConfig]);

  return ref;
};

// Pulse Animation (for live status badge)
export const usePulse = (isActive: boolean = true) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (isActive) {
      element.style.animation = 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite';
    } else {
      element.style.animation = 'none';
    }
  }, [isActive]);

  return ref;
};

// Heart Beat Animation (for favorites button)
export const useHeartBeat = (trigger: boolean) => {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !trigger) return;

    element.style.animation = 'heartbeat 0.6s ease-in-out';
    
    const timeout = setTimeout(() => {
      element.style.animation = 'none';
    }, 600);

    return () => clearTimeout(timeout);
  }, [trigger]);

  return ref;
};

// Spin Animation (for loading spinners)
export const useSpin = (isActive: boolean) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (isActive) {
      element.style.animation = 'spin 1s linear infinite';
    } else {
      element.style.animation = 'none';
    }
  }, [isActive]);

  return ref;
};

// Spin Animation for SVG elements
export const useSpinSVG = (isActive: boolean) => {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (isActive) {
      element.style.animation = 'spin 1s linear infinite';
    } else {
      element.style.animation = 'none';
    }
  }, [isActive]);

  return ref;
};

// Flip In X Animation (for vendor switcher)
export const useFlipInX = (config: AnimationConfig = {}) => {
  const ref = useRef<HTMLDivElement>(null);
  const finalConfig = { ...animationDefaults, ...config };

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.style.opacity = '0';
    element.style.transform = 'rotateX(-90deg)';
    element.style.transition = `opacity ${finalConfig.duration}s ${finalConfig.ease}, transform ${finalConfig.duration}s ${finalConfig.ease}`;

    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'rotateX(0deg)';
    }, finalConfig.delay);
  }, [finalConfig]);

  return ref;
};

// Slide Down Animation (for filter dropdowns)
export const useSlideDown = (isOpen: boolean, config: AnimationConfig = {}) => {
  const ref = useRef<HTMLDivElement>(null);
  const finalConfig = { ...animationDefaults, ...config, duration: 0.3 };

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (isOpen) {
      element.style.opacity = '0';
      element.style.transform = 'translateY(-10px) scaleY(0.8)';
      element.style.transformOrigin = 'top';
      element.style.transition = `opacity ${finalConfig.duration}s ${finalConfig.ease}, transform ${finalConfig.duration}s ${finalConfig.ease}`;
      
      setTimeout(() => {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0) scaleY(1)';
      }, 10);
    } else {
      element.style.opacity = '0';
      element.style.transform = 'translateY(-10px) scaleY(0.8)';
    }
  }, [isOpen, finalConfig]);

  return ref;
};

// Staggered Animation for lists
export const useStaggeredAnimation = (itemCount: number, config: AnimationConfig = {}) => {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const finalConfig = { ...animationDefaults, ...config };

  useEffect(() => {
    refs.current.forEach((element, index) => {
      if (!element) return;

      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
      element.style.transition = `opacity ${finalConfig.duration}s ${finalConfig.ease}, transform ${finalConfig.duration}s ${finalConfig.ease}`;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setTimeout(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
              }, index * (finalConfig.stagger || 100));
              observer.unobserve(element);
            }
          });
        },
        { threshold: finalConfig.threshold }
      );

      observer.observe(element);
    });
  }, [itemCount, finalConfig]);

  const setRef = (index: number) => (el: HTMLDivElement | null) => {
    refs.current[index] = el;
  };

  return setRef;
};

// CSS keyframes for animations (to be added to globals.css)
export const animationKeyframes = `
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes heartbeat {
  0% {
    transform: scale(1);
  }
  14% {
    transform: scale(1.3);
  }
  28% {
    transform: scale(1);
  }
  42% {
    transform: scale(1.3);
  }
  70% {
    transform: scale(1);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slideInBottom {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounceFadeIn {
  from {
    opacity: 0;
    transform: scale(0.3);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes flipInX {
  from {
    opacity: 0;
    transform: rotateX(-90deg);
  }
  to {
    opacity: 1;
    transform: rotateX(0deg);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px) scaleY(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scaleY(1);
  }
}
`;