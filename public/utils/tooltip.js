// utils/tooltip.js
// utils/tooltip.js
// 전역 설명 툴팁 설치기
// 사용처: import { initTermHelp } from './utils/tooltip.js';  initTermHelp();

// utils/tooltip.js
// 단일 전역 툴팁: .explainable[data-group][data-term] 클릭 시 설명 표시
// TERM_HELP는 window.TERM_HELP.unseong / .tengod / .sipsal12 형태

// utils/tooltip.js
export function initTermHelp() {
  if (window.__termHelpInstalled) {
    console.debug('[tooltip] already installed');
    return;
  }
  window.__termHelpInstalled = true;
  console.debug('[tooltip] initTermHelp() start');
  let __lastOpenAt = 0;

  // 1) 팁 DOM
  let tip = document.getElementById('term-help-pop');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'term-help-pop';
    document.body.appendChild(tip);
  }
  Object.assign(tip.style, {
    position: 'fixed',
    zIndex: '2147483647',
    display: 'none',
    maxWidth: '320px',
    padding: '10px 12px',
    borderRadius: '10px',
    background: '#111',
    color: '#fff',
    fontSize: '13px',
    lineHeight: '1.5',
    boxShadow: '0 6px 18px rgba(0,0,0,.25)',
    whiteSpace: 'pre-wrap',
    wordBreak: 'keep-all',
    pointerEvents: 'auto',
  });
  tip.setAttribute('data-installed', '1');

  // 포인터 힌트 + 강제 스타일 (!important)
  const style = document.createElement('style');
  style.setAttribute('data-tooltip-style', '1');
  style.textContent = `
    .explainable { cursor: help !important; }
    #term-help-pop {
      position: fixed !important;
      z-index: 2147483647 !important;
      display: none !important;
      max-width: 320px !important;
      padding: 10px 12px !important;
      border-radius: 10px !important;
      background: #111 !important;
      color: #fff !important;
      font-size: 13px !important;
      line-height: 1.5 !important;
      box-shadow: 0 6px 18px rgba(0,0,0,.25) !important;
      white-space: pre-wrap !important;
      word-break: keep-all !important;
      pointer-events: auto !important;
    }
  `;
  document.head.appendChild(style);

  // 도우미
  const hide = () => {
    tip.style.setProperty('display', 'none', 'important');
    console.debug('[tooltip] hide');
  };

  const showNear = (target, html) => {
    __lastOpenAt = Date.now();
    tip.innerHTML = html;
    tip.style.setProperty('display', 'block', 'important');
    tip.style.setProperty('opacity', '1', 'important');
    tip.style.setProperty('visibility', 'visible', 'important');

    const r = target.getBoundingClientRect();
    const gap = 8;
    let left = r.left;
    let top  = r.top + window.scrollY + r.height + gap;

    const maxLeft = window.innerWidth - tip.offsetWidth - 8;
    if (left > maxLeft) left = maxLeft;
    if (left < 8) left = 8;

    const bottom = top + tip.offsetHeight;
    const viewportBottom = window.scrollY + window.innerHeight - 8;
    if (bottom > viewportBottom) {
      top = r.top + window.scrollY - tip.offsetHeight - gap;
      if (top < window.scrollY + 8) top = window.scrollY + 8;
    }

    tip.style.left = `${left}px`;
    tip.style.top  = `${top}px`;

    console.debug('[tooltip] showNear', { left, top, termHtml: html });
    const rect = tip.getBoundingClientRect();
    console.debug('[tooltip] rect', rect, 'computed display=', getComputedStyle(tip).display);
  };

  const getDesc = (group, term) => {
    const dict = (window.TERM_HELP && window.TERM_HELP[group]) || {};
    const key  = String(term || '').trim();
    const desc = dict[key] || '설명이 아직 없습니다.';
    return desc;
  };

  // A) 캡처 단계: .explainable 클릭 → 열기
  document.addEventListener('click', (e) => {
    const t = e.target.closest?.('.explainable');
    if (!t) return;

    const group = t.getAttribute('data-group') || 'unseong';
    const term  = t.getAttribute('data-term')  || t.textContent.trim();
    const from  = (group === 'tengod') ? '십신' : (group === 'sipsal12' ? '12신살' : '12운성');

    const title = `${from} · ${term}`;
    const body  = getDesc(group, term);

    console.debug('[tooltip] HIT', { group, term, title });

    showNear(t, `<div style="font-weight:600; margin-bottom:6px;">${title}</div>${body}`);
  }, true); // capture = true

  // B) 버블 단계: 바깥 클릭 → 닫기 (열고 150ms 이내 닫기 무시)
  document.addEventListener('click', (e) => {
    if (Date.now() - __lastOpenAt < 150) return;
    if (!e.target.closest('#term-help-pop') && !e.target.closest('.explainable')) {
      hide();
    }
  });

  // C) 화면 변경 시 닫기
  window.addEventListener('resize', hide, { passive: true });
  window.addEventListener('scroll', hide, true);

  // ESC 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hide();
  }, { passive: true });

  // 전역 fallback
  window.initTermHelp = initTermHelp;

  console.debug('[tooltip] initTermHelp() installed');
}

export default { initTermHelp };
