// utils/tooltip.js
// utils/tooltip.js
// 전역 설명 툴팁 설치기
// 사용처: import { initTermHelp } from './utils/tooltip.js';  initTermHelp();

export function initTermHelp() {
  if (window.__termHelpInstalled) return;
  window.__termHelpInstalled = true;

  // ─────────────────────────────────────────────────────
  // 1) 팁 DOM 준비
  // ─────────────────────────────────────────────────────
  let tip = document.getElementById('term-help-pop');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'term-help-pop';
    document.body.appendChild(tip);
  }
  Object.assign(tip.style, {
    position: 'fixed',
    zIndex: '2147483647', // 최상단
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

  // 포인터 힌트
  const style = document.createElement('style');
  style.textContent = `
    .explainable { cursor: help; }
    #term-help-pop a { color: #8ecbff; text-decoration: underline; }
  `;
  document.head.appendChild(style);

  // ─────────────────────────────────────────────────────
  // 2) 유틸
  // ─────────────────────────────────────────────────────
  const hide = () => {
    tip.style.display = 'none';
  };

  const showNear = (target, html) => {
    tip.innerHTML = html;
    tip.style.display = 'block'; // 먼저 보여야 offsetWidth 계산 가능

    const r = target.getBoundingClientRect();
    const gap = 8;

    // 기본 위치(타겟 아래)
    let left = r.left;
    let top  = r.top + window.scrollY + r.height + gap;

    // 오른쪽 경계 보정
    const maxLeft = window.innerWidth - tip.offsetWidth - 8;
    if (left > maxLeft) left = maxLeft;
    if (left < 8) left = 8;

    // 하단 경계 보정(화면 하단 넘치면 위쪽에 띄움)
    const bottom = top + tip.offsetHeight;
    const viewportBottom = window.scrollY + window.innerHeight - 8;
    if (bottom > viewportBottom) {
      top = r.top + window.scrollY - tip.offsetHeight - gap;
      if (top < window.scrollY + 8) top = window.scrollY + 8;
    }

    tip.style.left = `${left}px`;
    tip.style.top  = `${top}px`;
  };

  const getDesc = (group, term) => {
    const dict = (window.TERM_HELP && window.TERM_HELP[group]) || {};
    const key  = String(term || '').trim();
    return dict[key] || '설명이 아직 없습니다.';
  };

  // “방금 열림” 가드: 열자마자 닫히는 현상 방지
  let __tipLastShowTs = 0;

  // ─────────────────────────────────────────────────────
  // 3) 이벤트 바인딩 (전파 차단하지 않음)
  // ─────────────────────────────────────────────────────

  // A) 캡처 단계: explainable 클릭 시 열기 (전파 차단 X)
  document.addEventListener('click', (e) => {
    const t = e.target.closest('.explainable');
    if (!t) return;

    const group = t.getAttribute('data-group') || 'unseong';
    const term  = t.getAttribute('data-term')  || t.textContent.trim();
    const from  = (group === 'tengod') ? '십신' : (group === 'sipsal12' ? '12신살' : '12운성');
    const title = `${from} · ${term}`;
    const body  = getDesc(group, term);

    showNear(t, `<div style="font-weight:600; margin-bottom:6px;">${title}</div>${body}`);
    __tipLastShowTs = performance.now();
  }, true); // capture=true

  // B) 버블 단계: 바깥 클릭 시 닫기 (같은 틱 닫힘 방지)
  document.addEventListener('click', (e) => {
    // 방금 연 클릭이면 닫지 않음
    if (performance.now() - __tipLastShowTs < 120) return;

    // 팁 내부나 다른 explainable 재클릭이면 유지
    if (e.target.closest('#term-help-pop') || e.target.closest('.explainable')) return;

    hide();
  });

  // C) 화면 변경 시 닫기
  window.addEventListener('resize', hide, { passive: true });
  window.addEventListener('scroll', hide, true);

  // ESC로 닫기 (선택사항)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hide();
  }, { passive: true });

  // 전역 fallback(동적 import 없이도 접근 가능하게)
  window.initTermHelp = initTermHelp;

  // console.log('[tooltip] installed');
}

// 기본 export(호환)
export default { initTermHelp };
