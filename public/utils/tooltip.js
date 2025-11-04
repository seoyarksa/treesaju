// utils/tooltip.js
export function initTermHelp() {
  if (window.__termHelpInstalled) {
    console.debug('[tooltip] already installed');
    return;
  }
  window.__termHelpInstalled = true;
  console.debug('[tooltip] initTermHelp() start');

  // ─────────────────────────────────────────────────────────
  // 0) 상단 레이어 스타일(충돌 방지용) 주입: 중복 방지
  // ─────────────────────────────────────────────────────────
  if (!document.querySelector('style[data-tooltip-style="1"]')) {
    const style = document.createElement('style');
    style.setAttribute('data-tooltip-style', '1');
    style.textContent = `
      .explainable { cursor: help !important; }
      #term-help-pop {
        position: fixed !important;
        z-index: 2147483647 !important;
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
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
        transform: translateZ(0) !important;
        will-change: left, top, opacity, visibility !important;
      }
    `;
    document.head.appendChild(style);
  }

  // ─────────────────────────────────────────────────────────
  // 1) 팁 DOM 준비 (없으면 생성)
  // ─────────────────────────────────────────────────────────
  let tip = document.getElementById('term-help-pop');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'term-help-pop';
    tip.setAttribute('role', 'dialog');
    tip.setAttribute('aria-live', 'polite');
    tip.setAttribute('data-installed', '1');
    document.body.appendChild(tip);
  }
  // 인라인 스타일(우선순위 싸움 방지)
  Object.assign(tip.style, {
    position: 'fixed',
    zIndex: '2147483647',
    display: 'none',
    opacity: '0',
    visibility: 'hidden',
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
    transform: 'translateZ(0)',
    willChange: 'left, top, opacity, visibility',
  });

  // ─────────────────────────────────────────────────────────
  // 2) 헬퍼
  // ─────────────────────────────────────────────────────────
  let __lastOpenAt = 0;

  const forceShow = () => {
    tip.style.setProperty('display', 'block', 'important');
    tip.style.setProperty('opacity', '1', 'important');
    tip.style.setProperty('visibility', 'visible', 'important');
    tip.style.setProperty('z-index', '2147483647', 'important');
    tip.style.setProperty('pointer-events', 'auto', 'important');
    tip.style.setProperty('transform', 'translateZ(0)', 'important');
  };
  const forceHide = () => {
    tip.style.setProperty('display', 'none', 'important');
    tip.style.setProperty('opacity', '0', 'important');
    tip.style.setProperty('visibility', 'hidden', 'important');
  };

  const hide = () => {
    forceHide();
    console.debug('[tooltip] hide');
  };

const showNear = (target, html) => {
  __lastOpenAt = Date.now();
  tip.innerHTML = html;
  forceShow(); // display/opacity/visibility -> visible

  const r = target.getBoundingClientRect(); // 뷰포트 기준 좌표
  const gap = 8;

  // 기본 위치: 타깃 아래
  let left = r.left;
  let top  = r.bottom + gap;   // ❌ r.top + window.scrollY 사용 금지 (fixed 좌표 아님)

  // 우측 넘침 방지 (뷰포트 기준)
  const maxLeft = window.innerWidth - tip.offsetWidth - 8;
  if (left > maxLeft) left = maxLeft;
  if (left < 8) left = 8;

  // 하단 넘침 시 위로
  const bottom = top + tip.offsetHeight;
  const viewportBottom = window.innerHeight - 8; // ❌ scrollY 더하지 않음
  if (bottom > viewportBottom) {
    top = r.top - tip.offsetHeight - gap;
    if (top < 8) top = 8;
  }

  tip.style.left = `${left}px`;
  tip.style.top  = `${top}px`;
};


  const getDesc = (group, term) => {
    const dict = (window.TERM_HELP && window.TERM_HELP[group]) || {};
    const key  = String(term || '').trim();
    return dict[key] || '설명이 아직 없습니다.';
  };

  // ─────────────────────────────────────────────────────────
  // 3) 이벤트 바인딩
  // ─────────────────────────────────────────────────────────
  // A) 캡처 단계: .explainable 클릭 → 열기
  document.addEventListener('click', (e) => {
    const t = e.target.closest?.('.explainable');
    if (!t) return;

    // 다른 전역 click 닫힘 핸들러가 같은 이벤트로 즉시 숨기는 것 방지
    e.stopImmediatePropagation();
    e.stopPropagation();
    e.preventDefault();

    const group = t.getAttribute('data-group') || 'unseong';
    const term  = t.getAttribute('data-term')  || t.textContent.trim();
    let from;
switch (group) {
  case 'tengod':
    from = '십신';
    break;
  case 'sipsal12':
    from = '12신살';
    break;
  case 'terms':
    from = '용어설명';
    break;
    case 'gyeokook':
    from = '격국';
    break;
     case 'taegwa':
    from = '태과불급';
    break;
    case 'etcsinsal':
    from = '기타신살';
    break;
  default:
    from = '12운성';
}

    const title = `${from} · ${term}`;
    const body  = getDesc(group, term);

    console.debug('[tooltip] HIT', { group, term, title });
    showNear(t, `<div style="font-weight:600; margin-bottom:6px;">${title}</div>${body}`);
  }, true); // capture=true

  // B) 버블 단계: 바깥 클릭 → 닫기 (열고 300ms 이내는 무시)
  document.addEventListener('click', (e) => {
    if (Date.now() - __lastOpenAt < 300) return;
    if (!e.target.closest('#term-help-pop') && !e.target.closest('.explainable')) {
      hide();
    }
  });

  // C) 화면 변경 시 닫기
  window.addEventListener('resize', hide, { passive: true });
  window.addEventListener('scroll', hide, true);

  // D) ESC 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hide();
  }, { passive: true });

  // 전역 fallback
  window.initTermHelp = initTermHelp;
  console.debug('[tooltip] initTermHelp() installed');
}

export default { initTermHelp };
