/* 字幕文本控制：使用 DOM/textContent 渲染，避免 HTML 注入 */
const textInputEl = document.querySelector('#text-input-box input');
const handleInTextTextBoxEl = document.querySelector('#main .text-box');
let isCanTrigger = true;

function hanldleRemoveEmpty(text) {
    // 原项目会删除所有空格；此处保留空格，避免句子粘连
    return String(text ?? '');
}

function handelText2Span(text) {
    const normalized = hanldleRemoveEmpty(text);
    textInputEl.value = normalized;
    const fragment = document.createDocumentFragment();
    Array.from(normalized).forEach((character, index) => {
        const span = document.createElement('span');
        span.style.setProperty('--i', index);
        span.textContent = character;
        fragment.appendChild(span);
    });
    handleInTextTextBoxEl.replaceChildren(fragment);
}

textInputEl.addEventListener('input', e => {
    if (isCanTrigger) handelText2Span(e.target.value);
});
textInputEl.addEventListener('compositionstart', () => { isCanTrigger = false; });
textInputEl.addEventListener('compositionend', e => {
    isCanTrigger = true;
    handelText2Span(e.target.value);
});
