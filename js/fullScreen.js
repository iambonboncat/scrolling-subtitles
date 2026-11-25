/** V3：沉浸播放、实时控制、方向适配与屏幕常亮 */
(function () {
    'use strict';
    const element = document.querySelector('.box');
    const runBtn = document.querySelector('.run-btn');
    const textBoxEl = document.querySelector('.text-box');
    const rotateBoxEl = document.querySelector('.rotate-box');
    if (!element || !runBtn || !textBoxEl || !rotateBoxEl) return;

    let isPlaying = false, isNativeFullscreen = false, lastTapTime = 0, savedScrollY = 0;
    let wakeLock = null, reversed = false, paused = false, controlsHidden = false;
    const original = {};
    const style = document.createElement('style'); document.head.appendChild(style);

    const panel = document.createElement('div');
    panel.className = 'v3-play-controls';
    panel.innerHTML = '<button type="button" data-action="pause" aria-label="暂停或继续">暂停</button>' +
      '<button type="button" data-action="reverse" aria-label="切换滚动方向">反向</button>' +
      '<label class="v3-speed">速度 <input type="range" min="3" max="30" step="1" value="10" aria-label="滚动时间"></label>' +
      '<button type="button" data-action="hide" aria-label="隐藏控制栏">隐藏</button>' +
      '<button type="button" data-action="exit" aria-label="退出播放">退出</button>';
    element.appendChild(panel);
    const speedInput = panel.querySelector('input');
    const pauseButton = panel.querySelector('[data-action="pause"]');

    function resetAnimation() { style.textContent = `@keyframes marquee{0%{transform:translateX(100vw)}100%{transform:translateX(-100%)}}`; }
    function modifyAnimation() {
        const w=window.innerWidth, h=window.innerHeight, offset=Math.ceil((h-w)/2);
        const start=w+offset+10, end=-textBoxEl.offsetWidth-offset-10;
        style.textContent=`@keyframes marquee{0%{transform:translateX(${start}px)}100%{transform:translateX(${end}px)}}`;
    }
    function checkOrientation() {
        if (!isPlaying) return;
        const portrait=window.innerHeight>window.innerWidth;
        if (portrait) {
            rotateBoxEl.style.transform='rotateZ(90deg)'; modifyAnimation();
            if(textBoxEl.hasAttribute('xiaomaomi-roll')) textBoxEl.style.transform=`translateX(${window.innerWidth+Math.ceil((window.innerHeight-window.innerWidth)/2)+10}px)`;
        } else { rotateBoxEl.style.transform=''; resetAnimation(); if(textBoxEl.hasAttribute('xiaomaomi-roll')) textBoxEl.style.transform='translateX(100vw)'; }
    }
    function saveOriginal(){
        ['height','position','top','left','width','zIndex'].forEach(k=>original['element'+k]=element.style[k]);
        original.fontSize=textBoxEl.style.fontSize; original.transform=textBoxEl.style.transform; original.rotate=rotateBoxEl.style.transform;
        ['position','top','width','overflow'].forEach(k=>original['body'+k]=document.body.style[k]);
        original.animationDuration=textBoxEl.style.animationDuration; original.animationDirection=textBoxEl.style.animationDirection;
    }
    function enterFallback(){
        savedScrollY=window.scrollY; document.body.style.position='fixed'; document.body.style.top=`-${savedScrollY}px`; document.body.style.width='100%'; document.body.style.overflow='hidden';
        element.style.position='fixed'; element.style.top='0'; element.style.left='0'; element.style.width='100vw'; element.style.height='100vh'; element.style.zIndex='99999';
        document.body.classList.add('iphone-playing');
    }
    function restoreFallback(){
        document.body.classList.remove('iphone-playing');
        ['position','top','width','overflow'].forEach(k=>document.body.style[k]=original['body'+k]);
        ['height','position','top','left','width','zIndex'].forEach(k=>element.style[k]=original['element'+k]);
        window.scrollTo(0,savedScrollY);
    }
    async function requestWakeLock(){
        try { if('wakeLock' in navigator && isPlaying) wakeLock=await navigator.wakeLock.request('screen'); }
        catch(e){ console.info('屏幕常亮不可用或被系统拒绝',e); }
    }
    async function releaseWakeLock(){ try{ if(wakeLock){await wakeLock.release(); wakeLock=null;} }catch(e){} }
    function setPaused(value){ paused=value; textBoxEl.style.animationPlayState=value?'paused':'running'; pauseButton.textContent=value?'继续':'暂停'; }
    function setSpeed(value){ const seconds=Number(value); if(seconds>0) textBoxEl.style.animationDuration=seconds+'s'; }
    function setDirection(){ textBoxEl.style.animationDirection=reversed?'reverse':'normal'; panel.querySelector('[data-action="reverse"]').textContent=reversed?'正向':'反向'; }
    function showPanel(){ panel.classList.remove('v3-controls-hidden'); controlsHidden=false; }
    function togglePanel(){ controlsHidden=!controlsHidden; panel.classList.toggle('v3-controls-hidden',controlsHidden); }
    async function startPlay(){
        if(isPlaying)return; isPlaying=true; saveOriginal(); document.body.classList.add('playing');
        const base=parseFloat(textBoxEl.style.fontSize)||130; const ratio=document.documentElement.clientWidth/Math.max(element.clientHeight,1); const scale=ratio>5?ratio-2.8:ratio;
        textBoxEl.style.fontSize=Math.floor(base*Math.max(1,scale))+'px'; element.style.height='100vh'; void element.offsetWidth;
        const req=element.requestFullscreen||element.webkitRequestFullscreen;
        if(req&&document.fullscreenEnabled!==false){try{const r=req.call(element);if(r&&r.then)await r;isNativeFullscreen=document.fullscreenElement===element||document.webkitFullscreenElement===element;}catch(e){isNativeFullscreen=false;}}
        if(!isNativeFullscreen) enterFallback();
        checkOrientation(); void textBoxEl.offsetWidth;
        speedInput.value=String(Math.max(3,Math.min(30,parseFloat(getComputedStyle(textBoxEl).animationDuration)||10)));
        setPaused(false); reversed=false; setDirection(); showPanel(); await requestWakeLock();
    }
    async function stopPlay(){
        if(!isPlaying)return; isPlaying=false; document.body.classList.remove('playing'); await releaseWakeLock();
        if(isNativeFullscreen){const exit=document.exitFullscreen||document.webkitExitFullscreen;if(exit){try{const r=exit.call(document);if(r&&r.then)await r;}catch(e){}}}
        if(!isNativeFullscreen)restoreFallback(); resetFun();
    }
    function resetFun(){
        rotateBoxEl.style.transform=original.rotate||''; textBoxEl.style.fontSize=original.fontSize||''; textBoxEl.style.transform=original.transform||'';
        textBoxEl.style.animationDuration=original.animationDuration||''; textBoxEl.style.animationDirection=original.animationDirection||''; textBoxEl.style.animationPlayState=''; element.style.height=original.elementheight||'';
        isNativeFullscreen=false; reversed=false; paused=false; controlsHidden=false; panel.classList.remove('v3-controls-hidden'); panel.style.display=''; resetAnimation();
        if(textBoxEl.hasAttribute('xiaomaomi-roll'))textBoxEl.style.transform='translateX(100vw)';else textBoxEl.style.transform='translateX(0vw)';
    }
    runBtn.addEventListener('click',e=>{e.preventDefault();startPlay();});
    panel.addEventListener('click',e=>{const action=e.target.closest('button')?.dataset.action;if(!action)return;e.stopPropagation();
        if(action==='pause')setPaused(!paused); if(action==='reverse'){reversed=!reversed;setDirection();} if(action==='hide')togglePanel(); if(action==='exit')stopPlay();
    });
    speedInput.addEventListener('input',()=>setSpeed(speedInput.value));
    element.addEventListener('click',e=>{if(!isPlaying)return;if(e.target.closest('.v3-play-controls'))return;if(controlsHidden)showPanel();});
    function handleFullscreenChange(){const fs=document.fullscreenElement||document.webkitFullscreenElement;if(isPlaying&&isNativeFullscreen&&!fs){isPlaying=false;document.body.classList.remove('playing');releaseWakeLock();restoreFallback();resetFun();}}
    document.addEventListener('fullscreenchange',handleFullscreenChange);document.addEventListener('webkitfullscreenchange',handleFullscreenChange);
    element.addEventListener('fullscreenerror',()=>{if(isPlaying&&!isNativeFullscreen)enterFallback();});
    element.addEventListener('touchend',()=>{const now=Date.now();if(now-lastTapTime<350&&isPlaying)stopPlay();lastTapTime=now;},{passive:true});
    element.addEventListener('dblclick',()=>stopPlay());
    window.addEventListener('resize',()=>{if(isPlaying){if(!isNativeFullscreen)element.style.height='100vh';checkOrientation();}});
    window.addEventListener('orientationchange',()=>{if(isPlaying)setTimeout(checkOrientation,300);});
    document.addEventListener('keydown',e=>{if(!isPlaying)return;if(e.key==='Escape')stopPlay();if(e.code==='Space'&&!e.target.closest('input')){e.preventDefault();setPaused(!paused);}if(e.key==='ArrowUp'){speedInput.value=String(Math.max(3,Number(speedInput.value)-1));setSpeed(speedInput.value);}if(e.key==='ArrowDown'){speedInput.value=String(Math.min(30,Number(speedInput.value)+1));setSpeed(speedInput.value);}});
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&isPlaying)requestWakeLock();});
    resetAnimation(); textBoxEl.style.fontSize='130px';
})();
