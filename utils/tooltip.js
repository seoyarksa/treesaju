// utils/tooltip.js
// utils/tooltip.js
export function initTermHelp() {
  if (window.__termHelpInstalled) return;
  window.__termHelpInstalled = true;

  const tip = document.createElement('div');
  tip.id = 'term-help-pop';
  tip.style.cssText = [
    'position:fixed; z-index:2147483647; display:none;',
    'max-width:320px; padding:10px 12px; border-radius:10px;',
    'background:#111; color:#fff; font-size:13px; line-height:1.45;',
    'box-shadow:0 6px 18px rgba(0,0,0,.25);',
    'pointer-events:auto;'
  ].join('');
  // DOM 준비 보장
  const mount = () => document.body ? document.body.appendChild(tip) : setTimeout(mount, 0);
  mount();

  function hide() { tip.style.display = 'none'; tip.__anchor = null; }
  const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));

  function showNear(target, html) {
    tip.innerHTML = html;
    tip.style.display = 'block';
    const r = target.getBoundingClientRect();
    const gap = 8;
    const vw = window.innerWidth, vh = window.innerHeight;

    // 먼저 보이게 한 뒤 크기 측정
    const tipW = tip.offsetWidth, tipH = tip.offsetHeight;

    let left = clamp(r.left, 8, vw - tipW - 8);
    let top  = r.bottom + gap;
    if (top + tipH + 8 > vh) top = r.top - tipH - gap;

    tip.style.left = Math.round(left) + 'px';
    tip.style.top  = Math.round(top + window.scrollY) + 'px';
    tip.__anchor = target;
  }

  function getDesc(group, term) {
    const dictAll = window.TERM_HELP || {};
    const dict = dictAll[group] || {};
    const key = String(term || '').trim();
    return dict[key] || '설명이 아직 없습니다.';
  }

  // 🔸 버블링 단계에서, passive 리스너로 등록 (키/포커스 간섭 최소화)
  document.addEventListener('click', (e) => {
    if (e.target.closest('#term-help-pop')) return;
    const t = e.target.closest('.explainable');
    if (!t) { hide(); return; }

    const group = t.getAttribute('data-group') || 'unseong';
    const term  = t.getAttribute('data-term')  || t.textContent;
    const from  = (group==='tengod') ? '십신' : (group==='sipsal12' ? '12신살' : '12운성');
    const title = `${from} · ${String(term).trim()}`;
    const body  = getDesc(group, term);

    showNear(t, `<div style="font-weight:600; margin-bottom:6px;">${title}</div>${body}`);
  }, { passive: true });

  window.addEventListener('resize', hide, { passive: true });
  window.addEventListener('scroll', hide, true); // 중첩 스크롤 대응

  // 전역 API(옵션)
  window.TermHelp = { showNear, hide, get isOpen(){ return tip.style.display==='block'; } };
}


//어떤 텍스트든 설명을 달고 싶으면 그 요소에 클래스/데이터 속성만 붙이면 끝:
//<span class="explainable" data-group="unseong" data-term="장생">장생</span>
//<span class="explainable" data-group="tengod"  data-term="정재">정재</span>
//<span class="explainable" data-group="sipsal12" data-term="월살">월살</span>