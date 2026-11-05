/* Local STL inspector: no analytics, upload endpoint, tracking, file persistence or external library. */
(() => {
  'use strict';
  const lab=document.querySelector('.fab-lab'); if(!lab)return;
  const get=id=>document.getElementById('fab-'+id),canvas=get('canvas'),field=get('field'),status=get('status');
  const limitBytes=12*1024*1024,limitFaces=80000,demo='assets/studio-sample.stl';
  const fail=m=>{throw new Error(m);}, damaged='تعذّرت قراءة بنية STL. جرّب تصدير الملف من جديد بصيغة STL ثنائية أو نصية.';
  const num='[+-]?(?:\\d+\\.?\\d*|\\.\\d+)(?:[Ee][+-]?\\d+)?', normal=new RegExp('^facet\\s+normal(?:\\s+'+num+'){3}$','i'),vertex=new RegExp('^vertex\\s+('+num+')\\s+('+num+')\\s+('+num+')$','i');
  function decode(buffer){
    const len=buffer.byteLength;if(len>limitBytes||!len)fail('الملف فارغ أو يتجاوز حدّ ١٢ ميبيبايت.');
    const data=new DataView(buffer),count=len>=84?data.getUint32(80,true):0, bin=(count>0&&84+50*count===len);
    const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
    let stream,n=0;
    const xyz=(x,y,z)=>{
      if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(z)||Math.max(Math.abs(x),Math.abs(y),Math.abs(z))>1e12)fail('يحتوي الملف إحداثيات غير صالحة أو خارج مدى العارض.');
      for(const [i,v] of [[0,x],[1,y],[2,z]]){if(v<lo[i])lo[i]=v;if(v>hi[i])hi[i]=v;}
      if(bin){stream[n++]=x;stream[n++]=y;stream[n++]=z;}else{stream.push(x,y,z);n+=3;}
    };
    if(bin){
      if(count>limitFaces)fail('تجاوز النموذج ٨٠ ألف مثلث؛ استخدم نسخة أخف للمعاينة.'); stream=new Float64Array(9*count);
      for(let i=0;i<count;i++)for(let j=0;j<3;j++){const p=96+i*50+j*12;xyz(data.getFloat32(p,true),data.getFloat32(p+4,true),data.getFloat32(p+8,true));}
    }else{
      const sample=new TextDecoder().decode(new Uint8Array(buffer,0,Math.min(len,120)));if(!/^\s*solid(?:\s|$)/i.test(sample))fail(damaged);
      stream=[];let state='solid',solids=0;
      for(const m of new TextDecoder().decode(buffer).matchAll(/[^\r\n]+/g)){
        const l=m[0].trim();if(!l)continue;if(l.length>4000)fail(damaged);
        if(state==='solid'){if(!/^solid(?:\s|$)/i.test(l))fail(damaged);solids++;state='facet';}
        else if(state==='facet'){
          if(/^endsolid(?:\s|$)/i.test(l)){state='solid';continue;}
          if(n>=limitFaces*9)fail('تجاوز النموذج ٨٠ ألف مثلث؛ استخدم نسخة أخف للمعاينة.');
          if(!normal.test(l))fail(damaged);state='loop';
        }else if(state==='loop'){if(!/^outer\s+loop$/i.test(l))fail(damaged);state=0;}
        else if(typeof state==='number'){const v=vertex.exec(l);if(!v)fail(damaged);xyz(Number(v[1]),Number(v[2]),Number(v[3]));state=state===2?'endloop':state+1;}
        else if(state==='endloop'){if(!/^endloop$/i.test(l))fail(damaged);state='endfacet';}
        else if(state==='endfacet'){if(!/^endfacet$/i.test(l))fail(damaged);state='facet';}
      }
      if(!solids||state!=='solid'||!n||n%9)fail(damaged);
    }
    const size=lo.map((v,i)=>hi[i]-v),centre=lo.map((v,i)=>v+size[i]*.5),radius=Math.hypot(...size)/2;if(!radius||!Number.isFinite(radius))fail('لا يحتوي الملف حجمًا مكانيًا يمكن عرضه.');
    const packed=new Float32Array(n*2);let cursor=0;
    for(let i=0;i<n;i+=9){
      const ax=(stream[i+3]-stream[i])/radius,ay=(stream[i+4]-stream[i+1])/radius,az=(stream[i+5]-stream[i+2])/radius,bx=(stream[i+6]-stream[i])/radius,by=(stream[i+7]-stream[i+1])/radius,bz=(stream[i+8]-stream[i+2])/radius;
      const x=ay*bz-az*by,y=az*bx-ax*bz,z=ax*by-ay*bx,h=Math.hypot(x,y,z);if(h<1e-15)continue;
      for(let k=0;k<3;k++){let j=i+k*3;packed[cursor++]=(stream[j]-centre[0])/radius;packed[cursor++]=(stream[j+1]-centre[1])/radius;packed[cursor++]=(stream[j+2]-centre[2])/radius;packed[cursor++]=x/h;packed[cursor++]=y/h;packed[cursor++]=z/h;}
    }
    if(!cursor)fail('كل مثلثات هذا الملف منعدمة المساحة.');
    return {vertices:packed.subarray(0,cursor),faces:n/9,size,units:'mm'};
  }
  // Same camera basis in WebGL and in the optional canvas software preview.
  const rad=Math.PI/180;
  let model=null,gen=0,pending=0,angle=27,tilt=30,zoom=100,gl=null,c2=null,buffer=null,program=null,un=null,soft=false;
  function initGL(){
    try{gl=canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'low-power',preserveDrawingBuffer:false,stencil:false});}catch{}
    if(!gl)return false;
    const v='attribute vec3 p;attribute vec3 n;uniform vec3 rowX,rowY,rowZ;uniform vec2 scale;varying vec3 norm;void main(){gl_Position=vec4(dot(p,rowX)*scale.x,dot(p,rowY)*scale.y,-dot(p,rowZ)*0.47,1.0);norm=vec3(dot(n,rowX),dot(n,rowY),dot(n,rowZ));}';
    const f='precision mediump float;varying vec3 norm;void main(){vec3 N=normalize(norm);if(!gl_FrontFacing)N=-N;float light=max(0.0,dot(N,normalize(vec3(-0.45,0.70,0.59))));float rim=pow(1.0-clamp(abs(N.z),0.0,1.0),2.0);gl_FragColor=vec4(vec3(0.79,0.47,0.29)*(0.52+0.52*light)+vec3(0.12,0.08,0.055)*rim,1.0);}';
    try{
      function shader(type,src){const q=gl.createShader(type);gl.shaderSource(q,src);gl.compileShader(q);if(!gl.getShaderParameter(q,gl.COMPILE_STATUS))throw new Error('shader');return q;}
      const vs=shader(gl.VERTEX_SHADER,v),fs=shader(gl.FRAGMENT_SHADER,f);program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('link');gl.useProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
      buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      for(const [key,offset] of [['p',0],['n',12]]){const loc=gl.getAttribLocation(program,key);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,24,offset);}
      un=Object.fromEntries(['rowX','rowY','rowZ','scale'].map(k=>[k,gl.getUniformLocation(program,k)]));gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);return true;
    }catch{gl=null;return false;}
  }
  let renderer=initGL();
  if(!renderer){try{c2=canvas.getContext('2d')}catch{}if(c2){renderer=true;soft=true;}}
  function board(){
    if(!model||!renderer)return;
    const dpr=Math.min(window.devicePixelRatio||1,1.65),w=Math.round(field.clientWidth*dpr),h=Math.round(field.clientHeight*dpr);if(w<2||h<2)return;
    if(w!==canvas.width||h!==canvas.height){canvas.width=w;canvas.height=h;}
    const a=angle*rad,b=tilt*rad,sa=Math.sin(a),ca=Math.cos(a),sb=Math.sin(b),cb=Math.cos(b),rx=[ca,sa,0],ry=[-sa*sb,ca*sb,cb],rz=[sa*cb,-ca*cb,sb],scale=.88*zoom/100,sx=scale*Math.min(1,h/w),sy=scale*Math.min(1,w/h);
    const verts=model.vertices;
    if(gl){
      gl.viewport(0,0,w,h);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform3fv(un.rowX,rx);gl.uniform3fv(un.rowY,ry);gl.uniform3fv(un.rowZ,rz);gl.uniform2f(un.scale,sx,sy);gl.drawArrays(gl.TRIANGLES,0,verts.length/6);return;
    }
    c2.clearRect(0,0,w,h);const list=[],stride=18*Math.max(1,Math.ceil(verts.length/18/16000));const dot=(x,y,z,r)=>x*r[0]+y*r[1]+z*r[2];
    for(let i=0;i<verts.length;i+=stride){
      let points=[],dep=0;
      for(let k=0;k<3;k++){let j=i+k*6,x=verts[j],y=verts[j+1],z=verts[j+2];points.push([w*(.5+.5*sx*dot(x,y,z,rx)),h*(.5-.5*sy*dot(x,y,z,ry))]);dep+=dot(x,y,z,rz);}
      const x=verts[i+3],y=verts[i+4],z=verts[i+5],nz=dot(x,y,z,rz),flip=nz<0?-1:1,nx=dot(x,y,z,rx)*flip,ny=dot(x,y,z,ry)*flip;
      const l=.52+.52*Math.max(0,-.45*nx+.7*ny+.59*nz*flip),color='rgb('+[202,120,74].map(c=>Math.min(255,Math.round(c*l))).join(',')+')';list.push({points,dep,color});
    }
    list.sort((a,b)=>a.dep-b.dep);
    for(const q of list){c2.fillStyle=c2.strokeStyle=q.color;c2.beginPath();c2.moveTo(...q.points[0]);c2.lineTo(...q.points[1]);c2.lineTo(...q.points[2]);c2.closePath();c2.fill();c2.lineWidth=.5;c2.stroke();}
  }
  function draw(){if(!pending&&renderer){pending=requestAnimationFrame(()=>{pending=0;board()});}}
  function axes(){
    for(const [id,val,unit] of [['yaw',angle,'°'],['tilt',tilt,'°'],['zoom',zoom,'%']]){get(id).value=val;get(id+'-v').textContent=val+unit;}
    draw();
  }
  const ar=new Intl.NumberFormat('ar-SA',{maximumFractionDigits:2});
  function loadModel(result,name){
    model=result;get('name').textContent=name;get('faces').textContent=ar.format(result.faces);
    ['x','y','z'].forEach((id,i)=>get(id).textContent=ar.format(result.size[i]));
    if(gl){gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,result.vertices,gl.STATIC_DRAW);}
    angle=27;tilt=30;zoom=100;axes();get('controls').hidden=!renderer;get('fallback').hidden=renderer;
    status.textContent='اكتملت قراءة '+name+' داخل المتصفّح.'+(soft&&result.faces>16000?' رسم مخفّف للمعاينة، والقياسات من الملف الكامل.':'');
  }
  async function read(which){
    const token=++gen;if(!which){status.textContent='جارٍ فتح عيّنة عُمق…';}else{status.textContent='جارٍ قراءة الملف من جهازك…';}
    try{
      let bytes,name;
      if(which){
        if(!/\.stl$/i.test(which.name))fail('اختر ملفًا بامتداد STL.');
        if(!which.size||which.size>limitBytes)fail('اختر ملف STL غير فارغ بحجم لا يتجاوز ١٢ ميبيبايت.');
        bytes=await which.arrayBuffer();name=which.name;
      }else{
        const req=await fetch(demo,{credentials:'same-origin'});if(!req.ok)throw new Error('عينة غير متاحة');bytes=await req.arrayBuffer();name='عيّنة عُمق المدرّجة';
      }
      if(token!==gen)return;const result=decode(bytes);if(token!==gen)return;loadModel(result,name);
    }catch(e){
      if(token!==gen)return;status.textContent=which?(e.message===damaged||/[\u0600-\u06ff]/.test(e.message)?e.message:'تعذّرت قراءة الملف. اختر نسخة STL أخرى.'):'تعذّر عرض العيّنة. يمكنك تنزيلها أدناه أو فتح ملف STL من جهازك.';
    }
  }
  get('load').hidden=false;
  get('pick').addEventListener('click',()=>get('input').click());get('input').addEventListener('change',e=>{const file=e.target.files[0];e.target.value='';if(file)read(file);});
  get('sample').addEventListener('click',()=>read(null));get('reset').addEventListener('click',()=>{angle=27;tilt=30;zoom=100;axes();});
  for(const id of ['yaw','tilt','zoom']) get(id).addEventListener('input',()=>{angle=Number(get('yaw').value);tilt=Number(get('tilt').value);zoom=Number(get('zoom').value);axes();});
  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
  canvas.addEventListener('keydown',e=>{
    const k=e.key;if(e.ctrlKey||e.metaKey||e.altKey||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(k))return;e.preventDefault();
    if(k==='Home'){angle=27;tilt=30;zoom=100;}else if(k==='ArrowRight'||k==='ArrowLeft')angle=(angle+(k==='ArrowRight'?5:-5)+360)%360;else if(k==='ArrowUp'||k==='ArrowDown')tilt=clamp(tilt+(k==='ArrowUp'?5:-5),-70,85);else zoom=clamp(zoom+(k==='-'?-5:5),50,190);axes();
  });
  let drag=null;canvas.addEventListener('pointerdown',e=>{if(!model||e.button!==0||!e.isPrimary)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,angle,active:false};});
  canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;if(e.pointerType==='mouse'&&!(e.buttons&1)){drag=null;return;}let dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.active){if(Math.abs(dy)>Math.abs(dx)+4){drag=null;return;}if(Math.abs(dx)<4)return;drag.active=true;canvas.setPointerCapture(e.pointerId);}angle=Math.round(((drag.angle+dx*.65)%360+360)%360)%360;axes();});
  ['pointerup','pointercancel','lostpointercapture'].forEach(k=>canvas.addEventListener(k,()=>{drag=null;}));
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();renderer=false;get('fallback').hidden=false;get('controls').hidden=true;status.textContent='توقفت المعاينة الرسومية مؤقتًا. بقيت قياسات الملف متاحة.';});
  canvas.addEventListener('webglcontextrestored',()=>{if(initGL()){renderer=true;if(model)loadModel(model,get('name').textContent);}});
  if('ResizeObserver'in window)new ResizeObserver(draw).observe(field);else window.addEventListener('resize',draw,{passive:true});
  read(null);
})();
