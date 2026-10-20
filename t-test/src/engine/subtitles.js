// Convert narration text written for TTS ("西格玛平方", "n 一减 1") back into the
// symbols shown on screen ("σ²", "n₁ − 1"). Rules are applied in order; each rule
// is a [pattern, replacement] pair. Keep longer, more specific patterns first.

const RULES = [
  // subscripted / compound expressions first
  [/x 一加 x 二减 2 倍的 x 三/g, 'x₁ + x₂ − 2x₃'],
  [/x 三/g, 'x₃'],
  [/n 一加 n 二减 2/g, 'n₁ + n₂ − 2'],
  [/n 一减 1/g, 'n₁ − 1'],
  [/n 二减 1/g, 'n₂ − 1'],
  [/s 一的平方除以 n 一/g, 's₁² 除以 n₁'],
  [/s 二的平方除以 n 二/g, 's₂² 除以 n₂'],
  [/艾普西隆一/g, 'ε₁'],
  [/艾普西隆二/g, 'ε₂'],
  [/艾普西隆/g, 'ε'],
  [/缪零/g, 'μ₀'],
  [/缪/g, 'μ'],
  [/(\d) 倍西格玛平方/g, '$1σ²'],
  [/西格玛平方/g, 'σ²'],
  [/西格玛/g, 'σ'],
  [/纽/g, 'ν'],
  [/s 平方/g, 's²'],
  [/n 平方(?!以后)/g, 'n²'], // "n 平方以后" means "after squaring n": keep the verb
  [/n 减 1/g, 'n − 1'],
  [/n 减 2/g, 'n − 2'],
  [/n 减 p/g, 'n − p'],
  [/正负 (\d)/g, '±$1'],
  [/负 (\d)/g, '−$1'],
];

// Insert a thin space between a CJK character and a Greek letter so that "记作μ"
// reads "记作 μ" like the rest of the narration's mixed text.
const CJK = '㐀-鿿';
const GREEK = 'μσνεΣ';

export function toDisplay(text) {
  let s = text;
  for (const [re, rep] of RULES) s = s.replace(re, rep);
  s = s.replace(new RegExp(`([${CJK}])([${GREEK}])`, 'g'), '$1 $2');
  s = s.replace(new RegExp(`([${GREEK}][²₀₁₂]?)([${CJK}])`, 'g'), '$1 $2');
  s = s.replace(new RegExp(`([${CJK}])([−±]\\d)`, 'g'), '$1 $2');
  s = s.replace(new RegExp(`([a-zA-Z][²₀₁₂])([${CJK}])`, 'g'), '$1 $2');
  return s;
}
