// utils/tooltip.js
export function initTermHelp() {
  if (window.__termHelpInstalled) return;
  window.__termHelpInstalled = true;

  // 1) 팁 DOM 준비
  let tip = document.getElementById('term-help-pop');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'term-help-pop';
    document.body.appendChild(tip);
  }
  Object.assign(tip.style, {
    position: 'fixed',
    zIndex: '2147483647',        // 최상단
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
    tip.style.display = 'block';
    // 먼저 보이게 -> width 계산
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

  // 2) 전역 위임 핸들러(캡처 단계, 키 이벤트 간섭 없음)
  document.addEventListener('click', (e) => {
    const t = e.target.closest('.explainable');
    if (!t) return;
    const group = t.getAttribute('data-group') || 'unseong';
    const term  = t.getAttribute('data-term')  || t.textContent.trim();
    const from  = (group==='tengod') ? '십신' : (group==='sipsal12' ? '12신살' : '12운성');
    const title = `${from} · ${term}`;
    const body  = getDesc(group, term);
    showNear(t, `<div style="font-weight:600; margin-bottom:6px;">${title}</div>${body}`);
  }, true); // capture=true

  // 3) 바깥 클릭/스크롤/리사이즈 → 숨김
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#term-help-pop') && !e.target.closest('.explainable')) hide();
  });
  window.addEventListener('resize', hide, { passive: true });
  window.addEventListener('scroll', hide, true);

  // 4) 포인터 힌트(선택)
  const style = document.createElement('style');
  style.textContent = `
    .explainable { cursor: help; }
  `;
  document.head.appendChild(style);

  console.log('[tooltip] installed');
}
