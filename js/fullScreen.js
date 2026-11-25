/** V3.1：稳定播放控制、触摸冲突保护、屏幕常亮生命周期与方向适配 */
(function () {
    'use strict';
    const element = document.querySelector('.box');
    const runBtn = document.querySelector('.run-btn');
    const textBoxEl = document.querySelector('.text-box');
    const rotateBoxEl = document.querySelector('.rotate-box');
    if (!element || !runBtn || !textBoxEl || !rotateBoxEl) return;

    let isPlaying = false, isNativeFullscreen = false, lastTapTime = 0, savedScrollY = 0;
    let wakeLock = null, reversed = false, paused = false, controlsHidden = false, fallbackActive = false;
    let wakeLockRequestPending = false, resizeTimer = null;
    const original = {};
    const style = document.createElement('style');
    style.dataset.v31PlaybackStyle = 'true';
    document.head.appendChild(style);

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
    const reverseButton = panel.querySelector('[data-action="reverse"]');

    function resetAnimation() {
        style.textContent = '@keyframes marquee{0%{transform:translateX(100vw)}100%{transform:translateX(-100%)}}';
    }
    function modifyAnimation() {
        const w = window.innerWidth, h = window.innerHeight, offset = Math.ceil((h - w) / 2);
        const start = w + offset + 10, end = -textBoxEl.offsetWidth - offset - 10;
        style.textContent = `@keyframes marquee{0%{transform:translateX(${start}px)}100%{transform:translateX(${end}px)}}`;
    }
    function checkOrientation() {
        if (!isPlaying) return;
        const portrait = window.innerHeight > window.innerWidth;
        if (portrait) {
            rotateBoxEl.style.transform = 'rotateZ(90deg)';
            modifyAnimation();
            if (textBoxEl.hasAttribute('xiaomaomi-roll')) textBoxEl.style.transform = `translateX(${window.innerWidth + Math.ceil((window.innerHeight - window.innerWidth) / 2) + 10}px)`;
        } else {
            rotateBoxEl.style.transform = '';
            resetAnimation();
            if (textBoxEl.hasAttribute('xiaomaomi-roll')) textBoxEl.style.transform = 'translateX(100vw)';
        }
    }
    function saveOriginal() {
        ['height', 'position', 'top', 'left', 'width', 'zIndex'].forEach(k => original['element' + k] = element.style[k]);
        original.fontSize = textBoxEl.style.fontSize;
        original.transform = textBoxEl.style.transform;
        original.rotate = rotateBoxEl.style.transform;
        ['position', 'top', 'width', 'overflow'].forEach(k => original['body' + k] = document.body.style[k]);
        original.animationDuration = textBoxEl.style.animationDuration;
        original.animationDirection = textBoxEl.style.animationDirection;
        original.animationPlayState = textBoxEl.style.animationPlayState;
    }
    function enterFallback() {
        if (fallbackActive) return;
        fallbackActive = true;
        savedScrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${savedScrollY}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
        element.style.position = 'fixed';
        element.style.top = '0';
        element.style.left = '0';
        element.style.width = '100vw';
        element.style.height = '100vh';
        element.style.zIndex = '99999';
        document.body.classList.add('iphone-playing');
    }
    function restoreFallback() {
        if (!fallbackActive) return;
        fallbackActive = false;
        document.body.classList.remove('iphone-playing');
        ['position', 'top', 'width', 'overflow'].forEach(k => document.body.style[k] = original['body' + k] || '');
        ['height', 'position', 'top', 'left', 'width', 'zIndex'].forEach(k => element.style[k] = original['element' + k] || '');
        window.scrollTo(0, savedScrollY);
    }
    async function requestWakeLock() {
        if (!isPlaying || wakeLock || wakeLockRequestPending || !('wakeLock' in navigator)) return;
        wakeLockRequestPending = true;
        try {
            const lock = await navigator.wakeLock.request('screen');
            if (isPlaying) {
                wakeLock = lock;
                lock.addEventListener('release', () => { if (wakeLock === lock) wakeLock = null; });
            } else {
                await lock.release();
            }
        } catch (e) { console.info('屏幕常亮不可用或被系统拒绝', e); }
        finally { wakeLockRequestPending = false; }
    }
    async function releaseWakeLock() {
        const lock = wakeLock;
        wakeLock = null;
        if (lock) { try { await lock.release(); } catch (e) { /* 可能已由系统释放 */ } }
    }
    function setPaused(value) {
        paused = Boolean(value);
        textBoxEl.style.animationPlayState = paused ? 'paused' : 'running';
        pauseButton.textContent = paused ? '继续' : '暂停';
    }
    function setSpeed(value) {
        const seconds = Number(value);
        if (Number.isFinite(seconds) && seconds >= 3 && seconds <= 30) textBoxEl.style.animationDuration = seconds + 's';
    }
    function setDirection() {
        textBoxEl.style.animationDirection = reversed ? 'reverse' : 'normal';
        reverseButton.textContent = reversed ? '正向' : '反向';
    }
    function showPanel() { panel.classList.remove('v3-controls-hidden'); controlsHidden = false; }
    function togglePanel() { controlsHidden = !controlsHidden; panel.classList.toggle('v3-controls-hidden', controlsHidden); }
    function resetFun() {
        rotateBoxEl.style.transform = original.rotate || '';
        textBoxEl.style.fontSize = original.fontSize || '';
        textBoxEl.style.transform = original.transform || '';
        textBoxEl.style.animationDuration = original.animationDuration || '';
        textBoxEl.style.animationDirection = original.animationDirection || '';
        textBoxEl.style.animationPlayState = original.animationPlayState || '';
        element.style.height = original.elementheight || '';
        isNativeFullscreen = false;
        reversed = false; paused = false; controlsHidden = false;
        panel.classList.remove('v3-controls-hidden'); panel.style.display = '';
        resetAnimation();
        if (textBoxEl.hasAttribute('xiaomaomi-roll')) textBoxEl.style.transform = 'translateX(100vw)';
        else textBoxEl.style.transform = 'translateX(0vw)';
    }
    async function stopPlay(exitNative = true) {
        if (!isPlaying) return;
        isPlaying = false;
        document.body.classList.remove('playing');
        await releaseWakeLock();
        if (exitNative && isNativeFullscreen) {
            const exit = document.exitFullscreen || document.webkitExitFullscreen;
            if (exit) { try { const result = exit.call(document); if (result && result.then) await result; } catch (e) { /* 忽略退出失败，仍恢复页面 */ } }
        }
        restoreFallback();
        resetFun();
    }
    async function startPlay() {
        if (isPlaying) return;
        isPlaying = true; saveOriginal(); document.body.classList.add('playing');
        const base = parseFloat(textBoxEl.style.fontSize) || 130;
        const ratio = document.documentElement.clientWidth / Math.max(element.clientHeight, 1);
        const scale = ratio > 5 ? ratio - 2.8 : ratio;
        textBoxEl.style.fontSize = Math.floor(base * Math.max(1, scale)) + 'px';
        element.style.height = '100vh'; void element.offsetWidth;
        const request = element.requestFullscreen || element.webkitRequestFullscreen;
        if (request && document.fullscreenEnabled !== false) {
            try { const result = request.call(element); if (result && result.then) await result; isNativeFullscreen = document.fullscreenElement === element || document.webkitFullscreenElement === element; }
            catch (e) { isNativeFullscreen = false; }
        }
        if (!isNativeFullscreen) enterFallback();
        checkOrientation(); void textBoxEl.offsetWidth;
        const duration = parseFloat(getComputedStyle(textBoxEl).animationDuration) || 10;
        speedInput.value = String(Math.max(3, Math.min(30, duration)));
        setPaused(false); reversed = false; setDirection(); showPanel(); await requestWakeLock();
    }
    runBtn.addEventListener('click', e => { e.preventDefault(); startPlay(); });
    panel.addEventListener('click', e => {
        const button = e.target.closest('button[data-action]');
        if (!button) return;
        e.stopPropagation();
        const action = button.dataset.action;
        if (action === 'pause') setPaused(!paused);
        else if (action === 'reverse') { reversed = !reversed; setDirection(); }
        else if (action === 'hide') togglePanel();
        else if (action === 'exit') stopPlay();
    });
    panel.addEventListener('pointerdown', e => e.stopPropagation());
    panel.addEventListener('touchend', e => e.stopPropagation(), { passive: true });
    speedInput.addEventListener('input', () => setSpeed(speedInput.value));
    element.addEventListener('click', e => {
        if (!isPlaying || e.target.closest('.v3-play-controls') || e.target.closest('.run-btn')) return;
        if (controlsHidden) showPanel();
    });
    // 双击退出仅在非控制区触发，避免滑块/按钮操作被误判；统一处理 touch 和鼠标。
    element.addEventListener('pointerup', e => {
        if (!isPlaying || e.pointerType === 'mouse' || e.target.closest('.v3-play-controls') || e.target.closest('.run-btn')) return;
        const now = Date.now();
        if (now - lastTapTime < 380) { lastTapTime = 0; stopPlay(); }
        else lastTapTime = now;
    });
    element.addEventListener('dblclick', e => {
        if (isPlaying && !e.target.closest('.v3-play-controls') && !e.target.closest('.run-btn')) stopPlay();
    });
    function handleFullscreenChange() {
        const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
        if (isPlaying && isNativeFullscreen && !fullscreenElement) stopPlay(false);
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    element.addEventListener('fullscreenerror', () => { if (isPlaying && !isNativeFullscreen) enterFallback(); });
    window.addEventListener('resize', () => {
        if (!isPlaying) return;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { if (isPlaying) { if (!isNativeFullscreen) element.style.height = '100vh'; checkOrientation(); } }, 120);
    });
    window.addEventListener('orientationchange', () => { if (isPlaying) setTimeout(checkOrientation, 250); });
    document.addEventListener('keydown', e => {
        if (!isPlaying) return;
        if (e.key === 'Escape') { stopPlay(); return; }
        if (e.code === 'Space' && !e.target.closest('input,button')) { e.preventDefault(); setPaused(!paused); }
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            if (e.target.closest('input')) return;
            const next = Number(speedInput.value) + (e.key === 'ArrowUp' ? -1 : 1);
            speedInput.value = String(Math.max(3, Math.min(30, next))); setSpeed(speedInput.value);
        }
    });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && isPlaying) requestWakeLock(); });
    resetAnimation(); textBoxEl.style.fontSize = '130px';
})();
