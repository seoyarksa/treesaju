// sinsalUtils.js

import { samhapGroups, UNSEONG_LIST, unseongMap12, sinsal_LIST, sinsalMap12,
         cheonEulMap, 
         
        
       } from './constants.js';




///////////기타 신살류 명칭 등록//////////////////
const etcSinsalList = ['형충회합', '천을귀인', '백호살', '원진살', '재고귀인','전지살','간여지동', '효신살', '소실살','육해살',
                      '도화살','홍염살', '귀문살', '격각살', '낙정관살',
                      '공망살',  '금여록', '천덕귀인', '월덕귀인', '괴강살','문창귀인', '학당귀인', '급각살', '상문살', '조객살','암록살','비인살',
                      '천의성', '음양차착살', '고란살', '태극귀인', '천라지망', '병부살', '사부살','현침살', '십악대패살', '단교관살'
                      ];


// saju: { dayGan, yearBranch, monthBranch, dayBranch, hourBranch }
// samhapKey: getSamhapKeyByJiji(saju.yearBranch) 등에서 추출

export function renderSinsalTable({ sajuGanArr, samhapKey, sajuJijiArr }) {
  const ganList = ['甲','乙','丙','丁','庚','辛','壬','癸'];
  const samhapNames = ['申子辰', '亥卯未', '寅午戌', '巳酉丑'];
  const jijiArr = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    const sajuGanjiArr = sajuGanArr.map((gan, idx) => gan + sajuJijiArr[idx]);

  // 1. 상단 헤더
  const headerRows = `
    <tr>
      <th colspan="8">12운성</th>
      <th colspan="4">12신살</th>
    </tr>
  <tr>
    ${ganList.map(gan =>
      `<td class="clickable${sajuGanArr.includes(gan) ? ' saju-blue' : ''}" data-type="unseong" data-gan="${gan}" style="cursor:pointer;">${gan}</td>`
    ).join('')}
    ${samhapNames.map(key =>
      `<td class="clickable${key === samhapKey ? ' saju-blue' : ''}" data-type="sinsal" data-samhap="${key}" style="cursor:pointer;">${key}</td>`
    ).join('')}
  </tr>
`;

  // 2. 아래쪽 12지지
const jijiRow = `<tr>
  <th>지지</th>
  ${jijiArr.map(jj =>
    `<td class="jiji-clickable${sajuJijiArr.includes(jj) ? ' saju-blue' : ''}" data-jiji="${jj}" style="cursor:pointer;">${jj}</td>`
  ).join('')}
</tr>`;

  // 운성/신살 행은 동적 갱신이므로, 클래스 없이 빈칸으로!
  const unseongRow = `<tr id="unseong-row"><th>12운성</th>${jijiArr.map(() => `<td></td>`).join('')}</tr>`;
  const sinsalRow = `<tr id="sinsal-row"><th>12신살</th>${jijiArr.map(() => `<td></td>`).join('')}</tr>`;

const guide = `
  <tr>
    <td colspan="13" style="font-size:13px; text-align:left; padding:5px;">
      아래 표는 해당 천간이나 삼합국을 클릭시 생성되는 12운성,12신살내용입니다[
      <span style="color:red;">戊,己는 제외</span>]
    </td>
  </tr>
`;


  const centerStyle = `
    <style>
      #sinsal-box table, #sinsal-box th, #sinsal-box td {
        text-align: center !important;
        vertical-align: middle !important;
      }
      .saju-blue {
        color: #1976d2 !important;
        font-weight: bold;
        text-shadow: 0 1px 0 #e6f3ff;
      }
    </style>
  `;

  return `
    ${centerStyle}
    <table border="1" style="border-collapse:collapse; margin:auto; font-size:15px;">
      <tbody>
        ${headerRows}
      </tbody>
    </table>
    <table border="1" style="border-collapse:collapse; margin:auto; font-size:14px; margin-top:8px;">
      <tbody>
        ${guide}
        ${jijiRow}
        ${unseongRow}
        ${sinsalRow}

        <tr id="mini-unseong-row" style="display:none;"><td colspan="13" style="padding:6px;"></td></tr>
    </tbody>
      </tbody>
    </table>
      <div id="etc-sinsal-table-wrap" style="margin-top:20px;">
    ${renderEtcSinsalTable({ sajuGanArr, sajuJijiArr, sajuGanjiArr })}
  </div>
  `;
}












