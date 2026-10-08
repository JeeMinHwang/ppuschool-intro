(() => {
  function initializePillMotion() {
    const gsap = window.gsap;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const svgNamespace = 'http://www.w3.org/2000/svg';
    document.querySelectorAll('.pill-link').forEach((button, index) => {
      if (button.dataset.pillMotion) return;
      const arrow = button.querySelector('.pill-arrow');
      const label = [...button.children].find(child => child !== arrow && child.tagName === 'SPAN');
      if (!arrow || !label) return;
      button.dataset.pillMotion = 'true';
      button.classList.add('pill-motion-ready');
      if (getComputedStyle(button).position === 'static') button.classList.add('pill-positioned');
      if (!gsap) button.classList.add('pill-motion-css');
      label.classList.add('pill-label');
      // app.js nests its roll mask inside the original label span. Keep that mask.
      if (!label.querySelector('.roll-label') && !label.classList.contains('roll-label')) {
        const mask = document.createElement('span');
        mask.className = 'roll-label';
        const front = document.createElement('span');
        front.textContent = label.textContent;
        const clone = front.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        mask.append(front, clone);
        label.replaceChildren(mask);
      }
      const fill = document.createElement('span');
      fill.className = 'pill-hover-fill';
      fill.setAttribute('aria-hidden', 'true');
      button.append(fill);
      const svg = document.createElementNS(svgNamespace, 'svg');
      svg.classList.add('pill-chevron-svg');
      svg.setAttribute('viewBox', '0 0 40 40');
      svg.setAttribute('aria-hidden', 'true');
      const defs = document.createElementNS(svgNamespace, 'defs');
      const clip = document.createElementNS(svgNamespace, 'clipPath');
      const clipId = `pill-chevron-clip-${index}`;
      clip.setAttribute('id', clipId);
      const rect = document.createElementNS(svgNamespace, 'rect');
      Object.entries({x: 16, y: 16, width: 8, height: 8}).forEach(([key, value]) => rect.setAttribute(key, value));
      clip.append(rect);
      defs.append(clip);
      const group = document.createElementNS(svgNamespace, 'g');
      group.setAttribute('clip-path', `url(#${clipId})`);
      const chevrons = [0, 1].map(() => {
        const path = document.createElementNS(svgNamespace, 'path');
        path.setAttribute('d', 'M18.3335 16.333L22.3335 19.9997L18.3335 23.6663');
        group.append(path);
        return path;
      });
      svg.append(defs, group);
      arrow.replaceChildren(svg);
      arrow.setAttribute('aria-hidden', 'true');
      function measure() {
        fill.style.left = `${arrow.offsetLeft}px`;
        fill.style.top = `${arrow.offsetTop}px`;
        fill.style.width = `${arrow.offsetWidth}px`;
        fill.style.height = `${arrow.offsetHeight}px`;
      }
      measure();
      if (window.ResizeObserver) new ResizeObserver(measure).observe(button);
      else window.addEventListener('resize', measure, {passive: true});
      document.fonts?.ready.then(measure);
      let pointerInside = false;
      let keyboardFocus = false;
      let hovered = false;
      if (gsap) {
        gsap.set(fill, {scale: 0});
        gsap.set(chevrons[1], {xPercent: -200});
      }
      function render(force = false) {
        const next = pointerInside || keyboardFocus;
        if (!force && next === hovered) return;
        hovered = next;
        button.classList.toggle('is-pill-hovered', next);
        if (!gsap) return;
        gsap.killTweensOf([fill, ...chevrons]);
        if (reduceMotion.matches) {
          gsap.set(fill, {scale: next ? 15 : 1});
          gsap.set(chevrons[0], {xPercent: next ? 200 : 0});
          gsap.set(chevrons[1], {xPercent: next ? 0 : -200});
          return;
        }
        gsap.to(fill, {scale: next ? 15 : 1, duration: next ? 1.2 : .6, ease: 'power3.out', overwrite: 'auto'});
        // The source leaves duration/ease unspecified for these two chevron paths.
        gsap.to(chevrons[0], {xPercent: next ? 200 : 0, overwrite: 'auto'});
        gsap.to(chevrons[1], {xPercent: next ? 0 : -200, overwrite: 'auto'});
      }
      button.addEventListener('pointerenter', event => {
        if (event.pointerType === 'touch') return;
        pointerInside = true;
        render();
      });
      button.addEventListener('pointerleave', () => { pointerInside = false; render(); });
      button.addEventListener('focusin', () => { keyboardFocus = button.matches(':focus-visible'); render(); });
      button.addEventListener('focusout', () => { keyboardFocus = false; render(); });
      reduceMotion.addEventListener('change', () => render(true));
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializePillMotion, {once: true});
  else initializePillMotion();
})();
