// /public/utils/tooltip.js  (또는 빌드 경로 그대로)
// /utils/tooltip.js
// utils/tooltip.js
// utils/tooltip.js
// utils/tooltip.js
export function initTermHelp(hostSelectors = ['#unseong-block', '#etc-sinsal-box']) {
  if (window.__termHelpInstalled) return;
  window.__termHelpInstalled = true;

  // 팁 DOM
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

  const hide = () => { tip.style.display = 'none'; };
  const showNear = (target, html) => {
    tip.innerHTML = html;
    tip.style.display = 'block';
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
  const render = (group, term) => {
    const from  = (group==='tengod') ? '십신' : (group==='sipsal12' ? '12신살' : '12운성');
    const title = `${from} · ${term}`;
    const body  = getDesc(group, term);
    return `<div style="font-weight:600; margin-bottom:6px;">${title}</div>${body}`;
  };

  // ✅ 전역(document) 말고, 우리 블록에만 위임 (버블 단계, passive)
  const hosts = hostSelectors
    .map(sel => document.querySelector(sel))
    .filter(Boolean);

  hosts.forEach(host => {
    host.addEventListener('click', (e) => {
      if (e.defaultPrevented) return;          // 다른 라이브러리가 선점했으면 패스
      const t = e.target.closest('.explainable');
      if (!t) return;
      const group = t.getAttribute('data-group') || 'unseong';
      const term  = t.getAttribute('data-term')  || t.textContent.trim();
      showNear(t, render(group, term));
    }, { capture: false, passive: true });
  });

  // 바깥 클릭/스크롤/리사이즈 → 닫기 (버블 단계)
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented) return;
    if (!e.target.closest('#term-help-pop') && !e.target.closest('.explainable')) hide();
  }, { capture: false, passive: true });
  window.addEventListener('resize', hide, { passive: true });
  window.addEventListener('scroll', hide, true);

  // 힌트 커서
  const style = document.createElement('style');
  style.textContent = `.explainable{cursor:help; text-decoration: underline dotted;}`;
  document.head.appendChild(style);

  console.log('[tooltip] installed (scoped)');
}







//어떤 텍스트든 설명을 달고 싶으면 그 요소에 클래스/데이터 속성만 붙이면 끝:
//<span class="explainable" data-group="unseong" data-term="장생">장생</span>
//<span class="explainable" data-group="tengod"  data-term="정재">정재</span>
//<span class="explainable" data-group="sipsal12" data-term="월살">월살</span>