let lenisInstance = null;
let animationId = null;

// Detect scroll libraries already on the page
function detectScrollLibraries() {
    const detected = [];

    // Common scroll libraries
    if (window.Lenis) detected.push('Lenis');
    if (window.LocomotiveScroll) detected.push('Locomotive Scroll');
    if (window.gsap && window.gsap.scrollTo) detected.push('GSAP ScrollTo');
    if (window.ScrollSmoother) detected.push('ScrollSmoother');
    if (window.ScrollToPlugin) detected.push('ScrollToPlugin');
    if (document.querySelector('[data-locomotive-scroll]')) detected.push('Locomotive (DOM)');
    if (window.SmoothScroll) detected.push('SmoothScroll');
    if (window.Scrollbar) detected.push('Smooth Scrollbar');
    if (window.SimpleBar) detected.push('SimpleBar');
    if (document.querySelector('.smooth-scroll')) detected.push('Smooth Scroll (CSS)');

    // Check for frameworks with scroll features
    if (window.__NEXT_DATA__ && document.querySelector('[data-nextjs-scroll-focus-boundary]')) {
        detected.push('Next.js (Scroll)');
    }
    if (window.__NUXT__) detected.push('Nuxt');
    if (document.documentElement.hasAttribute('data-scroll')) {
        detected.push('Custom Scroll (DOM)');
    }

    return detected;
}

// Get easing function based on setting
function getEasingFunction(type) {
    const easings = {
        expo: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        sine: (t) => {
            return Math.sin((t * Math.PI) / 2);
        },
        quad: (t) => t * t,
        cubic: (t) => t * t * t,
        linear: (t) => t,
    };
    return easings[type] || easings.expo;
}

// Get settings from Chrome storage
function getSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get({
            enabled: true,
            duration: 1.2,
            direction: 'vertical',
            smooth: true,
            lerp: true,
            touchMultiplier: 2,
            smoothTouch: true,
            wheelMultiplier: 1,
            easing: 'expo',
            ignoreSelectors: ''
        }, resolve);
    });
}

// Initialize or reinitialize Lenis
async function initLenis() {
    const settings = await getSettings();

    if (!settings.enabled) {
        if (lenisInstance) {
            lenisInstance.destroy?.();
            lenisInstance = null;
        }
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        return;
    }

    // Lenis is already loaded via manifest.json
    if (window.Lenis) {
        createLenisInstance(settings);
    } else {
        console.warn('Lenis library not available');
    }
}

// Create or recreate Lenis instance
async function createLenisInstance(settings) {
    // Destroy previous instance if it exists
    if (lenisInstance) {
        lenisInstance.destroy?.();
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
    }

    const ignoredElements = settings.ignoreSelectors
        ? Array.from(document.querySelectorAll(settings.ignoreSelectors))
        : [];

    lenisInstance = new window.Lenis({
        duration: settings.duration,
        easing: getEasingFunction(settings.easing),
        direction: settings.direction,
        gestureDirection: settings.direction,
        smooth: settings.smooth,
        smoothTouch: settings.smoothTouch,
        touchMultiplier: settings.touchMultiplier,
        wheelMultiplier: settings.wheelMultiplier,
        lerp: settings.lerp ? 0.1 : 0,
        ignore: ignoredElements,
    });

    // Create animation loop
    function raf(time) {
        lenisInstance.raf(time);
        animationId = requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    console.log('✨ Lenis initialized with settings:', settings);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'UPDATE_LENIS') {
        initLenis();
        sendResponse({ success: true });
    } else if (request.type === 'DETECT_LIBS') {
        const detected = detectScrollLibraries();
        sendResponse({
            detected: detected,
            hasAny: detected.length > 0
        });
    }
});

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLenis);
} else {
    initLenis();
}

// Reinitialize if DOM changes significantly
window.addEventListener('load', initLenis);