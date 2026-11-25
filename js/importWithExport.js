/* 下载和上传 */
const uploadBtnEl = document.querySelector('#upload-btn');
const uploadInputEl = uploadBtnEl.previousElementSibling;
const dpwnloadBtnEl = document.querySelector('#download-btn');

//下载
function getCurrentConfig() {
    let wbnr = textInputEl.value;
    let fontIndex = 0;
    const els = document.querySelectorAll('#font-module-box .small-module-box');
    els.forEach((el, index) => {
        if (el.classList.contains("check")) {
            if (els.length - 1 === index) {
                fontIndex = 0;
                return;
            }
            fontIndex = index;
        }
    });
    let moudleIndex = 0;
    const els1 = document.querySelectorAll('#font-mode-box .small-module-box');
    els1.forEach((el, index) => {
        if (el.classList.contains("check")) {
            moudleIndex = index;
        }
    });
    const els2 = document.querySelectorAll('#custom-module-box .switch-box');
    let rollStatus = true;
    let surroundStatus = true;
    if (els2[0].classList.contains("off")) {
        rollStatus = false;
    }
    if (els2[1].classList.contains("off")) {
        surroundStatus = false;
    }
    let rollTime = 10;
    let surroundTime = 5;
    let fontSize = 130;
    let valueArr = [];
    const els3 = document.querySelectorAll('#custom-module-box .number-input-box');
    els3.forEach(el => {
        valueArr.push(parseInt(el.firstElementChild.nextElementSibling.textContent));
    });
    [rollTime, surroundTime, fontSize] = valueArr;
    let fontColor = '#ffffff';
    let glowColor = '#fd2dbf';
    let bgColor = '#000000';
    let surroundExt = [
        "#ff0659", "#45f3ff"
    ];
    let valueArr1 = [];
    let valueArr2 = [];
    const els4 = document.querySelectorAll('#custom-module-box .color-input-box');
    els4.forEach((el, index) => {
        let v = el.firstElementChild.nextElementSibling.value;
        if (index < 3) {
            valueArr1.push(v);
            return;
        }
        valueArr2.push(v);
    });
    [fontColor, glowColor, bgColor] = valueArr1;
    surroundExt = valueArr2;
    const els5 = document.querySelectorAll('#font-bold-box .small-module-box');
    let fontBlodIndex = 3;
    els5.forEach((el, index) => {
        if (el.classList.contains("check")) {
            fontBlodIndex = index;
        }
    });
    const obj = {
        wbnr,
        fontIndex,
        moudleIndex,
        rollStatus,
        surroundStatus,
        rollTime,
        surroundTime,
        fontSize,
        fontColor,
        glowColor,
        bgColor,
        fontBlodIndex,
        surroundExt
    };
    obj.sign = xiaomaomiSign.call(l, obj);
    return obj;
}

function downloadFun() {
    const obj = getCurrentConfig();
    downloadFile(URL.createObjectURL(new Blob([xiaomaomiEncode(obj)], { type: 'text/plain' })), "在线手持弹幕样式保存文件");
}

dpwnloadBtnEl.addEventListener('click', () => {
    downloadFun();
});


uploadBtnEl.addEventListener('click', () => {
    uploadInputEl.click();
});
uploadInputEl.addEventListener("change", e => {
    const file = e.target.files[0];
    // 限制导入文件大小，避免异常大文件占用内存
    if (file && file.size > 2 * 1024 * 1024) {
        openAlert('文件过大，请选择小于 2MB 的配置文件。');
        uploadInputEl.value = '';
        return;
    }
    if (file === undefined || file === null) {
        return;
    }
    const fileReader = new FileReader();
    fileReader.onload = e => {
        let result;
        try { result = checkSign(e.target.result); }
        catch (err) { openAlert('配置文件解析失败，请检查文件格式。'); return; }
        if (!result.status) {
            openAlert("文件验签解析失败，请上传本系统下载的文件或则不要自行篡改本系统下载的文件，如果不明白可以点击右上角<span style='background-color: rgb(32, 190, 32);'>上传?”</span>、<span style='background-color: rgb(32, 190, 32);'>“下载?”</span>获取帮助说明！");
            return;
        }
        let safeConfig;
        try { safeConfig = normalizeImportedConfig(result.value); }
        catch (err) { openAlert("配置内容无效，无法导入。"); uploadInputEl.value = ''; return; }
        openLoading("文件解析，样式加载中...");
        handleImportEvent(safeConfig);
        uploadInputEl.value = ''; 
    }
    fileReader.readAsText(file);
});

//处理导出函数
function handleImportEvent(obj) {
    //文本
    handelText2Span(obj.wbnr);
    //字体
    fontStyleBtnEls[obj.fontIndex].click();
    //模式--可以最后触发
    fontModeBtnEls[obj.moudleIndex].click();
    //滚动
    if (obj.rollStatus === switchBoxEls[0].classList.contains("off")) {
        switchBoxEls[0].click();
    }
    //环绕
    if (obj.surroundStatus === switchBoxEls[1].classList.contains("off")) {
        switchBoxEls[1].click();
    }
    //滚动时间、环绕时间、字体大小
    elArrSynchronizeStyles(0, numberInputBoxElsCssText, numberInputBoxEls, "textContent", obj.rollTime);
    elArrSynchronizeStyles(1, numberInputBoxElsCssText, numberInputBoxEls, "textContent", obj.surroundTime);
    elArrSynchronizeStyles(2, numberInputBoxElsCssText, numberInputBoxEls, "textContent", obj.fontSize);
    //字体颜色、发光颜色、背景颜色
    elArrSynchronizeStyles(0, colorInputBoxEvents, colorInputBoxEls, "value", obj.fontColor, true, "backgroundColor");
    elArrSynchronizeStyles(1, colorInputBoxEvents, colorInputBoxEls, "value", obj.glowColor, true, "backgroundColor");
    elArrSynchronizeStyles(2, colorInputBoxEvents, colorInputBoxEls, "value", obj.bgColor, true, "backgroundColor");
    //字体粗细
    fontBoldBoxEls[obj.fontBlodIndex].click();
    //环绕颜色
    specialTreatmentSurround(obj.surroundExt)
}

