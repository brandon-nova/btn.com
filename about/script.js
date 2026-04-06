(function () {
    'use strict';

    const fadeElements = document.querySelectorAll('.fade-in');

    if (!fadeElements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -6% 0px'
    });

    fadeElements.forEach((el) => observer.observe(el));
})();
