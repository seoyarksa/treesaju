// utils/tooltip.js
// /public/utils/tooltip.js  (또는 빌드 경로 그대로)
export function initTermHelp() {
  if (window.__termHelpInstalled) return;
  window.__termHelpInstalled = true;

  // 팁 DOM 1개만 전역으로
  const tip = document.createElement('div');
  tip.id = 'term-help-pop';
  tip.style.cssText = [
    'position:fixed;z-index:99999;display:none;',
    'max-width:280px;padding:10px 12px;border-radius:10px;',
    'background:#111;color:#fff;font-size:13px;line-height:1.4;',
    'box-shadow:0 6px 18px rgba(0,0,0,.25)'
  ].join('');
  document.body.appendChild(tip);

  const TERM = window.TERM_HELP || {}; // explain.js에서 주입
  const getDesc = (group, term) => {
    const dict = TERM[group] || {};
    const key = String(term || '').trim();
    return dict[key] || '설명이 아직 없습니다.';
  };

  const hide = () => { tip.style.display = 'none'; };
  const showNear = (target, html) => {
    tip.innerHTML = html;
    tip.style.display = 'block';
    // 위치 계산
    const r = target.getBoundingClientRect();
    const gap = 8;
    const left = Math.min(
      window.innerWidth - tip.offsetWidth - 8,
      Math.max(8, r.left)
    );
    const top = (r.top + window.scrollY) + r.height + gap;
    tip.style.left = left + 'px';
    tip.style.top  = top  + 'px';
  };

  // ✅ 문서 전체 위임: .explainable, .unseong-tag, .ten-god, .twelve-sinsal-tag
  const CLICK_SELECTOR = '.explainable, .unseong-tag, .ten-god, .twelve-sinsal-tag';

  document.addEventListener('click', (e) => {
    const t = e.target.closest(CLICK_SELECTOR);
    if (!t) {
      // 툴팁 바깥 클릭 시 숨김
      if (!e.target.closest('#term-help-pop')) hide();
      return;
    }
    // 그룹/용어 추출
    const group =
      t.getAttribute('data-group') ||
      (t.classList.contains('ten-god') ? 'tengod'
       : t.classList.contains('twelve-sinsal-tag') ? 'sipsal12'
       : 'unseong');
    const term = t.getAttribute('data-term') || t.textContent.trim();
    const groupLabel = group === 'tengod' ? '십신' : (group === 'sipsal12' ? '12신살' : '12운성');

    const title = `<div style="font-weight:600;margin-bottom:6px;">${groupLabel} · ${term}</div>`;
    const body  = getDesc(group, term);
    showNear(t, title + body);
  });

  // 스크롤/리사이즈 시 숨김
  window.addEventListener('resize', hide, { passive: true });
  window.addEventListener('scroll', hide, true);

  // 진단 로그
  console.log('[tooltip] initTermHelp installed. TERM_HELP groups:', Object.keys(TERM));
}
