// /public/utils/tooltip.js  (또는 빌드 경로 그대로)
// /utils/tooltip.js
// utils/tooltip.js
// utils/tooltip.js
function _installOnce(fn) {
  if (window.__termHelpInstalled) return;
  window.__termHelpInstalled = true;
  fn();
}

export function initTermHelp() {
  _installOnce(() => {
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
      tip.style.display = 'block';
      requestAnimationFrame(() => {
        const r = target.getBoundingClientRect();
        const gap = 8;
        const vw = window.innerWidth;
        const tw = tip.offsetWidth;
        const left = Math.min(vw - tw - 8, Math.max(8, r.left));
        const top  = (r.top + (window.scrollY || window.pageYOffset)) + r.height + gap;
        tip.style.left = left + 'px';
        tip.style.top  = top  + 'px';
      });
    };

    const getDesc = (group, term) => {
      const dict = (window.TERM_HELP && window.TERM_HELP[group]) || {};
      const key  = String(term || '').trim();
      return dict[key] || '설명이 아직 없습니다.';
    };

    // 보여주기(캡처 단계)
    document.addEventListener('click', (e) => {
      const t = e.target?.closest?.('.explainable');
      if (!t) return;
      const group = t.getAttribute('data-group') || 'unseong';
      const term  = t.getAttribute('data-term')  || t.textContent.trim();
      const from  = (group==='tengod') ? '십신' : (group==='sipsal12' ? '12신살' : '12운성');
      const title = `${from} · ${term}`;
      const body  = getDesc(group, term);
      showNear(t, `<div style="font-weight:600; margin-bottom:6px;">${title}</div>${body}`);
    }, true);

    // 숨기기(버블 단계, 다음 틱)
    document.addEventListener('click', (e) => {
      const insideTip = e.target?.closest?.('#term-help-pop');
      const onTerm    = e.target?.closest?.('.explainable');
      if (insideTip || onTerm) return;
      setTimeout(hide, 0);
    });

    window.addEventListener('resize', hide, { passive: true });
    window.addEventListener('scroll', hide, true);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });

    // 커서 힌트
    const style = document.createElement('style');
    style.textContent = `.explainable{cursor:help}`;
    document.head.appendChild(style);

    console.log('[tooltip] installed');
  });
}

// 👉 번들러 상황 대비: default도 내보내고, 전역 fallback도 깔아둠
export default { initTermHelp };
window.initTermHelp = initTermHelp;







//어떤 텍스트든 설명을 달고 싶으면 그 요소에 클래스/데이터 속성만 붙이면 끝:
//<span class="explainable" data-group="unseong" data-term="장생">장생</span>
//<span class="explainable" data-group="tengod"  data-term="정재">정재</span>
//<span class="explainable" data-group="sipsal12" data-term="월살">월살</span>