(() => {
  'use strict';
  const content = window.WUYI_CONTENT;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches;
  let elapsed = 0;
  let previous = 0;
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
  function syncMotion() { motionButton.setAttribute('aria-pressed', String(paused)); motionButton.innerHTML = paused ? '播放动态 <span>▷</span>' : '暂停动态 <span>Ⅱ</span>'; }
  syncMotion();
  motionButton.addEventListener('click', () => { paused = !paused; syncMotion(); });
  reduced.addEventListener('change', e => { paused = e.matches; syncMotion(); });
  const revealObserver = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); } }); }, { threshold: .08 });
  document.querySelectorAll('.section-heading,.studio-body,.person,.practice-list>div').forEach(el => { el.classList.add('reveal'); revealObserver.observe(el); });
  const studies = document.querySelector('#study-dialog');
  document.querySelectorAll('[data-study]').forEach(button => button.addEventListener('click', () => {
    const study = content.studies[Number(button.dataset.study)];
    studies.querySelector('h2').textContent = study.title;
    studies.querySelector('.dialog-text p').textContent = study.description;
    studies.querySelector('[data-art]').dataset.art = study.art;
    studies.showModal();
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
  }); });
  canvases.forEach(item => resize.observe(item.canvas));
  let pointerX = 0, pointerY = 0;
  document.querySelector('.hero-stage').addEventListener('pointermove', e => { const r = e.currentTarget.getBoundingClientRect(); pointerX = (e.clientX - r.left) / r.width - .5; pointerY = (e.clientY - r.top) / r.height - .5; });
  document.querySelector('.hero-stage').addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; });
  function ribbon(ctx, w, h, time, hero) {
    ctx.save(); ctx.translate(w * .5 + (hero ? pointerX * 15 : 0), h * .5 + (hero ? pointerY * 10 : 0));
    ctx.rotate(-.25);
    const size = Math.min(w * .39, h * .7);
    for (let line = 0; line < 75; line++) {
      const phase = line / 74;
      const shade = Math.round(145 + 100 * Math.pow(Math.sin(phase * Math.PI), 1.7));
      ctx.beginPath();
      for (let i = 0; i <= 180; i++) {
        const a = i / 180 * Math.PI * 2;
        const twist = a * 2 + time * .28;
        const radius = size * (.62 + .16 * Math.cos(twist) + (phase - .5) * .4);
        const x = Math.cos(a) * radius * 1.48;
        const y = Math.sin(a) * radius * .66 + Math.sin(twist + phase * 2.5) * size * .24;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(${shade},${shade + 3},${Math.min(255,shade - 3)},${.25 + .48 * Math.sin(phase * Math.PI)})`;
      ctx.lineWidth = phase > .47 && phase < .53 ? 1 : .55;
      ctx.stroke();
    }
    ctx.restore();
  }
  function light(ctx, w, h, time) {
    ctx.fillStyle = '#d0d1c7'; ctx.fillRect(0,0,w,h);
    const glow = ctx.createRadialGradient(w*.57,h*.4,0,w*.5,h*.5,w*.7); glow.addColorStop(0,'#eeeee4');glow.addColorStop(1,'#6c7367');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
    ctx.save();ctx.translate(w*.5,h*.53);ctx.rotate(-.42 + Math.sin(time*.15)*.025);
    for(let i=0;i<34;i++){const x=(i-17)*w*.014;const hei=h*(.55+.16*Math.sin(i*.12+time*.2));ctx.fillStyle=i%2?'rgba(38,47,35,.75)':'rgba(242,240,219,.75)';ctx.fillRect(x,-hei/2,w*.006,hei);}
    ctx.restore();
  }
  function echo(ctx,w,h,time){
    ctx.fillStyle='#22271f';ctx.fillRect(0,0,w,h);ctx.save();ctx.translate(w*.5,h*.5);
    for(let i=25;i>=0;i--){ctx.beginPath();const r=Math.min(w,h)*(.08+i*.012);const shift=Math.sin(i*.13+time*.25)*w*.1;ctx.ellipse(shift,Math.cos(i*.12+time*.2)*h*.05,r*1.25,r*.8,-.45,0,Math.PI*2);ctx.strokeStyle=`rgba(211,215,189,${.2+i*.018})`;ctx.lineWidth=.7;ctx.stroke();}ctx.restore();
  }
  function draw(stamp) {
    requestAnimationFrame(draw);
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
  }
  requestAnimationFrame(draw);
})();