// 12운성 매칭
export function getUnseong(gan, jiji) {
  // gan: 일간(甲,乙,丙,丁,庚,辛,壬,癸)
  // jiji: 대상 지지(子~亥)
  const jijiArr = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const idx = jijiArr.indexOf(jiji);
  if (unseongMap12[gan] && idx !== -1) {
    return unseongMap12[gan][idx];
  }
  return ''; // 없는 경우 빈값
}


// 12신살 매칭
export function getSinsal(samhapKey, jiji) {
  // samhapKey: '亥卯未', '寅午戌', '巳酉丑', '申子辰' 중 하나
  // jiji: 대상 지지(子~亥)
  const jijiArr = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const idx = jijiArr.indexOf(jiji);
  if (sinsalMap12[samhapKey] && idx !== -1) {
    return sinsalMap12[samhapKey][idx];
  }
  return '';
}

/// 삼합국으로 12신살 찾기
export function getSamhapKeyByJiji(jiji) {
  for (const group of samhapGroups) {
    if (group.includes(jiji)) {
      return group.join('');
    }
  }
  return '';
}

// 기타 신살류표
//////////////////////////////////////////////////////////////////////////////////////////////
//'형충회합', '천을귀인', '백호살', '원진살', '재고귀인','전지살','간여지동', '효신살', '소실살','육해살',
//     '도화살','홍염살', '귀문살', '격각살', '낙정관살',
 //       '공망살',  '금여록', '천덕귀인', '월덕귀인', '괴강살','문창귀인', '학당귀인', '급각살', '상문살', '조객살','암록살','비인살',
//     '천의성', '음양차착살', '고란살', '태극귀인', '천라지망', '병부살', '사부살','현침살', '십악대패살', '단교관살'
//////////////////////////////////////////////////////////////////////////////////////////////

