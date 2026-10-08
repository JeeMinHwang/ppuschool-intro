(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 1200px)');
  const finePointer = matchMedia('(pointer: fine)');
  const {gsap, ScrollTrigger} = window;
  const hero = $('.hero'), scene = $('.hero-scene'), video = $('#hero-video');
  const nav = $('.navigation'), menu = $('#menu-links'), toggle = $('.menu-toggle');
  const dialog = $('.reel-dialog'), launch = $('.reel-launch'), cursor = $('.cursor-bubble');
  const backdrop = $('.motion-backdrop'), statement = $('.work-statement');
  const clamp = (x,min=0,max=1) => Math.min(max,Math.max(min,x));
  let menuOpen=false, manuallyPaused=reduceMotion.matches, userMuted=false, reelClosing=false;
  let cursorMode='', cursorInitialized=false, idleTimer;
  const motionAllowed=()=>desktop.matches&&finePointer.matches&&!reduceMotion.matches;
  if(gsap&&ScrollTrigger)gsap.registerPlugin(ScrollTrigger);
  const lenis=window.Lenis&&!reduceMotion.matches?new window.Lenis():null;
  if(lenis&&gsap){lenis.on('scroll',ScrollTrigger.update);gsap.ticker.add(t=>lenis.raf(t*1000));gsap.ticker.lagSmoothing(0);}
  window.uncommonMotion={lenis,reduceMotion};
  document.documentElement.classList.add('js-ready');

  function clock(){ $('#melbourne-time').textContent=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date()); }
  clock();setInterval(clock,30000);

  // Label clones stay inside masks so hover rolls the words up.
  $$('.pill-link>span:first-child,.menu-pill:not(.menu-toggle),.work-with-us').forEach(el=>{
    const textNodes=[...el.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());
    textNodes.forEach(node=>{
      const mask=document.createElement('span');mask.className='roll-label';
      const front=document.createElement('span');front.textContent=node.textContent.trim();
      const clone=front.cloneNode(true);clone.setAttribute('aria-hidden','true');
      mask.append(front,clone);node.replaceWith(mask);
    });
  });
  function setMenu(open){menuOpen=open;nav.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open));$('.menu-label').textContent=open?'닫기':'메뉴';menu.inert=!open;}
  toggle.addEventListener('click',()=>setMenu(!menuOpen));
  $$('.menu-links a,.header-logo,.page-label').forEach(el=>el.addEventListener('click',()=>setMenu(false)));
  document.addEventListener('click',e=>{
    const anchor=e.target.closest('a[href^="#"]');
    if(!anchor)return;const target=document.getElementById(anchor.getAttribute('href').slice(1));if(!target)return;
    e.preventDefault();history.replaceState(null,'',anchor.getAttribute('href'));
    const clearance=target.id==='home'?0:$('.site-header').getBoundingClientRect().bottom+parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter'))*parseFloat(getComputedStyle(document.documentElement).fontSize);
    if(lenis)lenis.scrollTo(target,{offset:-clearance});else window.scrollTo({top:target.getBoundingClientRect().top+window.scrollY-clearance,behavior:reduceMotion.matches?'instant':'smooth'});
  });
  document.addEventListener('pointerdown',e=>{if(menuOpen&&!nav.contains(e.target))setMenu(false);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menuOpen){setMenu(false);toggle.focus();}});
  $('.scroll-hint').addEventListener('click',()=>{
    const top=desktop.matches&&!reduceMotion.matches?innerHeight:hero.offsetHeight;
    if(lenis)lenis.scrollTo(top);else window.scrollTo({top,behavior:reduceMotion.matches?'instant':'smooth'});
  });

  // The background and immersive reel use the same video and playback position.
  function syncBackground(){
    const button=$('.background-toggle');button.setAttribute('aria-label',manuallyPaused?'배경 영상 재생':'배경 영상 일시정지');
    button.querySelector('img').src=manuallyPaused?'ic-play.svg':'ic-pause.svg';
  }
  function syncMute(){
    $('.reel-mute span').textContent=video.muted?'소리 켜기':'음소거';
    $('.reel-mute img').src=video.muted?'ic-unmute.svg':'ic-mute.svg';
    $('.reel-mute').setAttribute('aria-label',video.muted?'영상 소리 켜기':'영상 음소거');
  }
  function syncPlayback(){
    const playing=dialog.open&&!video.paused;
    $('.cursor-reel span').textContent=dialog.open?(playing?'일시정지':'재생'):'영상 보기';
    $('.cursor-reel img').src=playing?'ic-pause.svg':'ic-play.svg';
    $('.reel-mobile-toggle').textContent=playing?'일시정지':'재생';
    $('.reel-mobile-toggle').setAttribute('aria-label',playing?'영상 일시정지':'영상 재생');
  }
  video.addEventListener('play',syncPlayback);video.addEventListener('pause',syncPlayback);
  if(manuallyPaused)video.pause();else video.play().catch(()=>{});
  syncBackground();
  $('.background-toggle').addEventListener('click',()=>{manuallyPaused=!manuallyPaused;if(manuallyPaused)video.pause();else video.play().catch(()=>{});syncBackground();});
  function openReel(){
    if(dialog.open)return;
    setMenu(false);lenis?.stop();
    if(lenis)lenis.scrollTo(0,{immediate:true,force:true});else window.scrollTo(0,0);
    dialog.showModal();document.body.classList.add('modal-open');
    const outro=document.createElement('div');outro.className='reel-outro';outro.setAttribute('aria-hidden','true');outro.inert=true;
    if(!reduceMotion.matches){
      ['.hero-top','.hero-wordmark','.scroll-hint'].forEach(selector=>outro.append(scene.querySelector(selector).cloneNode(true)));
      $('.reel-screen').append(outro);
    }
    $('.reel-screen').append(video);dialog.append(cursor);
    video.muted=userMuted;video.play().catch(()=>{});syncMute();syncPlayback();
    if(gsap&&!reduceMotion.matches){
      gsap.to(outro.querySelectorAll('.hero-wordmark path'),{yPercent:150,duration:1.2,stagger:-.025,ease:'power3.out'});
      gsap.to(outro.querySelectorAll('.word-mask>span'),{yPercent:108,duration:.8,stagger:.015,ease:'power3.out'});
      gsap.to(outro.querySelectorAll('.featured,.scroll-hint'),{opacity:0,duration:.8,ease:'power3.inOut'});
      gsap.delayedCall(1.5,()=>outro.remove());
      gsap.fromTo('.video-pill',{x:12,opacity:0},{x:0,opacity:1,duration:.6,delay:.3,clearProps:'transform,opacity'});
    }
    $('.reel-close').focus({preventScroll:true});
    showCursor('reel');wakeReelControls();
  }
  function closeReel(){if(reelClosing||!dialog.open)return;reelClosing=true;
    const finish=()=>{dialog.close();reelClosing=false;};
    if(gsap&&!reduceMotion.matches)gsap.to('.video-pill',{opacity:0,duration:.3,ease:'power3.out',onComplete:finish});else finish();
  }
  launch.addEventListener('click',openReel);
  scene.addEventListener('click',e=>{if(!e.target.closest('a,button'))openReel();});
  const toggleReel=()=>{if(video.paused)video.play().catch(()=>{});else video.pause();};
  $('.reel-screen').addEventListener('click',toggleReel);
  $('.reel-mobile-toggle').addEventListener('click',toggleReel);
  $('.reel-mute').addEventListener('click',()=>{userMuted=!video.muted;video.muted=userMuted;syncMute();});
  $('.reel-close').addEventListener('click',closeReel);
  dialog.addEventListener('cancel',e=>{e.preventDefault();closeReel();});
  dialog.addEventListener('keydown',e=>{if(e.code==='Space'&&e.target===dialog){e.preventDefault();toggleReel();}});
  dialog.addEventListener('close',()=>{
    clearTimeout(idleTimer);dialog.querySelectorAll('.reel-outro').forEach(el=>el.remove());scene.prepend(video);document.body.append(cursor);
    document.body.classList.remove('modal-open');video.muted=true;
    if(manuallyPaused)video.pause();else video.play().catch(()=>{});
    lenis?.start();showCursor('');syncPlayback();launch.focus({preventScroll:true});
    if(gsap&&!reduceMotion.matches){gsap.fromTo('.hero-wordmark path',{yPercent:150},{yPercent:0,duration:1.2,stagger:.025,ease:'power3.out'});gsap.fromTo('.hero-top',{opacity:0},{opacity:1,duration:.8,clearProps:'opacity'});}
  });
  function wakeReelControls(){
    if(!dialog.open)return;clearTimeout(idleTimer);dialog.classList.remove('controls-idle');
    idleTimer=setTimeout(()=>{dialog.classList.add('controls-idle');showCursor('');},1000);
  }
  dialog.addEventListener('pointermove',wakeReelControls);
  new IntersectionObserver(([entry])=>{if(dialog.open)return;if(!entry.isIntersecting)video.pause();else if(!manuallyPaused)video.play().catch(()=>{});}).observe(hero);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else if(!manuallyPaused&&!dialog.open&&hero.getBoundingClientRect().bottom>0)video.play().catch(()=>{});});

  // Independent circle and pill layers follow the pointer with the source easing.
  const cursorX=gsap?.quickTo(cursor,'x',{duration:.4,ease:'power3'});
  const cursorY=gsap?.quickTo(cursor,'y',{duration:.4,ease:'power3'});
  if(gsap)gsap.set(cursor,{xPercent:-50,yPercent:-50});
  function showCursor(mode){
    if(!motionAllowed())mode='';
    if(mode===cursorMode)return;cursorMode=mode;
    if(!gsap)return;
    const view=$('.cursor-view'),label=view.querySelector('span'),arrow=view.querySelector('img');
    gsap.to(view,{clipPath:mode==='view'?'circle(50%)':'circle(0%)',duration:.6,ease:'power3.out',overwrite:true});
    gsap.to('.cursor-reel',{opacity:mode==='reel'?1:0,duration:.6,ease:'power3.out',overwrite:true});
    if(mode==='view'){
      gsap.fromTo(label,{yPercent:100,opacity:0},{yPercent:0,opacity:1,delay:.15,duration:.6,ease:'power3.out',overwrite:true});
      gsap.fromTo(arrow,{xPercent:-100,yPercent:0,opacity:0},{xPercent:0,yPercent:0,opacity:1,delay:.15,duration:.6,ease:'power3.out',overwrite:true});
    }else{
      gsap.to(label,{yPercent:-100,opacity:0,duration:.4,overwrite:true});gsap.to(arrow,{xPercent:100,opacity:0,duration:.4,overwrite:true});
    }
  }
  document.addEventListener('pointermove',e=>{
    if(!motionAllowed())return;document.body.classList.add('pointer-active');
    if(!cursorInitialized){gsap.set(cursor,{x:e.clientX,y:e.clientY});cursorInitialized=true;}
    cursorX(e.clientX);cursorY(e.clientY);
    const controls=e.target.closest('button:not(.reel-launch),.navigation,.site-header,.page-label');
    if(controls){showCursor('');return;}
    showCursor(e.target.closest('[data-cursor]')?'view':e.target.closest('.hero-scene,.reel-screen')?'reel':'');
  },{passive:true});
  document.documentElement.addEventListener('pointerleave',()=>showCursor(''));
  addEventListener('scroll',()=>{if(!dialog.open)showCursor('');},{passive:true});

  if(gsap&&ScrollTrigger){
    const mm=gsap.matchMedia();
    mm.add({desktop:'(min-width:1200px)',mobile:'(max-width:1199px)',reduce:'(prefers-reduced-motion:reduce)'},context=>{
      const {desktop:isDesktop,reduce}=context.conditions;
      $('.site-header').classList.toggle('visible',!isDesktop||reduce||window.scrollY>=innerHeight);
      if(isDesktop&&!reduce){
        gsap.set('.hero-wordmark g',{yPercent:0,opacity:1});
        gsap.fromTo(backdrop,{clipPath:'polygon(0% 50%,100% 50%,100% 50%,0% 50%)'},{clipPath:'polygon(0% 0%,100% 0%,100% 100%,0% 100%)',scrollTrigger:{trigger:hero,start:'top top',end:'+=100%',scrub:1,invalidateOnRefresh:true,onLeave:()=>$('.site-header').classList.add('visible'),onEnterBack:()=>$('.site-header').classList.remove('visible')}});
        gsap.fromTo(statement,{opacity:0},{opacity:1,scrollTrigger:{trigger:hero,start:'top 10%',end:'+=90%',scrub:true}});
        gsap.to('.hero-wordmark g',{yPercent:150,opacity:.15,stagger:{from:'center',amount:.25},scrollTrigger:{trigger:hero,start:'top top',end:'+=90%',scrub:1}});
        gsap.to('.hero-top',{yPercent:-120,opacity:.15,scrollTrigger:{trigger:hero,start:'top top',end:'+=100%',scrub:1}});
        $$('.project').forEach((project,index,list)=>{
          const link=project.querySelector('.project-link'),outer=project.querySelector('.project-out'),inner=project.querySelector('.project-in'),img=inner.querySelector('img');
          let entryProgress=0,exitProgress=0;
          const renderImage=()=>{img.style.transform=`scale(${(entryProgress<1?2.5-1.5*entryProgress:1+1.875*exitProgress).toFixed(3)})`;};
          renderImage();
          gsap.fromTo(inner,{scale:.5},{scale:1,scrollTrigger:{trigger:link,start:'top bottom',end:'center center',scrub:true,invalidateOnRefresh:true,onUpdate:s=>{entryProgress=s.progress;renderImage();}}});
          if(index<list.length-1)gsap.to(outer,{scale:.5,scrollTrigger:{trigger:project,start:'bottom bottom',end:'bottom top',scrub:true,invalidateOnRefresh:true,onUpdate:s=>{exitProgress=s.progress;renderImage();}}});
        });
        ScrollTrigger.create({trigger:$('.project:last-child'),start:'bottom bottom',onEnter:()=>statement.style.visibility='hidden',onLeaveBack:()=>statement.style.visibility='visible'});
      }else $('.site-header').classList.add('visible');
      if(!reduce)gsap.to('.scroll-hint',{opacity:0,scrollTrigger:{trigger:hero,start:'top -1%',end:isDesktop?'+=1%':'+=20%',scrub:1}});
      const applyTheme=light=>{document.body.classList.toggle('scene-light',light);nav.classList.toggle('on-light',light);};
      ScrollTrigger.create({trigger:$('#services'),start:'top center',onEnter:()=>applyTheme(true),onLeaveBack:()=>applyTheme(false)});
      applyTheme($('#services').getBoundingClientRect().top<innerHeight/2);
      $$('[data-theme]').forEach(section=>ScrollTrigger.create({trigger:section,start:'top center',end:'bottom center',onToggle:s=>{if(s.isActive)nav.classList.toggle('on-light',section.dataset.theme==='light');}}));
      return()=>{showCursor('');};
    });
    $$('.project-link').forEach(link=>{
      const caption=link.querySelector('.project-caption');
      const followY=gsap.quickTo(caption,'y',{duration:.8,ease:'power3'});
      const reset=()=>gsap.set(caption,{y:link.offsetHeight/2});reset();
      link.addEventListener('pointerenter',()=>{if(motionAllowed())gsap.to(caption,{opacity:1,duration:.6,ease:'power3.out',overwrite:true});});
      link.addEventListener('pointerleave',()=>{if(motionAllowed())gsap.to(caption,{opacity:0,duration:.6,ease:'power3.out',overwrite:true});});
      link.addEventListener('pointermove',e=>{if(motionAllowed()){const r=link.getBoundingClientRect(),height=caption.querySelector('h3').offsetHeight;followY(clamp(e.clientY-r.top-height/2,0,r.height-height));}});
      ScrollTrigger.addEventListener('refresh',reset);
    });
  }

  // Masked word entrances keep the real text and its natural line wrapping.
  function splitWords(element){
    const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);const nodes=[];
    while(walker.nextNode())if(walker.currentNode.textContent.trim()&&!walker.currentNode.parentElement.closest('.changing-copy,.word-mask'))nodes.push(walker.currentNode);
    for(const textNode of nodes){
      const fragment=document.createDocumentFragment();
      textNode.textContent.split(/(\s+)/).forEach(word=>{
        if(!word.trim()){fragment.append(document.createTextNode(word));return;}
        const mask=document.createElement('span'),inner=document.createElement('span');mask.className='word-mask';inner.textContent=word;mask.append(inner);fragment.append(mask);
      });textNode.replaceWith(fragment);
    }
    return [...element.querySelectorAll('.word-mask>span')];
  }
  function revealText(el,{delay=0,duration=1.2,initial=false}={}){
    const words=splitWords(el);if(!gsap||reduceMotion.matches)return;
    gsap.set(words,{yPercent:108});
    const play=()=>{
      const tops=[...new Set(words.map(w=>Math.round(w.parentElement.offsetTop)))].sort((a,b)=>a-b);
      words.forEach((word,i)=>gsap.to(word,{yPercent:0,duration,ease:'power3.out',delay:delay+tops.indexOf(Math.round(word.parentElement.offsetTop))*.1+i*.015}));
    };
    if(initial)play();else ScrollTrigger.create({trigger:el,start:'top 92%',once:true,onEnter:play});
  }
  revealText($('.hero h1'),{delay:.35,initial:true});
  revealText($('.services h2'),{delay:.3});
  $$('.benefit h3,.benefit p').forEach((el,index)=>revealText(el,{delay:.3+index*.08}));
  $$('.capabilities-lead p,.studio-intro,.studio-eyebrow,.footer-statement').forEach(el=>revealText(el,{delay:.15}));
  $$('.studio-toggle').forEach((el,index)=>revealText(el,{delay:index/8,duration:1.6}));
  $$('.service-card').forEach((card,index)=>{
    revealText(card.querySelector('.eyebrow'),{delay:index/4+.3});
    revealText(card.querySelector('h3'),{delay:index/4+.6,duration:1.6});
    revealText(card.querySelector('p'),{delay:index/4+.9});
    if(gsap&&!reduceMotion.matches)gsap.fromTo(card,{'--line-progress':0},{'--line-progress':1,duration:1.2,delay:index/4+.15,ease:'power3.inOut',scrollTrigger:{trigger:card,start:'top 85%',once:true}});
  });
  if(gsap&&!reduceMotion.matches){
    if(window.scrollY<10)gsap.fromTo('.hero-wordmark path',{yPercent:150},{yPercent:0,delay:1.2,duration:1.2,stagger:.025,ease:'power3.out'});
    gsap.fromTo('.featured',{opacity:0},{opacity:1,delay:.6,duration:1.2,ease:'power3.out'});
    $$('.all-work .pill-link,.services-intro .pill-link').forEach(el=>gsap.fromTo(el,{y:20,opacity:0},{y:0,opacity:1,duration:1.2,delay:.6,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 95%',once:true}}));
  }
  // The language change scrambles letters briefly instead of sliding a line.
  const copy=$('.changing-copy>span');copy.innerHTML='<span class="scramble-word">가능성으로.</span>';
  let language=0,scrambleTimer,swapTimer,serviceVisible=false;
  const phrases=[['가능성으로.']];
  function swapCopy(){
    if(!serviceVisible||reduceMotion.matches||document.hidden)return;
    language=(language+1)%phrases.length;const spans=[...copy.children],targets=phrases[language];
    spans.forEach((span,i)=>{
      const before=span.getBoundingClientRect().width;span.textContent=targets[i];const after=span.getBoundingClientRect().width;
      gsap?.fromTo(span,{width:before},{width:after,duration:.3,ease:'power3',onComplete:()=>span.style.width=''});
    });
    clearInterval(scrambleTimer);const start=performance.now();
    scrambleTimer=setInterval(()=>{
      const done=performance.now()-start>=400;
      spans.forEach((span,i)=>span.textContent=done?targets[i]:targets[i].replace(/[가-힣]/g,()=> '강의기획제작촬영편집운영지원함께'[Math.floor(Math.random()*16)]));
      if(done)clearInterval(scrambleTimer);
    },30);
  }
  new IntersectionObserver(([entry])=>{
    serviceVisible=entry.isIntersecting;clearInterval(swapTimer);
    if(serviceVisible&&!reduceMotion.matches)swapTimer=setInterval(swapCopy,3000);
  }).observe($('.services h2'));

  if(window.lottie&&window.SERVICE_ANIMATIONS){
    $$('.service-icon').forEach((container,index)=>{
      const data=window.SERVICE_ANIMATIONS[index];if(!data)return;
      container.replaceChildren();container.classList.add('animated');
      const animation=window.lottie.loadAnimation({container,renderer:'svg',loop:true,autoplay:!reduceMotion.matches,animationData:data});
      new IntersectionObserver(([entry])=>{if(entry.isIntersecting&&!reduceMotion.matches)animation.play();else animation.pause();}).observe(container);
      reduceMotion.addEventListener('change',()=>{if(reduceMotion.matches)animation.pause();});
    });
  }
  // Keep the CTA centered only at the mobile breakpoint after resizing.
  const compactCTA=matchMedia('(max-width:767px)');
  const alignServiceCTA=()=>gsap?.set('.services-intro>.pill-link',{x:0,xPercent:compactCTA.matches?-50:0});
  alignServiceCTA();compactCTA.addEventListener('change',alignServiceCTA);
  document.fonts.ready.then(()=>ScrollTrigger?.refresh());
  $$('[data-cursor],.project-in img,.featured-image img').forEach(el=>{el.draggable=false;});
  addEventListener('load',()=>ScrollTrigger?.refresh(),{once:true});
  reduceMotion.addEventListener('change',()=>{if(reduceMotion.matches){lenis?.destroy();manuallyPaused=true;video.pause();syncBackground();showCursor('');}});
})();
