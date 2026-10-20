// "检验一下": one small question at the end of a chapter.
//
// Each entry: { chapter: n, question, answer, explain }
//   chapter   chapter number 1–9; the checkpoint is 0.3 s after the chapter's last word
//   question  plain text; inline math in Unicode (σ²/n, √5, x̄, s², ν), no LaTeX
//   answer    short answer, shown after "看答案"
//   explain   the reasoning, shown under the answer
// A blank line ("\n\n") starts a new paragraph. The page font is subset from the
// characters in this file, so run `node tools/bundle.mjs` after editing it.
export const QUIZZES = [
  // PLACEHOLDER
  {
    chapter: 2,
    question: '五个数据的误差各自的方差都是 σ²，并且互相独立。它们的平均值，方差是多少？',
    answer: 'σ²/5，标准差是 σ/√5。',
    explain: '平均值是五个误差之和除以 5。独立的误差相加，方差也相加，得到 5σ²；除以 5 会让方差除以 25，所以是 5σ²/25 = σ²/5。',
  },
  // PLACEHOLDER
  {
    chapter: 4,
    question: '用 x̄ 代替 μ 来算距离平方和，为什么平均来说会偏小？',
    answer: '因为 x̄ 是让这组数据的平方和最小的那个点。',
    explain: '对同一组数据，换成任何别的中心，平方和都只会更大，μ 也不例外。所以用 x̄ 算出来的平方和不会超过用 μ 算的，平均下来少了一份 σ²。\n\n除以 n − 1 而不是 n，正好把这一份补回来。',
  },
];

export default QUIZZES;