export function renderEtcSinsalTable({ sajuGanArr, sajuJijiArr, sajuGanjiArr }) {
  // 기타 신살 항목(필요시 상단에서 import 또는 정의)
  // const etcSinsalList = ['천을귀인', '문창귀인', ...];

  // 신살별 행 생성
  const sinsalRows = etcSinsalList.map(sinsalName => {


////////1. 천간신살류 추출후 출력////////////////////////////////////////////////////////
const ganResults = sajuGanArr.map(gan => {
  const candidates = getSinsalForGan(gan, sinsalName) || [];
  // 후보군이 [{jiji, yinYang}] 형태면 -> 객체, 아니면 문자열
  const present = candidates.filter(obj =>
    typeof obj === "object"
      ? sajuJijiArr.includes(obj.jiji)
      : sajuJijiArr.includes(obj)
  );
  return present.length
    ? present.map(obj =>
        typeof obj === "object"
          ? obj.jiji + (obj.yinYang === '+' ? '(양)' : '(음)')
          : obj
      ).join(',')
    : 'X';
});


////////2 지지신살류 추출후 출력////////////////////////////////////////////////////////
const jijiResults = sajuJijiArr.map(jiji => {
  // 후보군 (신살이 여러 지지에 해당할 수도 있음)
  const candidates = getSinsalForJiji(jiji, sinsalName) || []; // 예: ['子']
  // 사주에 이 신살 후보군이 있으면 출력, 없으면 X
  const exists = candidates.some(j => sajuJijiArr.includes(j));
  return exists ? candidates.filter(j => sajuJijiArr.includes(j)).join(',') : 'X';
});


////////3. 간지신살류 추출후 출력////////////////////////////////////////////////////////
const ganjiResults = sajuGanjiArr.map(ganji => {
  const candidates = getSinsalForGanji(ganji, sinsalName) || []; // 예: ['경진']
  // 간지 신살은 완벽 일치하는 경우만 표시
  const exists = candidates.some(gj => sajuGanjiArr.includes(gj));
  return exists ? candidates.filter(gj => sajuGanjiArr.includes(gj)).join(',') : 'X';
});


    // **천간/지지/간지 모두 X일 때만 row 생략**
    const allX = [...ganResults, ...jijiResults, ...ganjiResults].every(v => !v || v === 'X');
    if (allX) return '';

    return `
      <tr>
        <td>${sinsalName}</td>
        ${ganResults.map(v => `<td>${v || 'X'}</td>`).join('')}
        ${jijiResults.map(v => `<td>${v || 'X'}</td>`).join('')}
        ${ganjiResults.map(v => `<td>${v || 'X'}</td>`).join('')}
      </tr>
    `;
  }).filter(Boolean).join('');

  // 노출 신살 없으면 안내 문구
  if (!sinsalRows) {
    return `<table style="margin:auto; margin-top:10px;"><tr><td>해당 기타 신살 없음</td></tr></table>`;
  }

  // 표 렌더링
return `
<table border="1" style="border-collapse:collapse; margin:auto; margin-top:16px; font-size:14px; min-width:600px;">
  <tr>
    <th style="background:#f7f7f7;" rowspan="2">신살류</th>
    <th colspan="4" style="background:#e7f5fe;">천간</th>
    <th colspan="4" style="background:#f7e7fe;">지지</th>
    <th colspan="4" style="background:#fef5e7;">간지(동주)</th>
  </tr>
<tr>
  <td>시</td>
  <td>일</td>
  <td>월</td>
  <td>년</td>
  <td>시</td>
  <td>일</td>
  <td>월</td>
  <td>년</td>
  <td>시주</td>
  <td>일주</td>
  <td>월주</td>
  <td>년주</td>
</tr>
  <tr>
    <td style="background:#f7f7f7;">기준간지</td>
    ${sajuGanArr.map((g, i) => {
      let style = '';
      if (i === 1) style = 'background:#fff59d;';     // 일
      if (i === 3) style = 'background:#90caf9;';     // 년
      return `<td style="${style}">${g}</td>`;
    }).join('')}
    ${sajuJijiArr.map((j, i) => {
      let style = '';
      if (i === 1) style = 'background:#fff59d;';
      if (i === 3) style = 'background:#90caf9;';
      return `<td style="${style}">${j}</td>`;
    }).join('')}
    ${sajuGanjiArr.map((gj, i) => {
      let style = '';
      if (i === 1) style = 'background:#fff59d;';
      if (i === 3) style = 'background:#90caf9;';
      return `<td style="${style}">${gj}</td>`;
    }).join('')}
  </tr>
${sinsalRows
  .split('</tr>')
  .filter(row => row.trim())
  .map(row => {
    let tdIdx = -1;
    return row.replace(/<td(\s*[^>]*)?>/g, (m, attrs) => {
      tdIdx++;
      let style = '';
      if ([2, 6, 10].includes(tdIdx)) style = 'background:#fff59d;';
      if ([4, 8, 12].includes(tdIdx)) style = 'background:#90caf9;';
      return `<td${attrs ? attrs : ''} style="${style}">`;
    }) + '</tr>';
  }).join('')
}

</table>

`;

}




/////천간기준 신살류///////////
//주의!!   신살은 모두 배열 [ ]로 넘겨줘야 함[천을귀인편 참고]///////////

export function getSinsalForGan(gan, sinsalName) {
  if (sinsalName === '천을귀인') {
    // 천을귀인 해당 지지 2개 반환 (없으면 빈배열)
    return cheonEulMap[gan] || [];
  }
  return [];
}



/////지지기준 신살류///////////
/////천간기준 신살류///////////
// 
// 
export function getSinsalForJiji(jiji, sinsalName) {


  return [];
}


/////간지기준 신살류///////////
export function getSinsalForGanji(ganji, sinsalName) {
  // 예시
  if (sinsalName === '천을귀인') {
    // ...
     return '';
  }
  return [];
}