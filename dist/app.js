(() => {
  'use strict';
  const content = window.WUYI_CONTENT;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches;
  let elapsed = 0;
  let previous = 0;
  let needsDraw = true;
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#navigation');
  const closeMenu = () => { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); };
  menu.addEventListener('click', () => { const open = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  document.querySelector('#year').textContent = new Date().getFullYear();
  document.querySelectorAll('[data-member]').forEach(el => { el.textContent = content.members[Number(el.dataset.member)] || el.textContent; });
  if (content.email) {
    const detail = document.querySelector('#contact-detail');
    const link = document.createElement('a'); link.href = `mailto:${content.email}`; link.textContent = content.email; detail.replaceChildren(link);
  }
  const motionButton = document.querySelector('.motion-toggle');
  function syncMotion() {
    needsDraw = true;
    document.body.classList.toggle('motion-is-paused', paused);
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.innerHTML = paused ? '播放动态 <span>▷</span>' : '暂停动态 <span>Ⅱ</span>';
    document.querySelectorAll('.study-art').forEach(el => { el.style.removeProperty('--tilt-x'); el.style.removeProperty('--tilt-y'); });
  }
  syncMotion();
  motionButton.addEventListener('click', () => { paused = !paused; syncMotion(); });
  reduced.addEventListener('change', e => { paused = e.matches; syncMotion(); });
  const revealObserver = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); } }); }, { threshold: .08 });
  document.querySelectorAll('.section-heading,.studio-body,.person,.practice-list>div').forEach(el => { el.classList.add('reveal'); revealObserver.observe(el); });
  // Interactive surfaces retain the native cursor and never intercept page controls.
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const aura = document.querySelector('.pointer-aura');
  document.addEventListener('pointermove', event => {
    if (!finePointer.matches || reduced.matches || paused) { aura.style.opacity = '0'; return; }
    aura.style.left = `${event.clientX}px`; aura.style.top = `${event.clientY}px`; aura.style.opacity = '1';
    aura.classList.toggle('is-active', Boolean(event.target.closest('a,button')));
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { aura.style.opacity = '0'; });
  document.querySelectorAll('.study-art').forEach(surface => {
    surface.addEventListener('pointermove', event => {
      if (!finePointer.matches || reduced.matches || paused) return;
      const box = surface.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width; const y = (event.clientY - box.top) / box.height;
      surface.style.setProperty('--tilt-x', `${(0.5-y)*3}deg`);
      surface.style.setProperty('--tilt-y', `${(x-0.5)*3}deg`);
      surface.style.setProperty('--spot-x', `${x*100}%`); surface.style.setProperty('--spot-y', `${y*100}%`);
    }, { passive: true });
    surface.addEventListener('pointerleave', () => { surface.style.setProperty('--tilt-x','0deg'); surface.style.setProperty('--tilt-y','0deg'); });
  });
  const magnet = document.querySelector('.contact-button');
  magnet.addEventListener('pointermove', event => {
    if (!finePointer.matches || reduced.matches || paused) return;
    const box = magnet.getBoundingClientRect();
    magnet.style.setProperty('--magnet-x', `${(event.clientX-box.left-box.width/2)*.12}px`);
    magnet.style.setProperty('--magnet-y', `${(event.clientY-box.top-box.height/2)*.12}px`);
  }, { passive: true });
  magnet.addEventListener('pointerleave', () => { magnet.style.setProperty('--magnet-x','0px'); magnet.style.setProperty('--magnet-y','0px'); });
  const progress = document.querySelector('.reading-progress');
  const updateProgress = () => { needsDraw = true; const length = document.documentElement.scrollHeight - innerHeight; progress.style.transform = `scaleX(${length > 0 ? Math.min(1,Math.max(0,scrollY/length)) : 0})`; };
  window.addEventListener('scroll', updateProgress, { passive: true }); window.addEventListener('resize', updateProgress); updateProgress();
  const sectionObserver = new IntersectionObserver(entries => { entries.forEach(entry => {
    if (entry.isIntersecting) document.querySelectorAll('nav a').forEach(a => {
      const current = a.getAttribute('href') === `#${entry.target.id}`;
      a.classList.toggle('is-current',current);
      if(current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');
    });
  }); }, { rootMargin: '-15% 0px -60% 0px' });
  document.querySelectorAll('main>section').forEach(section => sectionObserver.observe(section));
  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
    document.querySelector('.hero-stage').dataset.art = button.dataset.mode;
    needsDraw = true;
    document.querySelector('.hero-stage canvas').setAttribute('aria-label', { ribbon:'三维线束光环动态主视觉', light:'深色空间中的折光平面动态主视觉', echo:'相互共振的轨道动态主视觉' }[button.dataset.mode]);
    document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed',String(b===button)));
  }));
  const studies = document.querySelector('#study-dialog');
  document.querySelectorAll('[data-study]').forEach(button => button.addEventListener('click', () => {
    const study = content.studies[Number(button.dataset.study)];
    studies.querySelector('h2').textContent = study.title;
    studies.querySelector('.dialog-text p').textContent = study.description;
    studies.querySelector('[data-art]').dataset.art = study.art;
    studies.showModal();
    needsDraw = true;
  }));
  document.querySelector('#brief-open').addEventListener('click', () => document.querySelector('#brief-dialog').showModal());
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); });
  });
  document.querySelector('#brief-form').addEventListener('submit', e => {
    e.preventDefault();
    const values = new FormData(e.currentTarget);
    const text = `无衣 WUYI · 项目想法\n\n称呼：${values.get('name')}\n联系方式：${values.get('contact')}\n\n项目想法：\n${values.get('idea')}\n`;
    const url = URL.createObjectURL(new Blob(['\uFEFF' + text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = '无衣-项目简报.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    document.querySelector('#form-status').textContent = content.email ? `已下载简报，可通过 ${content.email} 联系我们。` : '简报已下载到你的设备。当前预览不会上传或发送任何信息。';
  });

  // Procedural KV, locally rendered; no external libraries or network dependencies.
  const canvases = [...document.querySelectorAll('.art-canvas')].map(canvas => ({ canvas, context: canvas.getContext('2d'), w: 0, h: 0 }));
  const resize = new ResizeObserver(entries => { entries.forEach(entry => {
    const item = canvases.find(c => c.canvas === entry.target); if (!item) return;
    item.w = entry.contentRect.width; item.h = entry.contentRect.height;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    item.canvas.width = Math.round(item.w * ratio); item.canvas.height = Math.round(item.h * ratio);
    item.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    needsDraw = true;
  }); });
  canvases.forEach(item => resize.observe(item.canvas));
  let pointerX = 0, pointerY = 0;
  document.querySelector('.hero-stage').addEventListener('pointermove', e => { const r = e.currentTarget.getBoundingClientRect(); pointerX = (e.clientX - r.left) / r.width - .5; pointerY = (e.clientY - r.top) / r.height - .5; });
  document.querySelector('.hero-stage').addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; });
  function ribbon(ctx, w, h, time, hero) {
    const mobile = w < 650;
    const centerX = hero ? w * (mobile ? .56 : .74) : w*.5;
    const centerY = hero ? h * (mobile ? .67 : .45) : h*.5;
    const size = hero ? Math.min(w*(mobile?.39:.25),h*.37) : Math.min(w*.3,h*.39);
    const activeX = paused ? 0 : pointerX; const activeY = paused ? 0 : pointerY;
    const halo = ctx.createRadialGradient(centerX,centerY,size*.1,centerX,centerY,size*1.7);
    halo.addColorStop(0,'rgba(107,125,210,.13)');halo.addColorStop(.7,'rgba(96,105,192,.035)');halo.addColorStop(1,'rgba(90,100,180,0)');
    ctx.fillStyle=halo;ctx.fillRect(0,0,w,h);
    ctx.save();ctx.translate(centerX+(hero?activeX*18:0),centerY+(hero?activeY*12:0));
    const tilt = .92 + Math.sin(time*.17)*.22 + (hero?activeY*.18:0);
    const yaw = -.45 + Math.sin(time*.12)*.25 + (hero?activeX*.18:0);
    const twist = -.48 + time*.025;
    const rows = mobile ? 48 : 68;
    for (let line = 0; line < rows; line++) {
      const v = line / rows * Math.PI * 2;
      ctx.beginPath();
      for (let i = 0; i <= 160; i++) {
        const u = i / 160 * Math.PI * 2;
        const tube = .26 + .06*Math.sin(u*3+time*.23);
        const radius = .79+tube*Math.cos(v);
        const x=radius*Math.cos(u);const y=radius*Math.sin(u);const z=tube*Math.sin(v)+.17*Math.sin(u*2+time*.21);
        const y1=y*Math.cos(tilt)-z*Math.sin(tilt);const z1=y*Math.sin(tilt)+z*Math.cos(tilt);
        const x2=x*Math.cos(yaw)+z1*Math.sin(yaw);const z2=-x*Math.sin(yaw)+z1*Math.cos(yaw);
        const depth=3.5/(3.5-z2*.4);const px=(x2*Math.cos(twist)-y1*Math.sin(twist))*size*depth;const py=(x2*Math.sin(twist)+y1*Math.cos(twist))*size*depth;
        i ? ctx.lineTo(px,py) : ctx.moveTo(px,py);
      }
      ctx.closePath();
      const intensity=(Math.cos(v-1)+1)/2;
      ctx.strokeStyle=`rgba(${Math.round(139+100*intensity)},${Math.round(155+88*intensity)},255,${.13+.54*intensity})`;
      ctx.lineWidth=intensity>.93?.85:.5;
      ctx.stroke();
    }
    ctx.restore();
  }
  function light(ctx, w, h, time) {
    const hero=ctx.canvas.parentElement.classList.contains('hero-stage');const mobile=w<650;
    const cx=hero?w*(mobile?.55:.74):w*.5;const cy=hero?h*(mobile?.67:.45):h*.5;
    const size=Math.min(w*(hero?.35:.6),h*.65);
    const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,size);glow.addColorStop(0,'#34305266');glow.addColorStop(1,'#10152200');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
    ctx.save();ctx.translate(cx,cy);ctx.rotate(-.48+Math.sin(time*.15)*.08);
    for(let i=0;i<32;i++){const x=(i-16)*size*.026;const hei=size*(.7+.25*Math.sin(i*.13+time*.2));const g=ctx.createLinearGradient(x,-hei/2,x,hei/2);g.addColorStop(0,'#d8e1ff0a');g.addColorStop(.48,'#b9b7ffcc');g.addColorStop(.55,'#e9eaff');g.addColorStop(1,'#655d9f03');ctx.fillStyle=g;ctx.fillRect(x,-hei/2,size*.004,hei);}
    ctx.restore();
  }
  function echo(ctx,w,h,time){
    const hero=ctx.canvas.parentElement.classList.contains('hero-stage');const mobile=w<650;
    ctx.save();ctx.translate(hero?w*(mobile?.55:.74):w*.5,hero?h*(mobile?.67:.45):h*.5);
    const size=Math.min(w*(hero?.55:1),h);
    for(let i=38;i>=0;i--){ctx.beginPath();const r=size*(.07+i*.007);const shift=Math.sin(i*.11+time*.25)*size*.09;ctx.ellipse(shift,Math.cos(i*.12+time*.2)*size*.055,r*1.12,r*.8,-.5+Math.sin(time*.12)*.1,0,Math.PI*2);ctx.strokeStyle=`rgba(${150+i*2},${155+i*2},255,${.12+i*.014})`;ctx.lineWidth=.65;ctx.stroke();}ctx.restore();
  }
  function draw(stamp) {
    requestAnimationFrame(draw);
    if (document.hidden || (paused && !needsDraw)) { previous = stamp; return; }
    if (stamp-previous < 1000/24) return;
    const delta = previous ? Math.min((stamp-previous)/1000,.1) : 0; previous=stamp;
    if (!paused && !document.hidden) elapsed += delta;
    canvases.forEach(item => {
      const {canvas,context:ctx,w,h}=item; if(!w||!h)return;
      const rect=canvas.getBoundingClientRect();if(rect.bottom<0||rect.top>innerHeight)return;
      if(canvas.closest('dialog')&&!canvas.closest('dialog').open)return;
      const art=canvas.parentElement.dataset.art;ctx.clearRect(0,0,w,h);
      if(art==='ribbon')ribbon(ctx,w,h,elapsed,canvas.closest('.hero-stage'));else if(art==='light')light(ctx,w,h,elapsed);else echo(ctx,w,h,elapsed);
    });
    const seconds=Math.floor(elapsed);document.querySelector('.frame-counter').textContent=`00:${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
    needsDraw = false;
  }
  requestAnimationFrame(draw);
})();
