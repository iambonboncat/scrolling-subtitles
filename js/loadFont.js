
/* iPhone Safari 优化版字体控制 */

const fontStyleBtnEls = document.querySelectorAll(
    '#font-module-box .small-module-box'
);

const fontEl = document.querySelector('#main .text-box');

// 自定义字体文件
let customFileEl = null;

// 字体文件路径
const fontFiles = {
    1: './font/1.ttf',
    2: './font/2.ttf',
    3: './font/3.ttf',
    4: './font/4.otf',
    5: './font/5.ttf',
    6: './font/6.ttf',
    7: './font/7.ttf',
    8: './font/8.ttf'
};

// 字体加载状态，避免重复下载
const fontCache = new Map();

// 当前选择的字体
let currentFontIndex = 0;

// 生成字体
async function loadFont(name, url) {

    // 已经加载过，直接使用
    if (fontCache.has(name)) {
        return fontCache.get(name);
    }

    const promise = (async () => {

        const fontFace = new FontFace(
            name,
            `url("${url}")`
        );

        await fontFace.load();

        document.fonts.add(fontFace);

        return fontFace;

    })();

    fontCache.set(name, promise);

    try {
        return await promise;
    } catch (error) {

        fontCache.delete(name);

        throw error;
    }
}


// 自定义字体加载
async function loadCustomFont(url, callBackFun) {

    try {

        const fontFace = new FontFace(
            'xiaomaomi-custom-font',
            `url("${url}")`
        );

        await fontFace.load();

        document.fonts.add(fontFace);

        fontEl.style.fontFamily = 'xiaomaomi-custom-font';

        callBackFun();

    } catch (error) {

        openAlert(
            `错误的字体文件！<br />
            点击右上角<span style='background-color: rgb(32, 190, 32);'>
            “自定义?”
            </span>，可获得帮助说明！`
        );
    }
}


// 取消所有选中状态
function cancelCheck() {

    fontStyleBtnEls.forEach(el => {
        el.classList.remove('check');
    });

}


// 系统字体
function useSystemFont(btn) {

    cancelCheck();

    btn.classList.add('check');

    fontEl.style.fontFamily = '';

    currentFontIndex = 0;
}


// 字体选择
fontStyleBtnEls.forEach((btn, index) => {

    btn.addEventListener('click', async () => {

        // 跟随系统
        if (index === 0) {

            useSystemFont(btn);

            return;
        }


        // 自定义字体
        if (index === fontStyleBtnEls.length - 1) {

            if (customFileEl === null) {

                customFileEl = btn.querySelector('input');

                customFileEl.addEventListener('change', async e => {

                    const file = e.target.files[0];

                    if (!file) return;

                    const objectUrl = URL.createObjectURL(file);

                    await loadCustomFont(objectUrl, () => {

                        cancelCheck();

                        btn.classList.add('check');

                        currentFontIndex = -1;

                    });

                    // 更换文件前释放上一个对象 URL
                    // 当前字体加载成功后不立即释放
                    if (fontEl.style.fontFamily !== 'xiaomaomi-custom-font') {
                        URL.revokeObjectURL(objectUrl);
                    }

                });
            }

            customFileEl.click();

            return;
        }


        // 第三方字体
        const fontName = 'xiaomaomi-font-' + index;

        const fontUrl = fontFiles[index];

        if (!fontUrl) return;

        try {

            // 加载对应字体
            await loadFont(fontName, fontUrl);

            // 加载完成后应用字体
            fontEl.style.fontFamily = fontName;

            cancelCheck();

            btn.classList.add('check');

            currentFontIndex = index;

        } catch (error) {

            openAlert(
                '字体加载失败，请检查网络连接或稍后重试。'
            );

        }

    });

});
