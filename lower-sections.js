(() => {
  function initializeLowerSections() {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = window.matchMedia('(min-width: 1200px)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const canAnimate = () => Boolean(gsap && !reducedMotion.matches);
    if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    const section = document.querySelector('.studio-section');
    if (section && !section.dataset.initialized) {
      section.dataset.initialized = 'true';
      const items = [...section.querySelectorAll('.studio-principle')];
      const panels = items.map(item => item.querySelector('.studio-description'));
      const frames = [...section.querySelectorAll('.studio-image-frame')];
      const visual = section.querySelector('.studio-visual');
      let active = 0;
      let revision = 0;
      let refreshTimer;
      const requestRefresh = () => {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(() => ScrollTrigger?.refresh(), 80);
      };
      const panelHeight = panel => Math.ceil(panel.firstElementChild.getBoundingClientRect().height * 1.05);
      function positionImage(animated) {
        const offset = desktop.matches ? (active - .5) * visual.offsetHeight / 2 : 0;
        if (gsap) {
          gsap.killTweensOf(visual);
          if (animated && canAnimate()) gsap.to(visual, {y: offset, duration: .6, ease: 'power3.out', overwrite: 'auto'});
          else gsap.set(visual, {y: offset});
        } else visual.style.transform = `translateY(${offset}px)`;
      }
      function activate(index, animated = true) {
        if (animated && active === index) return;
        active = index;
        const currentRevision = ++revision;
        items.forEach((item, i) => {
          const selected = i === index;
          const panel = panels[i];
          item.classList.toggle('is-active', selected);
          item.querySelector('button').setAttribute('aria-expanded', String(selected));
          panel.setAttribute('aria-hidden', String(!selected));
          if (gsap) gsap.killTweensOf(panel);
          if (selected) panel.hidden = false;
          if (animated && canAnimate()) {
            gsap.to(panel, {
              height: selected ? panelHeight(panel) : 0,
              duration: .6,
              ease: 'power3.out',
              overwrite: 'auto',
              onComplete: () => {
                // A later hover can reopen this panel before this close completes.
                if (currentRevision !== revision) return;
                if (!selected && active !== i) panel.hidden = true;
                requestRefresh();
              }
            });
          } else {
            panel.hidden = !selected;
            panel.style.height = selected ? `${panelHeight(panel)}px` : '0px';
          }
          const frame = frames[i];
          frame.classList.toggle('is-active', selected);
          frame.setAttribute('aria-hidden', String(!selected));
          const image = frame.querySelector('img');
          if (gsap) {
            if (selected || !animated || !canAnimate()) gsap.killTweensOf([frame, image]);
            gsap.set(frame, {zIndex: selected ? 2 : 1});
            if (selected && animated && canAnimate()) {
              gsap.fromTo(frame, {scale: 0}, {scale: 1, duration: .8, ease: 'power3.out', overwrite: 'auto'});
              gsap.fromTo(image, {scale: 2}, {scale: 1, duration: 1.6, ease: 'power3.out', overwrite: 'auto'});
            } else if (!animated || !canAnimate()) {
              gsap.set(frame, {scale: selected ? 1 : 0});
              gsap.set(image, {scale: 1});
            }
          }
        });
        positionImage(animated);
      }
      activate(0, false);
      items.forEach((item, index) => {
        const button = item.querySelector('button');
        button.addEventListener('click', () => activate(index));
        item.addEventListener('pointerenter', event => {
          if (finePointer.matches && event.pointerType !== 'touch') activate(index);
        });
        button.addEventListener('keydown', event => {
          const direction = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
          let next = direction ? (index + direction + items.length) % items.length : -1;
          if (event.key === 'Home') next = 0;
          if (event.key === 'End') next = items.length - 1;
          if (next !== -1) {
            event.preventDefault();
            items[next].querySelector('button').focus();
            activate(next);
          }
        });
      });
      if (gsap && ScrollTrigger) {
        const media = gsap.matchMedia();
        media.add('(prefers-reduced-motion: no-preference)', () => {
          items.forEach((item, index) => {
            gsap.fromTo(item.querySelector('.studio-rule'), {scaleX: 0}, {
              scaleX: 1, duration: 1.2, delay: index / 8, ease: 'power3.inOut',
              scrollTrigger: {trigger: item, start: 'top 80%', once: true}
            });
          });
        });
      }
      const refreshGeometry = () => {
        const panel = panels[active];
        if (gsap) gsap.killTweensOf(panel);
        panel.style.height = `${panelHeight(panel)}px`;
        positionImage(false);
        requestRefresh();
      };
      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(refreshGeometry, 120);
      }, {passive: true});
      document.fonts?.ready.then(refreshGeometry);
      reducedMotion.addEventListener('change', () => activate(active, false));
    }

    const footer = document.querySelector('.site-footer');
    if (!footer || footer.dataset.motionInitialized) return;
    footer.dataset.motionInitialized = 'true';
    // Original contact mark: individual letter paths slide and rotate into view.
    if (gsap && ScrollTrigger) {
      const media = gsap.matchMedia();
      media.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const paths = [...footer.querySelectorAll('.footer-symbol > path')].reverse();
        gsap.fromTo(paths, {xPercent: 120, rotation: -10}, {
          xPercent: 0, rotation: 0, stagger: .15,
          scrollTrigger: {trigger: footer, start: 'top bottom', end: 'bottom bottom', scrub: 1, invalidateOnRefresh: true}
        });
      });
    }
    // Three permanent image layers lag behind the same local pointer target.
    const area = footer.querySelector('.footer-book-wrap');
    const trail = area?.querySelector('.footer-image-trail');
    if (area && trail && gsap) {
      const pictures = ['pps-course-library.png', 'pps-launch-marketing.png', 'pps-learning-network.png', 'pps-recording-studio.png'];
      const layers = [0, 1, 2].map(layerIndex => {
        const layer = document.createElement('div');
        layer.className = `footer-trail-layer footer-trail-layer-${layerIndex + 1}`;
        pictures.forEach((file, index) => {
          const image = document.createElement('img');
          image.src = '' + file;
          image.alt = '';
          image.className = 'footer-trail-image';
          image.style.opacity = index === 0 ? '1' : '0';
          layer.append(image);
        });
        trail.append(layer);
        return layer;
      });
      const trackers = layers.map((layer, index) => ({
        x: gsap.quickTo(layer, 'x', {duration: .4 + index / 5, ease: 'power3'}),
        y: gsap.quickTo(layer, 'y', {duration: .4 + index / 5, ease: 'power3'})
      }));
      let imageIndex = 0;
      const enabled = () => canAnimate() && desktop.matches && finePointer.matches;
      function centerLayers() {
        const x = (area.offsetWidth - trail.offsetWidth) / 2;
        const y = (area.offsetHeight - trail.offsetHeight) / 2;
        gsap.set(layers, {x, y});
      }
      centerLayers();
      gsap.set(trail, {opacity: 0});
      area.addEventListener('pointerenter', event => {
        if (!enabled() || event.pointerType === 'touch') return;
        gsap.to(trail, {opacity: 1, duration: .3, ease: 'power3.out', overwrite: 'auto'});
      });
      area.addEventListener('pointermove', event => {
        if (!enabled() || event.pointerType === 'touch') return;
        const bounds = area.getBoundingClientRect();
        const x = event.clientX - bounds.left - trail.offsetWidth / 2;
        const y = event.clientY - bounds.top - trail.offsetHeight / 2;
        trackers.forEach(tracker => { tracker.x(x); tracker.y(y); });
        const next = Math.min(pictures.length - 1, Math.max(0, Math.floor((event.clientX - bounds.left) / bounds.width * pictures.length)));
        if (next !== imageIndex) {
          imageIndex = next;
          layers.forEach(layer => [...layer.children].forEach((image, i) => { image.style.opacity = i === next ? '1' : '0'; }));
        }
      });
      area.addEventListener('pointerleave', () => gsap.to(trail, {opacity: 0, duration: canAnimate() ? .3 : 0, ease: 'power3.out', overwrite: 'auto'}));
      reducedMotion.addEventListener('change', () => gsap.set(trail, {opacity: 0}));
      desktop.addEventListener('change', () => { gsap.set(trail, {opacity: 0}); centerLayers(); });
    }
    // Source arrow redraws its dashed path once per entry.
    const book = footer.querySelector('.footer-book');
    const arrow = book?.querySelector('.footer-book-arrow');
    if (arrow && gsap) {
      const length = arrow.querySelector('path').getTotalLength();
      gsap.set(arrow, {strokeDasharray: length, strokeDashoffset: 0});
      book.addEventListener('pointerenter', () => {
        if (canAnimate()) gsap.fromTo(arrow, {strokeDashoffset: 0}, {strokeDashoffset: 2 * length, duration: 1.2, ease: 'power3.out', overwrite: 'auto'});
      });
    }
    // Underlines start visible; two copies sweep across on hover.
    const underlined = [...footer.querySelectorAll('.footer-socials a'), footer.querySelector('.footer-book-label')].filter(Boolean);
    underlined.forEach(element => {
      element.classList.add('footer-sweep-underline');
      const lines = [0, 1].map(index => {
        const line = document.createElement('span');
        line.className = 'footer-underline-line' + (index ? ' footer-underline-clone' : '');
        line.setAttribute('aria-hidden', 'true');
        element.append(line);
        return line;
      });
      const trigger = element.classList.contains('footer-book-label') ? book : element;
      const sweep = () => {
        if (canAnimate()) gsap.fromTo(lines, {xPercent: 0}, {xPercent: 100, duration: .4, stagger: .15, ease: 'power3.inOut', overwrite: 'auto'});
      };
      trigger.addEventListener('pointerenter', sweep);
      trigger.addEventListener('focus', sweep);
    });
    const socials = [...footer.querySelectorAll('.footer-socials a:not(.footer-email)')];
    const emphasizeSocial = selected => socials.forEach(link => {
      const opacity = !selected || selected === link ? 1 : .3;
      if (gsap) gsap.to(link, {opacity, duration: canAnimate() ? .6 : 0, ease: 'power3.out', overwrite: 'auto'});
      else link.style.opacity = opacity;
    });
    socials.forEach(link => {
      link.addEventListener('pointerenter', () => emphasizeSocial(link));
      link.addEventListener('pointerleave', () => emphasizeSocial(null));
      link.addEventListener('focus', () => emphasizeSocial(link));
      link.addEventListener('blur', () => emphasizeSocial(null));
    });
    const globeContainer = footer.querySelector('.footer-globe-animation');
    if (globeContainer && window.lottie && window.GLOBE_ANIMATION) {
      const globe = window.lottie.loadAnimation({container: globeContainer, renderer: 'svg', loop: true, autoplay: false, animationData: window.GLOBE_ANIMATION});
      const badge = footer.querySelector('.footer-badge');
      badge.classList.add('has-globe-motion');
      const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && !reducedMotion.matches) globe.play();
        else globe.pause();
      });
      observer.observe(badge);
      reducedMotion.addEventListener('change', () => {
        if (reducedMotion.matches) globe.goToAndStop(0, true);
        else if (badge.getBoundingClientRect().bottom > 0 && badge.getBoundingClientRect().top < window.innerHeight) globe.play();
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeLowerSections, {once: true});
  else initializeLowerSections();
})();
