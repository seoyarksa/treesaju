// utils.js


const jeolgiTable = {
  1: { month: 2, day: 4 },
  2: { month: 3, day: 6 },
  3: { month: 4, day: 5 },
  4: { month: 5, day: 6 },
  5: { month: 6, day: 6 },
  6: { month: 7, day: 7 },
  7: { month: 8, day: 7 },
  8: { month: 9, day: 7 },
  9: { month: 10, day: 8 },
  10: { month: 11, day: 7 },
  11: { month: 12, day: 7 },
  12: { month: 1, day: 6 }
};

export function getJeolipDate(year, month) {
  const jeolgi = jeolgiTable[month];
  const correctedYear = month === 12 ? year + 1 : year;
  return new Date(correctedYear, jeolgi.month - 1, jeolgi.day);
}

const yangStems = ['갑', '병', '무', '경', '임'];

export function isYangStem(stemKor) {
  return yangStems.includes(stemKor);
}




