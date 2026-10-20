"""复算脚本中用到的全部数字。运行：python3 数值复算.py（需要 numpy、scipy）"""
import numpy as np
from scipy import stats

x = np.array([1.8, -0.2, 2.5, 0.3, 1.1])
n = len(x); m = x.mean(); s = x.std(ddof=1); se = s / np.sqrt(n); t = m / se
print("五批数据：均值", m, " s", round(s, 3), " s/√5", round(se, 3), " t", round(t, 2))
print("  双侧 p（正态）", round(2 * stats.norm.sf(t), 3), " 双侧 p（t, 自由度 4）", round(2 * stats.t.sf(t, 4), 3))

print("距离平方和 Σ(x−c)²：", {c: round(((x - c) ** 2).sum(), 2) for c in [0, 0.5, 1.1, 1.5, 2]})
terms = [(x[:k].sum() - k * x[k]) ** 2 / (k * (k + 1)) for k in range(1, n)]
print("逐个加点的 n−1 项：", [round(v, 2) for v in terms], " 和", round(sum(terms), 2))

print("双侧 5% 界限与仍用 1.96 的概率：")
for v in [1, 2, 3, 4, 5, 10, 30]:
    print(f"  ν={v:>2}  界限 {stats.t.ppf(0.975, v):.2f}   P(|t|>1.96)={2 * stats.t.sf(1.96, v):.3f}")

rng = np.random.default_rng(0)
d = rng.normal(0, 1, (1_000_000, 4))
print("n=4 模拟：P(|t|>1.96) =", round(np.mean(np.abs(d.mean(1) / (d.std(1, ddof=1) / 2)) > 1.96), 4),
      "  P(s<σ) =", round(np.mean(d.std(1, ddof=1) < 1), 3))
d2 = rng.normal(0, 1, (1_000_000, 2))
print("ν=1：P(s<σ) =", round(np.mean(d2.std(1, ddof=1) < 1), 3))
for k in [2, 5]:
    d = rng.normal(0, 1, (1_000_000, k))
    print(f"n={k}：除以 n 的估计平均 =", round(d.var(1, ddof=0).mean(), 3))
print("s²/σ² 的方差 2/ν：", {v: round(2 / v, 3) for v in [1, 3, 10, 30]})

def welch(v1, n1, v2, n2):
    a, b = v1 / n1, v2 / n2
    return (a + b) ** 2 / (a ** 2 / (n1 - 1) + b ** 2 / (n2 - 1))
print("Welch 自由度（n1=5,s1²=4,n2=12,s2²=1）：", round(welch(4, 5, 1, 12), 2))
