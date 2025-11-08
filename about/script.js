(function() {
    'use strict';

    // Intersection Observer for section visibility
    const sections = document.querySelectorAll('.section');
    const observerOptions = {
        threshold: 0.3,
        rootMargin: '0px'
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const section = entry.target;
                const sectionNum = section.dataset.section;

                // Section 2: Word-by-word fade in
                if (sectionNum === '2') {
                    const words = section.querySelectorAll('.word');
                    words.forEach((word, index) => {
                        setTimeout(() => {
                            word.classList.add('fade-in');
                        }, index * 80);
                    });
                }

                // Section 3: Slide in work content
                if (sectionNum === '3') {
                    const heading = section.querySelector('.work-heading');
                    const right = section.querySelector('.work-right');
                    if (heading) heading.classList.add('slide-in');
                    if (right) right.classList.add('slide-in');
                }

                // Section 4: Fade in vision and add warmer gradient
                if (sectionNum === '4') {
                    section.classList.add('in-view');
                    const main = section.querySelector('.vision-main');
                    const sub = section.querySelector('.vision-sub');
                    if (main) main.classList.add('fade-in');
                    if (sub) sub.classList.add('fade-in');
                } else {
                    // Remove warm gradient from other sections
                    const visionSection = document.querySelector('.section-vision');
                    if (visionSection) visionSection.classList.remove('in-view');
                }

                // Parallax fade effect for other sections
                sections.forEach(sec => {
                    if (sec !== section) {
                        sec.classList.add('fade-out');
                    } else {
                        sec.classList.remove('fade-out');
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        sectionObserver.observe(section);
    });

    // Idle detection at bottom
    let idleTimer = null;
    let lastScrollTop = 0;
    let scrollTimer = null;
    const IDLE_TIME = 5000; // 5 seconds
    const BOTTOM_THRESHOLD = 50; // pixels from bottom

    function checkIfAtBottom() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const distanceFromBottom = documentHeight - (scrollTop + windowHeight);

        return distanceFromBottom <= BOTTOM_THRESHOLD;
    }

    function resetIdleTimer() {
        clearTimeout(idleTimer);
        
        if (checkIfAtBottom()) {
            idleTimer = setTimeout(() => {
                triggerIdleFade();
            }, IDLE_TIME);
        }
    }

    function triggerIdleFade() {
        // Prevent multiple triggers
        if (document.body.classList.contains('fade-to-white')) return;

        // Step 1: Fade out all text in 2s
        const allText = document.querySelectorAll('h1, h2, p, .word, .label');
        allText.forEach(el => {
            el.style.transition = 'opacity 2s ease';
            el.style.opacity = '0';
        });

        // Step 2: After text fades, fade background to white in 3s
        setTimeout(() => {
            document.body.classList.add('fade-to-white');
            
            // Stop gradient animation
            const style = document.createElement('style');
            style.textContent = 'body::before { animation: none !important; }';
            document.head.appendChild(style);

            // Fade out cursor
            document.body.style.cursor = 'none';
        }, 2000);

        // Step 3: Redirect after total 5s (2s text fade + 3s bg fade)
        setTimeout(() => {
            window.location.href = 'https://brandontnova.com';
        }, 5000);
    }

    // Track scroll and mouse movement
    let lastActivity = Date.now();

    function updateActivity() {
        lastActivity = Date.now();
        resetIdleTimer();
    }

    window.addEventListener('scroll', () => {
        updateActivity();
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
            if (checkIfAtBottom()) {
                resetIdleTimer();
            }
        }, 100);
    }, { passive: true });

    window.addEventListener('mousemove', updateActivity, { passive: true });
    window.addEventListener('mousedown', updateActivity, { passive: true });
    window.addEventListener('keydown', updateActivity, { passive: true });
    window.addEventListener('touchstart', updateActivity, { passive: true });

    // Initial check on load
    window.addEventListener('load', () => {
        if (checkIfAtBottom()) {
            resetIdleTimer();
        }
    });

    // Smooth scroll behavior enhancement
    document.documentElement.style.scrollBehavior = 'smooth';

    // Prevent scroll chaining issues
    let isScrolling = false;
    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                isScrolling = false;
            });
        }
        isScrolling = true;
    }, { passive: true });

    // Make bottom section clickable to go to main page
    const idleSection = document.getElementById('idle-section');
    if (idleSection) {
        idleSection.addEventListener('click', () => {
            window.location.href = 'https://brandontnova.com';
        });
    }
})();

