(() => {
  const initReveal = () => {
    const nodes = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.15
      }
    );

    nodes.forEach((node) => observer.observe(node));
  };

  const initParallax = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const targets = Array.from(document.querySelectorAll("[data-parallax]"));
    if (!targets.length) {
      return;
    }

    let ticking = false;
    const update = () => {
      const scrollTop = window.scrollY;
      const mobileScale = window.matchMedia("(max-width: 920px)").matches ? 0.45 : 1;

      for (const node of targets) {
        const speed = Number(node.dataset.parallax || 0);
        const offset = Math.max(-42, Math.min(42, scrollTop * speed * mobileScale));
        node.style.setProperty("--parallax-y", `${offset.toFixed(2)}px`);
      }

      ticking = false;
    };

    const onScroll = () => {
      if (ticking) {
        return;
      }
      ticking = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  };

  const initCounters = () => {
    const counters = Array.from(document.querySelectorAll(".counter"));
    if (!counters.length) {
      return;
    }

    const animate = (counter) => {
      const target = Number(counter.dataset.target || 0);
      const suffix = counter.dataset.suffix || "";
      const duration = 1500;
      const start = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(target * eased);
        counter.textContent = `${value}${suffix}`;

        if (progress < 1) {
          window.requestAnimationFrame(tick);
        }
      };

      window.requestAnimationFrame(tick);
    };

    let played = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        if (!visible || played) {
          return;
        }

        played = true;
        counters.forEach((counter) => animate(counter));
        observer.disconnect();
      },
      {
        threshold: 0.35
      }
    );

    const trigger = document.querySelector(".hero-metrics") || counters[0];
    observer.observe(trigger);
  };

  initReveal();
  initParallax();
  initCounters();
})();
