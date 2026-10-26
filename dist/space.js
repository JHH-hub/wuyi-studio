/* Original WebGL image volume. Positive camera-space Z points into the scene. */
(() => {
  'use strict';
  const G=window.WuyiGenerative;
  const vertex=`
    attribute vec2 a_position;
    uniform vec3 u_center,u_camera,u_angles,u_view;
    uniform vec2 u_size;
    uniform float u_aspect,u_lens,u_time,u_motion;
    varying vec2 v_uv;
    varying float v_depth;
    vec3 rotate(vec3 p,vec3 a){
      p=vec3(p.x,cos(a.x)*p.y-sin(a.x)*p.z,sin(a.x)*p.y+cos(a.x)*p.z);
      p=vec3(cos(a.y)*p.x+sin(a.y)*p.z,p.y,-sin(a.y)*p.x+cos(a.y)*p.z);
      return vec3(cos(a.z)*p.x-sin(a.z)*p.y,sin(a.z)*p.x+cos(a.z)*p.y,p.z);
    }
    void main(){
      v_uv=a_position+.5;
      vec3 p=vec3(a_position*u_size,0.);
      float wave=sin(v_uv.x*3.14159)*sin(v_uv.y*3.14159);
      p.z+=wave*(38.+u_motion*100.)+sin(v_uv.x*5.+u_time*.3)*12.*wave;
      p=rotate(p,u_angles)+u_center-u_camera;
      p=rotate(p,u_view);
      v_depth=p.z;
      float near=70.,far=16500.,f=1.804*u_lens;
      gl_Position=vec4(p.x*f/u_aspect,p.y*f,((far+near)*p.z-2.*far*near)/(far-near),p.z);
    }`;
  const fragment=`
    precision mediump float;
    uniform sampler2D u_image;
    uniform vec2 u_crop;
    uniform float u_reveal,u_hover,u_variant;
    varying vec2 v_uv;
    varying float v_depth;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    void main(){
      vec2 uv=(v_uv-.5)*u_crop+.5;
      vec3 col=texture2D(u_image,vec2(uv.x,1.-uv.y)).rgb;
      float lum=dot(col,vec3(.2126,.7152,.0722));
      col=mix(vec3(lum),col,.9);
      col*=.88+u_hover*.17;
      float fog=exp(-pow(v_depth/6200.,1.5));
      vec3 mist=vec3(.037,.045,.043);
      col=mix(mist,col,fog);
      float edge=min(min(v_uv.x,1.-v_uv.x),min(v_uv.y,1.-v_uv.y));
      col+=vec3(.35,.4,.32)*(1.-smoothstep(0.,.0015,edge))*(.06+u_hover*.65)*fog;
      float grain=hash(floor(v_uv*vec2(280.,170.))+u_variant);
      float reveal=smoothstep(grain*.55,grain*.55+.35,u_reveal);
      float nearFade=smoothstep(100.,420.,v_depth);
      gl_FragColor=vec4(col,reveal*nearFade*(1.-smoothstep(12000.,16000.,v_depth)));
    }`;
  const bgVertex=`attribute vec2 a_position;varying vec2 v_uv;void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`;
  const bgFragment=`precision mediump float;varying vec2 v_uv;uniform vec2 u_shift;uniform float u_aspect;void main(){vec2 p=(v_uv-vec2(.57,.52)-u_shift*.02)*vec2(u_aspect,1.);float glow=exp(-dot(p,p)*2.5);vec3 c=mix(vec3(.018,.022,.022),vec3(.045,.056,.051),glow);float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);gl_FragColor=vec4(c+(grain-.5)*.012,1.);}`;
  function rotate(p,a){let [x,y,z]=p;let c=Math.cos(a[0]),s=Math.sin(a[0]);[y,z]=[c*y-s*z,s*y+c*z];c=Math.cos(a[1]);s=Math.sin(a[1]);[x,z]=[c*x+s*z,-s*x+c*z];c=Math.cos(a[2]);s=Math.sin(a[2]);return[c*x-s*y,s*x+c*y,z];}
  function inside(x,y,points){let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;}
  class WuyiSpace {
    constructor(canvas,images,seed,onChange){
      this.canvas=canvas;this.gl=location.protocol==='file:'?null:canvas.getContext('webgl',{alpha:false,antialias:true,powerPreference:'low-power'});
      this.available=Boolean(this.gl);this.seed=seed;this.onChange=onChange;this.cache=new Map();this.visible=[];this.time=0;this.paused=false;this.camera={x:0,y:0,z:0};this.view=[0,0,0];this.motion=0;this.hovered=null;this.sources=[];this.lost=false;
      if(!this.available)return;
      this.initialize();
      images.forEach(item=>{const image=new Image();const source={...item,image,aspect:item.aspect||16/9,ready:false,texture:null};this.sources.push(source);image.onload=()=>{source.aspect=image.naturalWidth/image.naturalHeight;this.prepareSource(source);};image.onerror=()=>{source.ready=false;this.onChange?.();};image.src=item.src;});
      this.photoCount=images.length;this.addProcedural();
      canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();this.lost=true;this.onChange?.('图形渲染暂不可用，可继续从实验索引浏览。');});
      canvas.addEventListener('webglcontextrestored',()=>{this.lost=false;this.initialize();this.sources.forEach(s=>{if(s.procedural||s.image.naturalWidth)this.prepareSource(s);});this.onChange?.();});
    }
    prepareSource(source){source.ready=false;source.texture=null;try{source.texture=this.upload(source.image,source.procedural?512:1024);source.ready=Boolean(source.texture);}catch(error){if(!this.textureWarning){this.textureWarning=true;this.onChange?.('照片载入受限，已临时使用程序纹理。请通过本地 HTTP 预览或在线网址查看。');}}this.onChange?.();}
    program(vs,fs){const gl=this.gl;const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));return shader;};const p=gl.createProgram(),v=compile(gl.VERTEX_SHADER,vs),f=compile(gl.FRAGMENT_SHADER,fs);gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;}
    initialize(){const gl=this.gl;this.planeProgram=this.program(vertex,fragment);this.bgProgram=this.program(bgVertex,bgFragment);const names=['center','camera','angles','view','size','aspect','lens','time','motion','image','crop','reveal','hover','variant'];this.uniforms=Object.fromEntries(names.map(n=>[n,gl.getUniformLocation(this.planeProgram,'u_'+n)]));this.position=gl.getAttribLocation(this.planeProgram,'a_position');
      const vertices=[];const nx=18,ny=12;for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){let l=x/nx-.5,r=(x+1)/nx-.5,b=y/ny-.5,t=(y+1)/ny-.5;vertices.push(l,b,r,b,l,t,l,t,r,b,r,t);}this.count=vertices.length/2;this.planeBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.planeBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);this.bgBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.bgBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);gl.clearColor(.02,.025,.023,1);}
    upload(image,size){const gl=this.gl,tex=gl.createTexture(),buffer=document.createElement('canvas');if(!tex)throw new Error('Texture allocation failed');try{buffer.width=size;buffer.height=size;buffer.getContext('2d').drawImage(image,0,0,size,size);gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,buffer);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.generateMipmap(gl.TEXTURE_2D);if(gl.getError()!==gl.NO_ERROR)throw new Error('Texture upload failed');return tex;}catch(error){gl.deleteTexture(tex);throw error;}}
    addProcedural(){for(let i=0;i<6;i++){const image=G.texture(G.hash(i,7,this.seed),i%3);this.sources.push({image,aspect:640/420,ready:true,procedural:true,mode:i%3,texture:this.upload(image,512)});}}
    setSeed(seed){this.seed=seed;this.cache.clear();this.hovered=null;this.visible=[];for(const s of this.sources.slice(this.photoCount))this.gl.deleteTexture(s.texture);this.sources.length=this.photoCount;this.addProcedural();}
    resize(width,height,dpr){this.width=width;this.height=height;this.dpr=dpr;this.lens=width<650?.68:1;if(!this.available)return;this.canvas.width=Math.round(width*dpr);this.canvas.height=Math.round(height*dpr);this.gl.viewport(0,0,this.canvas.width,this.canvas.height);}
    tile(x,y,z){const key=`${x}:${y}:${z}`;if(this.cache.has(key))return this.cache.get(key);const hash=G.hash(x+y*7919,z,this.seed),r=G.random(hash);if(r()>.62)return null;const photo=((x*2+y*3+z+this.seed-1)%this.photoCount+this.photoCount)%this.photoCount;const index=r()<.83?photo:this.photoCount+Math.floor(r()*6);const source=this.sources[index],aspect=source.aspect;let w=780+r()*870,h=w/aspect;if(h>1550){h=1550;w=h*aspect;}
      const tile={key,hash,x:x*1100+(r()-.5)*780,y:y*800+(r()-.5)*580,z:z*1450+1150+(r()-.5)*680,w,h,index,angles:[(r()-.5)*.3,(r()-.5)*.7,(r()-.5)*.18],born:this.time-r()*.7,version:0};this.cache.set(key,tile);return tile;}
    sourceFor(tile){let s=this.sources[tile.index];if(!s?.ready||!s.texture)s=this.sources[this.photoCount+(tile.hash%6)];return s;}
    project(tile,dx=0,dy=0){let p=rotate([dx*tile.w,dy*tile.h,0],tile.angles);p=p.map((v,i)=>v+[tile.x,tile.y,tile.z][i]-[this.camera.x,this.camera.y,this.camera.z][i]);p=rotate(p,this.view);if(p[2]<75)return null;const f=this.height*.902*this.lens/p[2];return{x:this.width/2+p[0]*f,y:this.height/2-p[1]*f,z:p[2]};}
    draw(state){if(!this.available||this.lost)return;this.camera=state.camera;this.view=state.view;this.motion=state.motion;this.time=state.time;this.paused=state.paused;const gl=this.gl,u=this.uniforms;
      gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.bgProgram);gl.bindBuffer(gl.ARRAY_BUFFER,this.bgBuffer);const bgPos=gl.getAttribLocation(this.bgProgram,'a_position');gl.enableVertexAttribArray(bgPos);gl.vertexAttribPointer(bgPos,2,gl.FLOAT,false,0,0);gl.uniform2f(gl.getUniformLocation(this.bgProgram,'u_shift'),this.view[1],this.view[0]);gl.uniform1f(gl.getUniformLocation(this.bgProgram,'u_aspect'),this.width/this.height);gl.drawArrays(gl.TRIANGLES,0,3);gl.disableVertexAttribArray(bgPos);
      const visible=[],centerLayer=Math.floor(this.camera.z/1450);for(let layer=centerLayer-1;layer<centerLayer+10;layer++){const depth=layer*1450+1150-this.camera.z;if(depth< -500||depth>15700)continue;const halfY=Math.max(1200,depth*.62),halfX=Math.max(1500,halfY*this.width/this.height);const cx=Math.round(this.camera.x/1100),cy=Math.round(this.camera.y/800),rx=Math.ceil(halfX/1100)+1,ry=Math.ceil(halfY/800)+1;
        for(let y=cy-ry;y<=cy+ry;y++)for(let x=cx-rx;x<=cx+rx;x++){if(Math.abs(layer)<2&&x===0&&y===0)continue;const hash=G.hash(x+y*7919,layer,this.seed);if((hash%1000)/1000>Math.max(.08,.8*Math.exp(-Math.max(depth,0)/4000)))continue;const tile=this.tile(x,y,layer);if(!tile)continue;const center=this.project(tile);if(!center||center.z<90||center.z>16000)continue;const radius=Math.max(tile.w,tile.h)*this.height*.7/center.z;if(center.x+radius<0||center.x-radius>this.width||center.y+radius<0||center.y-radius>this.height)continue;visible.push({tile,depth:center.z,center});}}
      visible.sort((a,b)=>b.depth-a.depth);this.visible=visible;
      gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.useProgram(this.planeProgram);gl.bindBuffer(gl.ARRAY_BUFFER,this.planeBuffer);gl.enableVertexAttribArray(this.position);gl.vertexAttribPointer(this.position,2,gl.FLOAT,false,0,0);gl.uniform3f(u.camera,this.camera.x,this.camera.y,this.camera.z);gl.uniform3fv(u.view,this.view);gl.uniform1f(u.aspect,this.width/this.height);gl.uniform1f(u.lens,this.lens);gl.uniform1f(u.time,this.time);gl.uniform1f(u.motion,this.motion);gl.uniform1i(u.image,0);gl.activeTexture(gl.TEXTURE0);
      for(const {tile}of visible){const source=this.sourceFor(tile);gl.bindTexture(gl.TEXTURE_2D,source.texture);gl.uniform3f(u.center,tile.x,tile.y,tile.z);gl.uniform2f(u.size,tile.w,tile.h);gl.uniform3fv(u.angles,tile.angles);const ratio=tile.w/tile.h;gl.uniform2f(u.crop,Math.min(1,ratio/source.aspect),Math.min(1,source.aspect/ratio));gl.uniform1f(u.reveal,state.paused?1:Math.min(1,(this.time-tile.born)*.9));gl.uniform1f(u.hover,this.hovered?.key===tile.key?1:0);gl.uniform1f(u.variant,tile.hash%100);gl.drawArrays(gl.TRIANGLES,0,this.count);}
      gl.disableVertexAttribArray(this.position);
      if(this.cache.size>1600){const keep=new Set(visible.map(v=>v.tile.key));for(const [key]of this.cache)if(!keep.has(key)){this.cache.delete(key);if(this.cache.size<=1100)break;}}
    }
    hit(x,y){for(let i=this.visible.length-1;i>=0;i--){const {tile,depth}=this.visible[i];if(depth<450)continue;const points=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(p=>this.project(tile,...p));if(points.every(Boolean)&&inside(x,y,points))return tile;}return null;}
    remix(){const choices=this.visible.filter(v=>v.depth>900&&v.depth<8000&&v.tile!==this.hovered);if(!choices.length)return;const tile=choices[Math.floor(this.time*3)%choices.length].tile;tile.version++;tile.index=G.hash(tile.hash,tile.version,this.seed)%this.sources.length;tile.born=this.time;}
  }
  window.WuyiSpace=WuyiSpace;
})();
