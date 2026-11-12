// Self-contained progressive enhancement. Load with <script type="module">.
// Detect real decoded alpha instead of guessing transparency from the browser name.
async function initialize(container) {
  const video=container.querySelector('video');
  const poster=container.querySelector('[data-poster]');
  const fallback=container.querySelector('[data-animation]');
  const button=container.querySelector('button');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let mode='poster',paused=motion.matches;
  const show=kind=>{mode=kind;video.hidden=kind!=='video';poster.hidden=kind!=='poster';fallback.hidden=kind!=='webp';};
  function label(){button.textContent=paused?'Play animation':'Pause animation';button.setAttribute('aria-label',button.textContent);}
  async function start(){
    paused=false;label();
    if(mode==='webp'||container.dataset.decoder==='webp'){
      fallback.src=fallback.dataset.src;show('webp');return;
    }
    try {
      if(!video.src){
        const ready=new Promise((resolve,reject)=>{
          const timeout=setTimeout(()=>reject(Error('Video timeout')),5000);
          video.addEventListener('loadeddata',()=>{clearTimeout(timeout);resolve();},{once:true});
          video.addEventListener('error',()=>{clearTimeout(timeout);reject(Error('Video unavailable'));},{once:true});
        });
        video.src=video.dataset.src;video.load();await ready;
      }
      if(paused)return;
      await video.play();
      if(video.requestVideoFrameCallback)await Promise.race([new Promise(resolve=>video.requestVideoFrameCallback(resolve)),new Promise(resolve=>setTimeout(resolve,1000))]);
      if(paused){video.pause();return;}
      const canvas=document.createElement('canvas');canvas.width=2;canvas.height=2;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(video,0,0);
      if(ctx.getImageData(0,0,1,1).data[3]!==0)throw Error('Decoder discarded alpha');
      container.dataset.decoder='video';show('video');
    } catch {
      video.pause();container.dataset.decoder='webp';
      if(!paused){fallback.src=fallback.dataset.src;show('webp');}
    }
  }
  function stop(){paused=true;video.pause();if(mode==='webp')fallback.removeAttribute('src');show('poster');label();}
  button.addEventListener('click',()=>paused?start():stop());
  motion.addEventListener('change',e=>{if(e.matches)stop();});
  show('poster');label();
  if(!paused)await start();
}
document.querySelectorAll('[data-hopper]').forEach(initialize);
