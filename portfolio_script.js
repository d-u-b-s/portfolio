(() => {
    "use strict";

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const firstVisit = !sessionStorage.getItem("cb-visited");

    document.documentElement.classList.add("js");

    /* ============================================================
       Injected chrome: preloader, page-transition wipe,
       scroll progress bar, grain overlay, custom cursor
       ============================================================ */

    const make = (cls, parent = document.body) => {
        const el = document.createElement("div");
        el.className = cls;
        el.setAttribute("aria-hidden", "true");
        parent.appendChild(el);
        return el;
    };

    const preloader = make("preloader");
    const progressBar = make("scroll-progress");
    make("grain");
    const pageWipe = make("page-transition");

    /* ============================================================
       Split big names into letters (entrance stagger + hover)
       ============================================================ */

    const splitNames = document.querySelectorAll("#name01, .name02");
    splitNames.forEach((name) => {
        name.classList.add("split-name");
        let i = 0;
        Array.from(name.childNodes).forEach((node) => {
            if (node.nodeType !== Node.TEXT_NODE) return;
            const frag = document.createDocumentFragment();
            node.textContent.split("").forEach((ch) => {
                if (ch.trim() === "") {
                    frag.appendChild(document.createTextNode(ch));
                    return;
                }
                const span = document.createElement("span");
                span.className = "letter";
                span.textContent = ch;
                span.style.setProperty("--i", i++);
                frag.appendChild(span);
            });
            name.replaceChild(frag, node);
        });
    });

    /* Assigned below once the observer exists; called when the preloader lifts */
    let startReveals = () => {};

    const revealNames = () => {
        splitNames.forEach((n) => n.classList.add("name-in"));
        startReveals();
        setTimeout(() => {
            splitNames.forEach((n) => n.classList.add("name-done"));
        }, 1400);
    };

    /* ============================================================
       Preloader: full intro on first visit, quick red wipe after
       ============================================================ */

    const dismissPreloader = (delay, removeAfter) => {
        setTimeout(() => {
            preloader.classList.add("done");
            revealNames();
            setTimeout(() => preloader.remove(), removeAfter);
        }, delay);
    };

    if (prefersReduced) {
        preloader.remove();
        splitNames.forEach((n) => n.classList.add("name-in", "name-done"));
    } else if (firstVisit) {
        const nameEl = document.createElement("div");
        nameEl.className = "preloader-name";
        "CALEN BOLE".split("").forEach((ch, i) => {
            const span = document.createElement("span");
            span.textContent = ch === " " ? " " : ch;
            span.style.setProperty("--i", i);
            nameEl.appendChild(span);
        });
        const bar = document.createElement("div");
        bar.className = "preloader-bar";
        bar.appendChild(document.createElement("span"));
        preloader.append(nameEl, bar);
        dismissPreloader(1600, 900);
    } else {
        preloader.classList.add("quick");
        requestAnimationFrame(() => requestAnimationFrame(() => dismissPreloader(60, 700)));
    }
    sessionStorage.setItem("cb-visited", "1");

    /* ============================================================
       Page transitions: red wipe on internal navigation
       ============================================================ */

    document.addEventListener("click", (e) => {
        if (prefersReduced) return;
        const a = e.target.closest("a");
        if (!a) return;
        if (a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const href = a.getAttribute("href") || "";
        if (!/^[\w-]+\.html$/.test(href)) return;
        e.preventDefault();
        pageWipe.classList.add("active");
        setTimeout(() => { window.location.href = href; }, 400);
    });

    /* Restore state when returning via back/forward cache */
    window.addEventListener("pageshow", (e) => {
        if (e.persisted) {
            pageWipe.classList.remove("active");
            const p = document.querySelector(".preloader");
            if (p) p.remove();
            revealNames();
        }
    });

    /* ============================================================
       Scroll-linked: progress bar + parallax
       ============================================================ */

    const bust = document.querySelector(".bust");
    const hands = document.querySelectorAll(".hand01, .hand02, .hand03");
    let ticking = false;

    const onScrollFrame = () => {
        ticking = false;
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        progressBar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
        if (prefersReduced) return;
        const y = window.scrollY;
        if (bust) bust.style.transform = `translateY(${y * 0.3}px)`;
        if (window.innerWidth > 800) {
            hands.forEach((h) => { h.style.transform = `translateY(${y * 0.1}px)`; });
        } else {
            hands.forEach((h) => { h.style.transform = ""; });
        }
    };
    const requestScrollFrame = () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(onScrollFrame);
        }
    };
    window.addEventListener("scroll", requestScrollFrame, { passive: true });
    window.addEventListener("resize", requestScrollFrame);
    requestScrollFrame();

    /* ============================================================
       Scroll-reveal with stagger
       ============================================================ */

    const revealTargets = document.querySelectorAll(
        ".mosaic > *, .index-panel, .header02, .blurb, .index-list li, .project-back, .marquee"
    );

    if (!prefersReduced && "IntersectionObserver" in window) {
        const groups = new Map();
        revealTargets.forEach((el) => {
            el.classList.add("reveal");
            const parent = el.parentElement;
            const n = groups.get(parent) || 0;
            groups.set(parent, n + 1);
            el.style.setProperty("--d", `${Math.min(n, 5) * 80}ms`);
        });
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                el.classList.add("in-view");
                io.unobserve(el);
                /* Hand the element back its normal transitions once revealed
                   so hover microinteractions stay snappy */
                setTimeout(() => {
                    el.classList.remove("reveal", "in-view");
                    el.style.removeProperty("--d");
                }, 1100);
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });
        startReveals = () => revealTargets.forEach((el) => io.observe(el));
    }

    /* ============================================================
       Custom cursor (fine pointers only)
       ============================================================ */

    if (finePointer && !prefersReduced) {
        document.documentElement.classList.add("has-cursor");
        const dot = make("cursor-dot");
        const ring = make("cursor-ring");
        let mx = innerWidth / 2, my = innerHeight / 2;
        let rx = mx, ry = my;
        let visible = false;

        document.addEventListener("mousemove", (e) => {
            mx = e.clientX;
            my = e.clientY;
            if (!visible) {
                visible = true;
                document.documentElement.classList.remove("cursor-hidden");
            }
        });
        document.addEventListener("mouseleave", () => {
            visible = false;
            document.documentElement.classList.add("cursor-hidden");
        });
        document.documentElement.classList.add("cursor-hidden");

        const loop = () => {
            rx += (mx - rx) * 0.16;
            ry += (my - ry) * 0.16;
            dot.style.transform = `translate(${mx}px, ${my}px)`;
            ring.style.transform = `translate(${rx}px, ${ry}px)`;
            requestAnimationFrame(loop);
        };
        loop();

        document.addEventListener("mouseover", (e) => {
            const interactive = e.target.closest("a, .clickable, .close, button");
            ring.classList.toggle("is-active", !!interactive);
        });
    }

    /* ============================================================
       Lightbox
       ============================================================ */

    const modal = document.querySelector(".modal");
    if (modal) {
        const modalImg = modal.querySelector(".modalImg");
        const closeBtn = modal.querySelector(".close");

        const openModal = (src) => {
            modalImg.src = src;
            modal.classList.add("appear");
            document.body.classList.add("no-scroll");
        };
        const closeModal = () => {
            modal.classList.remove("appear");
            document.body.classList.remove("no-scroll");
        };

        document.querySelectorAll(".clickable").forEach((image) => {
            image.addEventListener("click", () => openModal(image.src));
        });
        if (closeBtn) closeBtn.addEventListener("click", closeModal);
        modal.addEventListener("click", (e) => {
            if (e.target !== modalImg) closeModal();
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && modal.classList.contains("appear")) closeModal();
        });
    }

    /* ============================================================
       Local time (index footer)
       ============================================================ */

    const timeEl = document.getElementById("local-time");
    if (timeEl) {
        const tick = () => {
            const now = new Date().toLocaleTimeString("en-GB", {
                timeZone: "Europe/Paris",
                hour: "2-digit",
                minute: "2-digit",
            });
            timeEl.textContent = `Paris, FR — ${now}`;
        };
        tick();
        setInterval(tick, 30000);
    }
})();
