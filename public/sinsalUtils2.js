// sinsalUtils.js

import { samhapGroups, UNSEONG_LIST, unseongMap12, sinsal_LIST, sinsalMap12 } from './constants.js';


// saju: { dayGan, yearBranch, monthBranch, dayBranch, hourBranch }
// samhapKey: getSamhapKeyByJiji(saju.yearBranch) 등에서 추출

export function renderSinsalTable({ sajuGanArr, samhapKey, sajuJijiArr }) {
  const ganList = ['甲','乙','丙','丁','庚','辛','壬','癸'];
  const samhapNames = ['申子辰', '亥卯未', '寅午戌', '巳酉丑'];
  const jijiArr = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

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

// 더미 운성/신살 반환(실제 로직으로 대체)