//对于调用样式的方法需要更改本身样式(下标、样式数组，组件数组、key、值、是否有第一个值、第一个值的key)
function elArrSynchronizeStyles(index, styleArr, elArr, key, value, haveFirst = false, firstKey = "") {
    styleArr[index](value);
    if (haveFirst) {
        elArr[index].firstElementChild.style[firstKey] = value;
    }
    elArr[index].firstElementChild.nextElementSibling[key] = value;
}

// 环绕颜色导入：使用实时 DOM 查询，确保动态颜色节点也能正确清理。
function specialTreatmentSurround(surroundExt) {
    const colors = Array.isArray(surroundExt) ? surroundExt.slice(0, 7) : [];
    while (colors.length < 2) colors.push(colors.length === 0 ? '#ff0659' : '#45f3ff');
    document.querySelectorAll('#surround-color-box .color-input-box').forEach((el, index) => {
        if (index >= 2) el.remove();
    });
    currentSurroundCount = 2;
    surroundBoxBackGroundTextSplitArr = [
        { a: 0, b: 10, c: 25, value: '#ff0659' },
        { a: 25, b: 35, c: 50, value: '#45f3ff' }
    ];
    // 添加额外颜色，使用现有控件逻辑注册事件与删除按钮。
    for (let i = 2; i < colors.length; i++) surroundColorBtnEl.click();
    const colorEls = document.querySelectorAll('#surround-color-box .color-input-box');
    colorEls.forEach((el, index) => {
        const input = el.querySelector('input[type="color"]');
        const swatch = el.querySelector('.color-box');
        const color = colors[index];
        if (!input || !/^#[0-9a-fA-F]{6}$/.test(color)) return;
        input.value = color;
        input.defaultValue = color;
        if (swatch) swatch.style.backgroundColor = color;
        fixSurroundBoxBackGroundText('xiaomaomi', color, index);
    });
    currentSurroundCount = colorEls.length;
    surroundColorBtnEl.classList.toggle('disble', currentSurroundCount >= 7);
    closeLoading();
}

// 对导入配置做范围校验与归一化，避免损坏数据影响 UI 或产生异常样式。
function normalizeImportedConfig(value) {
    if (!value || typeof value !== 'object') throw new Error('配置数据无效');
    const clamp = (n, min, max, fallback) => Number.isFinite(Number(n)) ? Math.max(min, Math.min(max, Number(n))) : fallback;
    const color = (v, fallback) => /^#[0-9a-fA-F]{6}$/.test(String(v)) ? String(v) : fallback;
    const text = String(value.wbnr ?? '').slice(0, 10000);
    const fontCount = fontStyleBtnEls.length;
    const modeCount = fontModeBtnEls.length;
    const weightCount = fontBoldBoxEls.length;
    const surround = Array.isArray(value.surroundExt) ? value.surroundExt.slice(0, 7).map(v => color(v, '#ff0659')) : ['#ff0659', '#45f3ff'];
    while (surround.length < 2) surround.push(surround.length === 0 ? '#ff0659' : '#45f3ff');
    return {
        ...value,
        wbnr: text,
        fontIndex: Math.round(clamp(value.fontIndex, 0, Math.max(fontCount - 1, 0), 0)),
        moudleIndex: Math.round(clamp(value.moudleIndex, 0, Math.max(modeCount - 1, 0), 0)),
        fontBlodIndex: Math.round(clamp(value.fontBlodIndex, 0, Math.max(weightCount - 1, 0), 3)),
        rollStatus: Boolean(value.rollStatus),
        surroundStatus: Boolean(value.surroundStatus),
        rollTime: Math.round(clamp(value.rollTime, 1, 120, 10)),
        surroundTime: Math.round(clamp(value.surroundTime, 1, 120, 5)),
        fontSize: Math.round(clamp(value.fontSize, 13, 1000, 130)),
        fontColor: color(value.fontColor, '#ffffff'),
        glowColor: color(value.glowColor, '#fd2dbf'),
        bgColor: color(value.bgColor, '#000000'),
        surroundExt: surround
    };
}

/* 自动保存配置：本机浏览器保存，不上传服务器 */
const AUTO_SAVE_KEY = 'scrolling-subtitles-autosave-v1';
let autoSaveTimer;
function saveDraftConfig() {
    try {
        const config = getCurrentConfig();
        localStorage.setItem(AUTO_SAVE_KEY, xiaomaomiEncode(config));
    } catch (err) { /* 浏览器禁用存储时静默降级 */ }
}
function scheduleDraftSave() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(saveDraftConfig, 400);
}
['input', 'change', 'click'].forEach(type => {
    document.addEventListener(type, event => {
        if (event.target.closest('#main, #custom-module-box, #font-module-box, #font-mode-box, #font-bold-box')) scheduleDraftSave();
    }, true);
});
window.addEventListener('DOMContentLoaded', () => {
    try {
        const saved = localStorage.getItem(AUTO_SAVE_KEY);
        if (saved) {
            const result = checkSign(saved);
            if (result && result.status && result.value) handleImportEvent(normalizeImportedConfig(result.value));
        }
    } catch (err) { /* 自动恢复失败不阻碍网页启动 */ }
});
