
/**
 * 手机端全屏字幕控制
 * 支持：iPhone Safari、Android Chrome
 * iPhone 使用网页沉浸式显示作为全屏降级方案
 */

(function () {
    'use strict';

    const element = document.querySelector('.box');
    const runBtn = document.querySelector('.run-btn');
    const textBoxEl = document.querySelector('.text-box');
    const rotateBoxEl = document.querySelector('.rotate-box');

    if (!element || !runBtn || !textBoxEl || !rotateBoxEl) {
        console.error('字幕播放组件初始化失败');
        return;
    }

    let isPlaying = false;
    let isNativeFullscreen = false;
    let lastTapTime = 0;
    let savedScrollY = 0;

    const original = {};

    // 保存原始样式
    function saveOriginal() {
        original.elementHeight = element.style.height;
        original.elementPosition = element.style.position;
        original.elementTop = element.style.top;
        original.elementLeft = element.style.left;
        original.elementWidth = element.style.width;
        original.elementZIndex = element.style.zIndex;

        original.fontSize = textBoxEl.style.fontSize;
        original.transform = textBoxEl.style.transform;
        original.rotate = rotateBoxEl.style.transform;

        original.bodyPosition = document.body.style.position;
        original.bodyTop = document.body.style.top;
        original.bodyWidth = document.body.style.width;
        original.bodyOverflow = document.body.style.overflow;
    }

    // 动态创建兼容 Safari 的动画样式
    const animationStyle = document.createElement('style');
    document.head.appendChild(animationStyle);

    // 默认滚动动画
    function resetAnimation() {
        animationStyle.textContent = `
            @-webkit-keyframes marquee {
                0% {
                    -webkit-transform: translateX(100vw);
                }
                100% {
                    -webkit-transform: translateX(-100%);
                }
            }

            @keyframes marquee {
                0% {
                    transform: translateX(100vw);
                    background-position: 0 0;
                }
                100% {
                    transform: translateX(-100%);
                    background-position: -200% 0;
                }
            }
        `;
    }

    // 竖屏滚动动画
    function modifyAnimation() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        const offset = Math.ceil((height - width) / 2);

        const start = width + offset + 10;
        const end = -textBoxEl.offsetWidth - offset - 10;

        animationStyle.textContent = `
            @-webkit-keyframes marquee {
                0% {
                    -webkit-transform: translateX(${start}px);
                }
                100% {
                    -webkit-transform: translateX(${end}px);
                }
            }

            @keyframes marquee {
                0% {
                    transform: translateX(${start}px);
                    background-position: 0 0;
                }
                100% {
                    transform: translateX(${end}px);
                    background-position: -200% 0;
                }
            }
        `;
    }

    // 判断屏幕方向
    function checkOrientation() {
        if (!isPlaying) return;

        const isPortrait =
            window.innerHeight > window.innerWidth;

        if (isPortrait) {

            if (textBoxEl.hasAttribute('xiaomaomi-roll')) {
                const differenceValue =
                    window.innerWidth +
                    Math.ceil(
                        (window.innerHeight - window.innerWidth) / 2
                    ) + 10;

                textBoxEl.style.transform =
                    `translateX(${differenceValue}px)`;
            }

            rotateBoxEl.style.transform = 'rotateZ(90deg)';

            modifyAnimation();

        } else {

            rotateBoxEl.style.transform = '';

            resetAnimation();

            if (textBoxEl.hasAttribute('xiaomaomi-roll')) {
                textBoxEl.style.transform = 'translateX(100vw)';
            }
        }
    }

    // iPhone 网页沉浸式模式
    function enterMobileFullscreen() {

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

    // 恢复页面
    function restoreMobileFullscreen() {

        document.body.classList.remove('iphone-playing');

        document.body.style.position = original.bodyPosition;
        document.body.style.top = original.bodyTop;
        document.body.style.width = original.bodyWidth;
        document.body.style.overflow = original.bodyOverflow;

        element.style.position = original.elementPosition;
        element.style.top = original.elementTop;
        element.style.left = original.elementLeft;
        element.style.width = original.elementWidth;
        element.style.height = original.elementHeight;
        element.style.zIndex = original.elementZIndex;

        window.scrollTo(0, savedScrollY);
    }

    // 开始播放
    async function startPlay() {

        if (isPlaying) return;

        isPlaying = true;

        saveOriginal();

        // 计算字体放大比例
        const baseFontSize =
            parseFloat(textBoxEl.style.fontSize) || 130;

        const ratio =
            document.documentElement.clientWidth /
            Math.max(element.clientHeight, 1);

        const scale = ratio > 5 ? ratio - 2.8 : ratio;

        textBoxEl.style.fontSize =
            Math.floor(baseFontSize * Math.max(1, scale)) + 'px';

        element.style.height = '100vh';

        // 先更新布局
        void element.offsetWidth;

        // 优先尝试浏览器原生全屏
        const requestFullscreen =
            element.requestFullscreen ||
            element.webkitRequestFullscreen;

        if (
            requestFullscreen &&
            document.fullscreenEnabled !== false
        ) {
            try {

                const result = requestFullscreen.call(element);

                if (result && typeof result.then === 'function') {
                    await result;
                }

                isNativeFullscreen =
                    document.fullscreenElement === element ||
                    document.webkitFullscreenElement === element;

            } catch (error) {

                console.log('原生全屏不可用，切换沉浸模式', error);

                isNativeFullscreen = false;
            }
        }

        // 不支持原生全屏时使用手机兼容方案
        if (!isNativeFullscreen) {
            enterMobileFullscreen();
        }

        // 适配屏幕
        checkOrientation();

        // 重新计算动画
        void textBoxEl.offsetWidth;
    }

    // 退出播放
    async function stopPlay() {

        if (!isPlaying) return;

        isPlaying = false;

        if (isNativeFullscreen) {

            const exitFullscreen =
                document.exitFullscreen ||
                document.webkitExitFullscreen;

            if (exitFullscreen) {
                try {
                    const result = exitFullscreen.call(document);

                    if (result && typeof result.then === 'function') {
                        await result;
                    }
                } catch (error) {
                    console.log('退出全屏失败', error);
                }
            }
        }

        // 恢复页面
        if (!isNativeFullscreen) {
            restoreMobileFullscreen();
        }

        resetFun();
    }

    // 恢复字幕样式
    function resetFun() {

        rotateBoxEl.style.transform = original.rotate;

        textBoxEl.style.fontSize = original.fontSize;
        textBoxEl.style.transform = original.transform;

        element.style.height = original.elementHeight;

        isNativeFullscreen = false;

        resetAnimation();

        // 滚动字幕恢复初始位置
        if (textBoxEl.hasAttribute('xiaomaomi-roll')) {
            textBoxEl.style.transform = 'translateX(100vw)';
        } else {
            textBoxEl.style.transform = 'translateX(0vw)';
        }
    }

    // 播放按钮
    runBtn.addEventListener('click', function (event) {

        event.preventDefault();

        startPlay();

    });

    // 监听原生全屏退出
    function handleFullscreenChange() {

        const fullscreenElement =
            document.fullscreenElement ||
            document.webkitFullscreenElement;

        if (
            isPlaying &&
            isNativeFullscreen &&
            !fullscreenElement
        ) {

            restoreMobileFullscreen();
            resetFun();
            isPlaying = false;
        }
    }

    document.addEventListener(
        'fullscreenchange',
        handleFullscreenChange
    );

    document.addEventListener(
        'webkitfullscreenchange',
        handleFullscreenChange
    );

    // 全屏失败时不清空网页
    element.addEventListener('fullscreenerror', function () {
        console.log('浏览器全屏失败，使用兼容显示模式');

        if (isPlaying && !isNativeFullscreen) {
            enterMobileFullscreen();
        }
    });

    // 双击退出
    function handleDoubleTap() {

        const now = Date.now();

        if (now - lastTapTime < 350 && isPlaying) {
            stopPlay();
        }

        lastTapTime = now;
    }

    element.addEventListener(
        'touchend',
        handleDoubleTap,
        { passive: true }
    );

    element.addEventListener('dblclick', function () {
        stopPlay();
    });

    // 横竖屏变化
    window.addEventListener('resize', function () {

        if (isPlaying) {

            if (!isNativeFullscreen) {
                element.style.height = '100vh';
            }

            checkOrientation();
        }
    });

    window.addEventListener('orientationchange', function () {

        if (isPlaying) {
            setTimeout(checkOrientation, 300);
        }
    });

    // ESC 退出
    document.addEventListener('keydown', function (event) {

        if (event.key === 'Escape' && isPlaying) {
            stopPlay();
        }
    });

    // 初始化
    resetAnimation();

    textBoxEl.style.fontSize = '130px';

})();
