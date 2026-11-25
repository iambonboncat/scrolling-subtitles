/* 字幕文本控制：安全渲染、输入限制及轻量 DOM 更新 */
const textInputEl = document.querySelector('#text-input-box input');
const handleInTextTextBoxEl = document.querySelector('#main .text-box');
let isCanTrigger = true;
const MAX_TEXT_LENGTH = 10000;
if (textInputEl) textInputEl.maxLength = MAX_TEXT_LENGTH;

function hanldleRemoveEmpty(text) {
    // 保留空格与换行语义，避免文本被意外拼接。
    return String(text ?? '').slice(0, MAX_TEXT_LENGTH);
}

function handelText2Span(text) {
    if (!textInputEl || !handleInTextTextBoxEl) return;
    const normalized = hanldleRemoveEmpty(text);
    textInputEl.value = normalized;
    const fragment = document.createDocumentFragment();
    let index = 0;
    for (const character of normalized) {
        const span = document.createElement('span');
        span.style.setProperty('--i', index++);
        span.textContent = character;
        fragment.appendChild(span);
    }
    handleInTextTextBoxEl.replaceChildren(fragment);
}

if (textInputEl) {
    textInputEl.addEventListener('input', e => {
        if (isCanTrigger) handelText2Span(e.target.value);
    });
    textInputEl.addEventListener('compositionstart', () => { isCanTrigger = false; });
    textInputEl.addEventListener('compositionend', e => {
        isCanTrigger = true;
        handelText2Span(e.target.value);
    });
}
