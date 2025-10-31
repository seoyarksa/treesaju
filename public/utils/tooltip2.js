// /utils/tooltip.js
export function initTermHelp() {
  if (window.__termHelpInstalled) return;
  window.__termHelpInstalled = true;

  const tip = document.createElement('div');
  tip.id = 'term-help-pop';
  tip.style.cssText = [
    'position:fixed;z-index:999999;display:none;',
    'max-width:280px;padding:10px 12px;border-radius:10px;',
    'background:#111;color:#fff;font-size:13px;line-height:1.4;',
    'box-shadow:0 6px 18px rgba(0,0,0,.25)'
  ].join('');
  document.body.appendChild(tip);

  const TERM = window.TERM_HELP || {};
  const getDesc = (group, term) => {
    const dict = TERM[group] || {};
    const key = String(term || '').trim();
    return dict[key] || '설명이 아직 없습니다.';
  };

  const hide = () => { tip.style.display = 'none'; };
  const showNear = (target, html) => {
    tip.innerHTML = html;
    tip.style.display = 'block';
    const r = target.getBoundingClientRect();
    const gap = 8;
    // 먼저 표시해서 offsetWidth 확보
    const left = Math.min(window.innerWidth - tip.offsetWidth - 8, Math.max(8, r.left));
    const top  = (r.top + window.scrollY) + r.height + gap;
    tip.style.left = left + 'px';
    tip.style.top  = top  + 'px';
  };

  const CLICK_SELECTOR = '.explainable, .unseong-tag, .ten-god, .twelve-sinsal-tag';

  // ⬇️ 캡처 단계로 등록(세 번째 인수 또는 옵션 {capture:true})
  document.addEventListener('click', (e) => {
    const t = e.target.closest(CLICK_SELECTOR);
    if (!t) {
      if (!e.target.closest('#term-help-pop')) hide();
      return;
    }
    // 디버그 로그
    console.log('[tooltip] hit:', t, t.className, t.dataset);

    const group =
      t.getAttribute('data-group') ||
      (t.classList.contains('ten-god') ? 'tengod'
       : t.classList.contains('twelve-sinsal-tag') ? 'sipsal12'
       : 'unseong');

    const termRaw = t.getAttribute('data-term') || t.textContent || '';
    const term = String(termRaw).trim();

    // 빈값/장식문자 무시 (원하면 제거)
    if (!term || term === '-' ) { hide(); return; }

    const groupLabel = group === 'tengod' ? '십신' : (group === 'sipsal12' ? '12신살' : '12운성');
    const title = `<div style="font-weight:600;margin-bottom:6px;">${groupLabel} · ${term}</div>`;
    const body  = getDesc(group, term);
    showNear(t, title + body);
  }, true); // ⬅️ capture=true

  window.addEventListener('resize', hide, { passive: true });
  window.addEventListener('scroll', hide, true);

  console.log('[tooltip] initTermHelp installed. groups=', Object.keys(TERM));
}
