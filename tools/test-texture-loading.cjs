const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');

function fixture(protocol='http:'){
  const images=[],messages=[];
  class Image { constructor(){this.naturalWidth=1440;this.naturalHeight=810;images.push(this);} }
  const context={window:{WuyiGenerative:{hash:()=>1,texture:()=>({canvas:true})}},location:{protocol},Image};
  vm.runInNewContext(readFileSync(join(__dirname,'../dist/space.js'),'utf8'),context);
  const Space=context.window.WuyiSpace;
  Space.prototype.initialize=function(){};
  Space.prototype.upload=function(image){if(image instanceof Image)throw new Error('SecurityError: tainted canvas');return {valid:true};};
  let contextRequests=0;
  const canvas={getContext(){contextRequests++;return{};},addEventListener(){}};
  const space=new Space(canvas,[{src:'photo.webp'}],1,message=>{if(message)messages.push(message);});
  return{space,images,messages,contextRequests};
}

// A decoded photo is not usable when GPU upload is blocked.
const failed=fixture();
assert.doesNotThrow(()=>failed.images[0].onload());
assert.equal(failed.space.sources[0].ready,false);
assert.equal(failed.space.sources[0].texture,null);
assert.equal(failed.space.sourceFor({index:0,hash:1}).procedural,true);
assert.equal(failed.messages.length,1);

// A later successful upload makes the real photo selectable again.
failed.space.upload=()=>({valid:true});
failed.images[0].onload();
assert.equal(failed.space.sources[0].ready,true);
assert.equal(failed.space.sourceFor({index:0,hash:1}),failed.space.sources[0]);

// Even stale readiness must never select a null GPU texture.
failed.space.sources[0].texture=null;
assert.equal(failed.space.sourceFor({index:0,hash:1}).procedural,true);

// Local file mode skips WebGL entirely; the app can explain HTTP preview.
const local=fixture('file:');
assert.equal(local.space.available,false);
assert.equal(local.contextRequests,0);
console.log('Texture failure, recovery, null texture and file mode checks passed.');
