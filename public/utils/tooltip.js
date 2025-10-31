// utils/tooltip.js
// utils/tooltip.js
// 전역 설명 툴팁 설치기
// 사용처: import { initTermHelp } from './utils/tooltip.js';  initTermHelp();

// utils/tooltip.js
// 단일 전역 툴팁: .explainable[data-group][data-term] 클릭 시 설명 표시
// TERM_HELP는 window.TERM_HELP.unseong / .tengod / .sipsal12 형태

export function initTermHelp() {
  if (window.__termHelpInstalled) {
    console.debug('[tooltip] already installed');
    return;
  }
  window.__termHelpInstalled = true;
  console.debug('[tooltip] initTermHelp() start');

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

  // 포인터 힌트(CSS 충돌 최소화)
  const style = document.createElement('style');
  style.setAttribute('data-tooltip-style', '1');
  style.textContent = `
    .explainable { cursor: help !important; }
    #term-help-pop { will-change: transform; }
    #term-help-pop a { color: #8ecbff; text-decoration: underline; }
  `;
  document.head.appendChild(style);

  // 도우미
  const hide = () => {
    if (tip.style.display !== 'none') {
      tip.style.display = 'none';
      console.debug('[tooltip] hide');
    }
  };

  const showNear = (target, html) => {
    tip.innerHTML = html;
    tip.style.display = 'block'; // 먼저 보여야 크기 계산됨

    const r = target.getBoundingClientRect();
    const gap = 8;
    let left = r.left;
    let top  = r.top + window.scrollY + r.height + gap;

    // 우측/좌측 경계 보정
    const maxLeft = window.innerWidth - tip.offsetWidth - 8;
    if (left > maxLeft) left = maxLeft;
    if (left < 8) left = 8;

    // 하단 넘치면 위로
    const bottom = top + tip.offsetHeight;
    const viewportBottom = window.scrollY + window.innerHeight - 8;
    if (bottom > viewportBottom) {
      top = r.top + window.scrollY - tip.offsetHeight - gap;
      if (top < window.scrollY + 8) top = window.scrollY + 8;
    }

    tip.style.left = `${left}px`;
    tip.style.top  = `${top}px`;
    console.debug('[tooltip] showNear', { left, top, termHtml: html });
  };

  const getDesc = (group, term) => {
    const dict = (window.TERM_HELP && window.TERM_HELP[group]) || {};
    const key  = String(term || '').trim();
    const desc = dict[key] || '설명이 아직 없습니다.';
    return desc;
  };

  // 열자마자 닫힘 방지 가드
  let __tipLastShowTs = 0;

  // A) 캡처 단계: .explainable 클릭 → 열기 (stopPropagation 하지 않음)
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
    __tipLastShowTs = performance.now();
  }, true); // capture = true

  // B) 버블 단계: 바깥 클릭 → 닫기 (같은 틱 방지)
  document.addEventListener('click', (e) => {
    // 방금 연 클릭이면 닫지 않음
    if (performance.now() - __tipLastShowTs < 150) {
      // console.debug('[tooltip] skip hide (just opened)');
      return;
    }
    if (e.target.closest?.('#term-help-pop') || e.target.closest?.('.explainable')) {
      // 팝업 내부/다른 explainable 클릭이면 유지
      return;
    }
    hide();
  });

  // C) 화면 변경 시 닫기
  window.addEventListener('resize', hide, { passive: true });
  window.addEventListener('scroll', hide, true);

  // ESC 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hide();
  }, { passive: true });

  // 전역 접근성(동적 import Fallback)
  window.initTermHelp = initTermHelp;

  console.debug('[tooltip] initTermHelp() installed');
}

export default { initTermHelp };
