// /public/utils/tooltip.js  (또는 빌드 경로 그대로)
// /utils/tooltip.js
// utils/tooltip.js
export function initTermHelp() {
  if (window.__termHelpInstalled) return;
  window.__termHelpInstalled = true;

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
  });

  const hide = () => { tip.style.display = 'none'; };
  const showNear = (target, html) => {
    tip.innerHTML = html;
    tip.style.display = 'block'; // 먼저 보여서 width 계산
    const r = target.getBoundingClientRect();
    const gap = 8;
    const left = Math.min(window.innerWidth - tip.offsetWidth - 8, Math.max(8, r.left));
    const top  = (r.top + window.scrollY) + r.height + gap;
    tip.style.left = left + 'px';
    tip.style.top  = top  + 'px';
  };

  const getDesc = (group, term) => {
    const dict = (window.TERM_HELP && window.TERM_HELP[group]) || {};
    const key  = String(term || '').trim();
    return dict[key] || '설명이 아직 없습니다.';
  };

  // === 이벤트 ===
  // ✅ show: 리렌더/버블에 영향 안 받도록 pointerdown + capture
  document.addEventListener('pointerdown', (e) => {
    const t = e.target.closest?.('.explainable');
    if (!t) return;
    const group = t.getAttribute('data-group') || 'unseong';
    const term  = t.getAttribute('data-term')  || t.textContent.trim();
    const from  = (group==='tengod') ? '십신' : (group==='sipsal12' ? '12신살' : '12운성');
    const title = `${from} · ${term}`;
    const body  = getDesc(group, term);
    showNear(t, `<div style="font-weight:600; margin-bottom:6px;">${title}</div>${body}`);
  }, true);

  // ✅ hide: 정말 바깥을 누른 경우만 (composedPath로 안정 판별)
  document.addEventListener('pointerdown', (e) => {
    const path = e.composedPath ? e.composedPath() : [];
    const isInside = path.some(el =>
      el && (el.id === 'term-help-pop' || (el.classList && el.classList.contains('explainable')))
    );
    if (!isInside) hide();
  }, false);

  // 스크롤/리사이즈 시 숨김
  window.addEventListener('resize', hide, { passive: true });
  window.addEventListener('scroll', hide, true);

  // 포인터 힌트
  const style = document.createElement('style');
  style.textContent = `.explainable{cursor:help;}`;
  document.head.appendChild(style);

  console.log('[tooltip] installed');
}






//어떤 텍스트든 설명을 달고 싶으면 그 요소에 클래스/데이터 속성만 붙이면 끝:
//<span class="explainable" data-group="unseong" data-term="장생">장생</span>
//<span class="explainable" data-group="tengod"  data-term="정재">정재</span>
//<span class="explainable" data-group="sipsal12" data-term="월살">월살</span>