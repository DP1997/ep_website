const header = document.querySelector('.site-head');
const container = document.querySelector('.site-head-container');
const burger = document.querySelector('.nav-burger');
const navLeft = document.querySelector('.site-head-left');
const navRight = document.querySelector('.site-head-right');
const logo = document.querySelector('.site-head-logo');

// --- Burger click toggle ---
if (burger) {
    burger.addEventListener('click', (e) => {
        e.preventDefault();
        header.classList.toggle('site-head-open');
        document.body.classList.toggle('menu-open');
    });
}

// Close menu when a nav link is clicked
document.querySelectorAll('.site-head-left a, .site-head-right a').forEach(link => {
    link.addEventListener('click', () => {
        header.classList.remove('site-head-open');
        document.body.classList.remove('menu-open');
    });
});

// --- Collision detection ---
function checkCollision() {
    // Exit early if elements aren't found
    if (!logo || !navLeft || !navRight) {
        console.log('Missing elements:', { logo, navLeft, navRight });
        return;
    }
    
        // If menu is open, check if we should close it (zoomed out enough)
        if (header.classList.contains('site-head-open')) {
            // Temporarily disable hamburger to measure natural desktop layout
            // Don't hide burger - we need to measure with it invisible but taking space
            const originalTransition = container.style.transition;
            container.style.transition = 'none'; // Disable transitions during measurement
            header.classList.remove('use-hamburger');
        
            // Force reflow
            void container.offsetWidth;
        
            const logoRect = logo.getBoundingClientRect();
            const leftRect = navLeft.getBoundingClientRect();
            const rightRect = navRight.getBoundingClientRect();
            const GAP = 20;
        
            const overlapsLeft = leftRect.right > logoRect.left - GAP;
            const overlapsRight = rightRect.left < logoRect.right + GAP;
            const needsHamburger = overlapsLeft || overlapsRight;
        
            console.log('Menu open collision check:', {
                leftRight: leftRect.right,
                logoLeft: logoRect.left,
                overlapsLeft,
                rightLeft: rightRect.left,
                logoRight: logoRect.right,
                overlapsRight,
                needsHamburger
            });
        
            // Restore hamburger state (without animation since menu stays open)
            header.classList.add('use-hamburger');
            container.style.transition = originalTransition;
        
            if (!needsHamburger) {
                console.log('Closing menu - enough space');
                // Enough space - close menu and show horizontal nav
                header.classList.remove('site-head-open');
                document.body.classList.remove('menu-open');
                header.classList.remove('use-hamburger');
                if (burger) burger.style.display = 'none';
            } else {
                console.log('Keeping menu open - still needs hamburger');
            }
            return;
        }

    // Hide burger completely during measurement to get accurate flex layout
    if (burger) {
        burger.style.display = 'none';
    }

    // Temporarily remove hamburger class to measure natural layout
    const wasHamburger = header.classList.contains('use-hamburger');
    header.classList.remove('use-hamburger');

    // Force reflow to get accurate measurements
    void container.offsetWidth;

    const logoRect = logo.getBoundingClientRect();
    const leftRect = navLeft.getBoundingClientRect();
    const rightRect = navRight.getBoundingClientRect();

    const GAP = 20;

    // Check if left nav overlaps with logo (left nav's right edge > logo's left edge)
    const overlapsLeft = leftRect.right > logoRect.left - GAP;

    // Check if right nav overlaps with logo (right nav's left edge < logo's right edge)
    const overlapsRight = rightRect.left < logoRect.right + GAP;

    const needsHamburger = overlapsLeft || overlapsRight;

    console.log('Collision check:', {
        leftRight: leftRect.right,
        logoLeft: logoRect.left,
        overlapsLeft,
        rightLeft: rightRect.left,
        logoRight: logoRect.right,
        overlapsRight,
        needsHamburger
    });

    if (needsHamburger) {
        header.classList.add('use-hamburger');
        if (burger) burger.style.display = ''; // Restore default (will be shown via CSS)
    } else {
        // Keep burger hidden
        if (burger) burger.style.display = 'none';
        if (wasHamburger) {
            header.classList.remove('use-hamburger');
        }
    }
}

// Run on resize with a small debounce
let resizeTimeout;
const observer = new ResizeObserver(() => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(checkCollision, 10);
});

if (container) {
    observer.observe(container);
}

// Initial check after a short delay to ensure layout is settled
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(checkCollision, 100);
    });
} else {
    setTimeout(checkCollision, 100);
}

