(() => {
  'use strict';
  const G=window.WuyiGenerative, C=window.WUYI_FIELD_CONTENT;
  const canvas=document.querySelector('#field'),ctx=canvas.getContext('2d',{alpha:false});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const coarse=matchMedia('(pointer: coarse)');
  const cached=new Map(),sources=C.images.map(item=>{const image=new Image();image.src=item.src;return {...item,image,ready:false};});
  let seed=readSeed(),width=0,height=0,dpr=1,time=0,lastStamp=0,dirty=true,paused=reduced.matches;
  let camera={x:0,y:0,zoom:1},target={...camera},pointer={x:0,y:0},hovered=null,visible=[],lastInteraction=performance.now(),lastRemix=0,selected=null;
  const spacing={x:520,y:360};const pointers=new Map();let gesture=null,clickOrigin=null,suppressClick=false;
  let toastTimer;const tooltip=document.querySelector('#field-tooltip');
  function freshSeed(){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]||1;}
  function readSeed(){const value=new URL(location.href).searchParams.get('seed');return value&&/^\d{1,10}$/.test(value)?Number(value)>>>0:freshSeed();}
  function status(text){const toast=document.querySelector('#toast');toast.textContent=text;toast.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('visible'),2600);}
  function updateSeed(){document.querySelector('#seed-label').textContent=seed.toString(16).toUpperCase().padStart(8,'0');}
  function explore(){document.body.classList.add('is-exploring');lastInteraction=performance.now();}
  function resize(){const mobile=innerWidth<650,nextX=mobile?300:520,nextY=mobile?280:360;if(spacing.x!==nextX){spacing.x=nextX;spacing.y=nextY;cached.clear();hovered=null;}width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);dirty=true;}
  function syncPause(){document.querySelector('#pause').setAttribute('aria-pressed',String(paused));document.querySelector('#pause').textContent=paused?'继续生长':'暂停生长';document.body.classList.toggle('field-paused',paused);dirty=true;}
  function sourceFor(tile){if(tile.photo!==null&&sources[tile.photo].ready)return sources[tile.photo].image;if(!tile.texture)tile.texture=G.texture(tile.hash,tile.mode);return tile.texture;}
  function getTile(col,row){const key=`${col}:${row}`;let tile=cached.get(key);if(tile)return tile;
    const hash=G.hash(col,row,seed),r=G.random(hash),photo=hash%10<7?hash%3:null;
    const wide=.65+r()*.23;const h=photo===null?195+r()*85:190+r()*85;
    tile={key,col,row,hash,photo,mode:hash%3,x:col*spacing.x+(r()-.5)*95,y:row*spacing.y+(r()-.5)*70,w:520*wide,h,depth:.68+r()*.32,born:performance.now(),seen:time,version:0,texture:null,previous:null};
    cached.set(key,tile);return tile;}
  function titleFor(tile){return tile.photo===null?C.proceduralNames[tile.mode]:C.images[tile.photo].title;}
  function noteFor(tile){return tile.photo===null?'实时程序纹理 · 浏览器内生成的视觉占位':C.images[tile.photo].note;}
  function bounds(tile){const scale=camera.zoom*(.88+tile.depth*.12);const mobile=width<650;const px=paused?0:pointer.x;const py=paused?0:pointer.y;
    return {x:width*.5+(tile.x-camera.x)*camera.zoom+(px*(tile.depth-.8)*18),y:height*.47+(tile.y-camera.y)*camera.zoom+(py*(tile.depth-.8)*14),w:tile.w*scale*(mobile?.82:1),h:tile.h*scale*(mobile?.82:1)};}
  function paintFrame(tile,box,stamp){const image=sourceFor(tile),age=(stamp-tile.born)/1100,reveal=paused||reduced.matches?1:Math.min(1,Math.max(0,age));const ease=1-Math.pow(1-reveal,3);const x=box.x-box.w/2,y=box.y-box.h/2;
    const focus=hovered===tile?1:tile.depth;ctx.save();ctx.globalAlpha=.4+focus*.6;
    if(tile.previous&&reveal<1){G.cover(ctx,tile.previous,x,y,box.w,box.h);}
    ctx.save();ctx.beginPath();ctx.rect(x,y,box.w*ease,box.h);ctx.clip();G.cover(ctx,image,x,y,box.w,box.h);ctx.restore();
    if(reveal<1){ctx.fillStyle=`rgba(225,235,193,${(1-reveal)*.28})`;ctx.fillRect(x+box.w*ease-1,y,2,box.h);}
    if(reveal===1)tile.previous=null;
    ctx.strokeStyle=hovered===tile?'rgba(218,235,161,.8)':'rgba(240,238,220,.13)';ctx.lineWidth=hovered===tile?1:.5;ctx.strokeRect(x+.5,y+.5,box.w-1,box.h-1);
    if(box.w>170&&ease>.85){ctx.fillStyle=hovered===tile?'#dce8b6':'#a7a79b';ctx.font='8px monospace';ctx.textAlign='left';ctx.fillText(`${tile.photo===null?'FORM':'FRAME'} / ${tile.hash.toString(16).slice(0,4).toUpperCase()}`,x,y+box.h+15);ctx.textAlign='right';ctx.fillStyle='#75796b';ctx.fillText(hovered===tile?'EXPLORE ↗':'WUYI EXPERIMENT',x+box.w,y+box.h+15);}
    ctx.restore();return reveal<1;}
  function background(){ctx.fillStyle='#090909';ctx.fillRect(0,0,width,height);ctx.fillStyle='#868c6d25';const grid=70*camera.zoom;const offsetX=((width*.5-camera.x*camera.zoom)%grid+grid)%grid,offsetY=((height*.47-camera.y*camera.zoom)%grid+grid)%grid;
    for(let x=offsetX;x<width;x+=grid)for(let y=offsetY;y<height;y+=grid)ctx.fillRect(x,y,1,1);
  }
  function render(stamp){requestAnimationFrame(render);if(document.hidden){lastStamp=stamp;return;}const interval=coarse.matches?1000/25:1000/35;if(stamp-lastStamp<interval)return;
    const dt=lastStamp?Math.min((stamp-lastStamp)/1000,.08):0;lastStamp=stamp;
    const modal=Boolean(document.querySelector('dialog[open]'));
    if(!paused&&!modal)time+=dt;
    let moving=Math.abs(target.x-camera.x)+Math.abs(target.y-camera.y)+Math.abs(target.zoom-camera.zoom)*100>0.015;
    if(!paused&&!modal&&!gesture&&stamp-lastInteraction>7000){target.x+=dt*6.5;target.y+=dt*1.5;moving=true;}
    if(paused&&!dirty&&!moving)return;
    const smoothing=reduced.matches?1:1-Math.exp(-dt*11);camera.x+=(target.x-camera.x)*smoothing;camera.y+=(target.y-camera.y)*smoothing;camera.zoom+=(target.zoom-camera.zoom)*smoothing;
    document.querySelector('#zoom-value').textContent=`${Math.round(camera.zoom*100)}%`;
    background();const col=Math.round(camera.x/spacing.x),row=Math.round(camera.y/spacing.y),cols=Math.ceil(width/(spacing.x*camera.zoom)/2)+2,rows=Math.ceil(height/(spacing.y*camera.zoom)/2)+2;
    visible=[];let revealing=false;
    for(let y=row-rows;y<=row+rows;y++)for(let x=col-cols;x<=col+cols;x++){
      // A quiet opening around the initial title; the field continues in every direction.
      if(x===0&&y===0)continue;const tile=getTile(x,y),box=bounds(tile);
      if(box.x+box.w/2< -30||box.x-box.w/2>width+30||box.y+box.h/2< -30||box.y-box.h/2>height+30)continue;
      tile.seen=time;visible.push({tile,box});revealing=paintFrame(tile,box,stamp)||revealing;
    }
    if(!paused&&!modal&&!gesture&&time-lastRemix>6&&visible.length){lastRemix=time;const eligible=visible.filter(v=>v.tile!==hovered);if(eligible.length){const {tile}=eligible[Math.floor(time*7)%eligible.length];tile.previous=sourceFor(tile);tile.version++;tile.hash=G.hash(tile.col+tile.version*13,tile.row,seed);tile.photo=tile.hash%10<7?tile.hash%3:null;tile.mode=tile.hash%3;tile.texture=null;tile.born=stamp;revealing=true;}}
    if(cached.size>100){const keep=new Set(visible.map(v=>v.tile.key));for(const [key,tile] of cached){if(!keep.has(key)){tile.texture=null;tile.previous=null;cached.delete(key);if(cached.size<=80)break;}}}
    dirty=revealing||moving;
  }
  function hit(x,y){for(let i=visible.length-1;i>=0;i--){const v=visible[i];if(x>=v.box.x-v.box.w/2&&x<=v.box.x+v.box.w/2&&y>=v.box.y-v.box.h/2&&y<=v.box.y+v.box.h/2)return v.tile;}return null;}
  function updateHover(event){hovered=hit(event.clientX,event.clientY);canvas.classList.toggle('hover-frame',Boolean(hovered));if(hovered&&!coarse.matches&&!gesture){tooltip.textContent=`${titleFor(hovered)}  ↗`;tooltip.style.left=`${Math.min(event.clientX+18,width-170)}px`;tooltip.style.top=`${Math.min(event.clientY+18,height-80)}px`;tooltip.classList.add('visible');}else tooltip.classList.remove('visible');dirty=true;}
  function gestureSnapshot(){const a=[...pointers.values()];return a.length>1?{type:'pinch',distance:Math.hypot(a[1].x-a[0].x,a[1].y-a[0].y),zoom:target.zoom,x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2,cameraX:target.x,cameraY:target.y}:{type:'pan',x:a[0].x,y:a[0].y,cameraX:target.x,cameraY:target.y};}
  canvas.addEventListener('pointerdown',event=>{if(event.button!==0)return;canvas.focus({preventScroll:true});canvas.setPointerCapture(event.pointerId);pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});gesture=gestureSnapshot();if(pointers.size===1){clickOrigin={x:event.clientX,y:event.clientY};suppressClick=false;}else suppressClick=true;lastInteraction=performance.now();canvas.classList.add('dragging');tooltip.classList.remove('visible');});
  canvas.addEventListener('pointermove',event=>{pointer.x=event.clientX/width-.5;pointer.y=event.clientY/height-.5;if(!pointers.has(event.pointerId)){updateHover(event);return;}pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});if(!gesture)return;
    const a=[...pointers.values()];if(gesture.type==='pinch'&&a.length>1){const distance=Math.hypot(a[1].x-a[0].x,a[1].y-a[0].y);target.zoom=Math.max(.5,Math.min(1.7,gesture.zoom*distance/Math.max(gesture.distance,1)));const cx=(a[0].x+a[1].x)/2,cy=(a[0].y+a[1].y)/2;target.x=gesture.cameraX-(cx-gesture.x)/target.zoom;target.y=gesture.cameraY-(cy-gesture.y)/target.zoom;explore();}
    else{target.x=gesture.cameraX-(event.clientX-gesture.x)/camera.zoom;target.y=gesture.cameraY-(event.clientY-gesture.y)/camera.zoom;if(clickOrigin&&Math.hypot(event.clientX-clickOrigin.x,event.clientY-clickOrigin.y)>6){suppressClick=true;explore();}}
    dirty=true;lastInteraction=performance.now();
  });
  function pointerEnd(event){const wasPan=gesture?.type==='pan';const tile=!suppressClick&&wasPan?hit(event.clientX,event.clientY):null;pointers.delete(event.pointerId);if(pointers.size){gesture=gestureSnapshot();suppressClick=true;}else{gesture=null;canvas.classList.remove('dragging');}if(tile)openFrame({...tile});lastInteraction=performance.now();dirty=true;}
  canvas.addEventListener('pointerup',pointerEnd);canvas.addEventListener('pointercancel',event=>{pointers.delete(event.pointerId);gesture=pointers.size?gestureSnapshot():null;suppressClick=true;canvas.classList.remove('dragging');});
  canvas.addEventListener('pointerleave',()=>{hovered=null;pointer={x:0,y:0};tooltip.classList.remove('visible');canvas.classList.remove('hover-frame');dirty=true;});
  function setZoom(value,x=width/2,y=height/2){const z=Math.max(.5,Math.min(1.7,value));target.x+=(x-width*.5)*(1/target.zoom-1/z);target.y+=(y-height*.47)*(1/target.zoom-1/z);target.zoom=z;dirty=true;explore();}
  canvas.addEventListener('wheel',event=>{event.preventDefault();const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?height:1);if(event.shiftKey){target.x+=delta/camera.zoom;explore();}else setZoom(target.zoom*Math.exp(-delta*.001),event.clientX,event.clientY);dirty=true;},{passive:false});
  function reset(){target={x:0,y:0,zoom:1};document.body.classList.remove('is-exploring');lastInteraction=performance.now();dirty=true;}
  function newSeed(){seed=freshSeed();cached.clear();hovered=null;visible=[];time=0;lastRemix=0;reset();updateSeed();status('新的构图正在显影');}
  document.querySelector('#brand-home').addEventListener('click',e=>{e.preventDefault();reset();});document.querySelector('#reset').addEventListener('click',reset);
  document.querySelector('#new-seed').addEventListener('click',newSeed);document.querySelector('#pause').addEventListener('click',()=>{paused=!paused;syncPause();});document.querySelector('#zoom-out').addEventListener('click',()=>setZoom(target.zoom/1.16));document.querySelector('#zoom-in').addEventListener('click',()=>setZoom(target.zoom*1.16));
  canvas.addEventListener('keydown',event=>{const moves={ArrowLeft:[-100,0],ArrowRight:[100,0],ArrowUp:[0,-100],ArrowDown:[0,100]};if(moves[event.key]){event.preventDefault();target.x+=moves[event.key][0]/target.zoom;target.y+=moves[event.key][1]/target.zoom;explore();dirty=true;}else if(event.key==='+'||event.key==='='){event.preventDefault();setZoom(target.zoom*1.16);}else if(event.key==='-'){event.preventDefault();setZoom(target.zoom/1.16);}else if(event.key===' '){event.preventDefault();paused=!paused;syncPause();}else if(event.key==='Home'){event.preventDefault();reset();}else if(event.key==='Enter'){event.preventDefault();const nearest=[...visible].sort((a,b)=>Math.hypot(a.box.x-width/2,a.box.y-height*.47)-Math.hypot(b.box.x-width/2,b.box.y-height*.47))[0];if(nearest)openFrame({...nearest.tile});}});
  reduced.addEventListener('change',event=>{paused=event.matches;syncPause();});document.addEventListener('visibilitychange',()=>{dirty=true;lastStamp=0;});window.addEventListener('resize',resize);

  const frameDialog=document.querySelector('#frame-dialog'),preview=document.querySelector('#frame-preview'),previewContext=preview.getContext('2d');
  function openFrame(tile){selected=tile;const image=sourceFor(tile);preview.width=1280;preview.height=Math.round(1280*image.height/image.width);G.cover(previewContext,image,0,0,preview.width,preview.height);preview.setAttribute('aria-label',`${titleFor(tile)}，${noteFor(tile)}`);document.querySelector('#frame-title').textContent=titleFor(tile);document.querySelector('#frame-note').textContent=`${noteFor(tile)} / ${tile.hash.toString(16).toUpperCase()}`;tooltip.classList.remove('visible');if(!frameDialog.open)frameDialog.showModal();}
  function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  document.querySelector('#save-frame').addEventListener('click',()=>{if(!selected)return;preview.toBlob(blob=>{if(blob)download(blob,`WUYI-${selected.hash.toString(16)}.png`);},'image/png');});
  document.querySelectorAll('dialog').forEach(dialog=>{dialog.querySelector('.close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{dirty=true;lastInteraction=performance.now();});dialog.addEventListener('click',event=>{const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();});});
  document.querySelector('#studio-open').addEventListener('click',()=>document.querySelector('#studio-dialog').showModal());document.querySelector('#brief-open').addEventListener('click',()=>document.querySelector('#brief-dialog').showModal());
  const team=document.querySelector('#team-grid');C.members.forEach((member,index)=>{const figure=document.createElement('figure'),image=document.createElement('img'),caption=document.createElement('figcaption'),small=document.createElement('span');image.src=member.image;image.alt=`无衣团队 ${member.name}`;image.loading='lazy';caption.append(document.createTextNode(member.name));small.textContent=`${String(index+1).padStart(2,'0')} / WUYI COLLECTIVE`;caption.append(small);figure.append(image,caption);team.append(figure);});
  let indexBuilt=false;function buildIndex(){if(indexBuilt)return;indexBuilt=true;const grid=document.querySelector('#index-grid');for(let i=0;i<6;i++){const hash=G.hash(i,42,seed),tile={hash,photo:i<3?i:null,mode:i%3,texture:null};const button=document.createElement('button'),image=document.createElement('img'),title=document.createElement('strong'),note=document.createElement('small');button.className='index-card';image.src=i<3?C.images[i].src:sourceFor(tile).toDataURL('image/webp');image.alt='';title.textContent=titleFor(tile);note.textContent=i<3?'AI GENERATED PLACEHOLDER':'PROCEDURAL / LIVE TEXTURE';button.append(image,title,note);button.addEventListener('click',()=>openFrame({...tile}));grid.append(button);}}
  document.querySelector('#index-open').addEventListener('click',()=>{buildIndex();document.querySelector('#index-dialog').showModal();});
  document.querySelector('#brief-form').addEventListener('submit',event=>{event.preventDefault();const data=new FormData(event.currentTarget);const text=`无衣 WUYI · 项目简报\n\n称呼：${data.get('name')}\n联系方式：${data.get('contact')}\n\n想法：\n${data.get('idea')}\n`;download(new Blob(['\uFEFF'+text],{type:'text/plain;charset=utf-8'}),'无衣-项目简报.txt');document.querySelector('#form-status').textContent=C.email?`简报已下载，可通过 ${C.email} 联系我们。`:'简报已下载至你的设备，信息未上传或发送。';});
  sources.forEach(source=>{source.image.onload=()=>{source.ready=true;dirty=true;};source.image.onerror=()=>{source.ready=false;dirty=true;};if(source.image.complete&&source.image.naturalWidth)source.ready=true;});
  resize();updateSeed();syncPause();requestAnimationFrame(render);
})();
