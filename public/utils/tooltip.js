// utils/tooltip.js
// utils/tooltip.js
export function initTermHelp() {
  if (window.__termHelpInstalled) return;
  window.__termHelpInstalled = true;

  const tip = document.createElement('div');
  tip.id = 'term-help-pop';
  tip.style.cssText = [
    'position:fixed; z-index:9999; display:none;',
    'max-width:280px; padding:10px 12px; border-radius:10px;',
    'background:#111; color:#fff; font-size:13px; line-height:1.4;',
    'box-shadow:0 6px 18px rgba(0,0,0,.25);'
  ].join('');
  document.body.appendChild(tip);

  const hosts = ['unseong-block', 'etc-sinsal-box']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  function hide(){ tip.style.display='none'; }
  function showNear(target, html){
    tip.innerHTML = html;
    tip.style.display = 'block';
    const r = target.getBoundingClientRect();
    const gap = 8;
    const left = Math.min(window.innerWidth - tip.offsetWidth - 8, Math.max(8, r.left));
    const top  = (r.top + window.scrollY) + r.height + gap;
    tip.style.left = left + 'px';
    tip.style.top  = top  + 'px';
  }
  function getDesc(group, term){
    const dict = (window.TERM_HELP && window.TERM_HELP[group]) || {};
    const key  = String(term || '').trim();
    return dict[key] || '설명이 아직 없습니다.';
  }

  hosts.forEach(host=>{
    host.addEventListener('click', e=>{
      const t = e.target.closest('.explainable');
      if (!t) return;
      const group = t.getAttribute('data-group') || 'unseong';
      const term  = t.getAttribute('data-term')  || t.textContent;
      const from  = (group==='tengod') ? '십신' : (group==='sipsal12' ? '12신살' : '12운성');
      const title = `${from} · ${term}`;
      const body  = getDesc(group, term);
      showNear(t, `<div style="font-weight:600; margin-bottom:6px;">${title}</div>${body}`);
    });
  });

  document.addEventListener('click', e=>{
    if (!e.target.closest('#term-help-pop') && !e.target.closest('.explainable')) hide();
  }, true);
  window.addEventListener('resize', hide);
  window.addEventListener('scroll', hide, true);
}





//어떤 텍스트든 설명을 달고 싶으면 그 요소에 클래스/데이터 속성만 붙이면 끝:
//<span class="explainable" data-group="unseong" data-term="장생">장생</span>
//<span class="explainable" data-group="tengod"  data-term="정재">정재</span>
//<span class="explainable" data-group="sipsal12" data-term="월살">월살</span>