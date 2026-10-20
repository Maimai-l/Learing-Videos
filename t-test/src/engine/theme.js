// Visual language of the whole video. Every colour has one meaning and keeps it.

export const W = 1920;
export const H = 1080;

export const FONT = {
  sans: '"Noto Sans SC", "Noto Sans CJK SC", "WenQuanYi Zen Hei", sans-serif',
  serif: '"Noto Serif SC", "Noto Serif CJK SC", serif',
};

export const C = {
  bg0: '#080B11',
  bg1: '#111722',
  text: '#E9ECF2', // primary text and formulas
  soft: '#B9C0CE', // secondary text
  dim: '#7D8699', // labels, tick numbers
  faint: '#3A4252', // grid, guides
  axis: '#9AA3B5',

  data: '#F1E6CF', // observed data points (warm white)
  mu: '#FF6E6E', // true mean μ (never observed)
  xbar: '#5CB6FF', // sample mean x̄
  err: '#FFB34D', // errors ε = x − μ
  dev: '#8FD4FF', // deviations x − x̄ (belong to x̄, lighter blue)
  sigma: '#C3A3FF', // σ, σ², variance as a quantity
  s: '#46D3B6', // the estimate s (teal)
  pos: '#5FD3A5', // positive product
  neg: '#FF7B8A', // negative product
  hi: '#FFE08A', // attention highlight
  ok: '#8BE28B',
  normal: '#9FB4D9', // standard normal curve
  t: '#FF9E5E', // t distribution
};

export const SIZE = {
  formula: 60,
  formulaSm: 46,
  label: 32,
  labelSm: 26,
  title: 70,
  sub: 40,
};
