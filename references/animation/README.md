# 动画参考

从 3Blue1Brown 数学科普比赛（SoME）的获奖作品里挑出来的两份源码，只收我们没用过、值得借鉴的部分。
每个目录保留原项目的许可证（都是 MIT），文件内容未改动。

## explanaria

SoME2 获奖作品《Clear Crystal Conundrums》（用群论讲晶体，交互网页）。作者自己写的动画库，基于 three.js。

- 来源：<https://github.com/explanaria/explanaria.github.io>，提交 `8e3ec47`（2025-05-12）
- 作品：<https://explanaria.github.io/crystalgroups/>

值得看的：

- **把函数本身当成动画对象**（`src/js/Animation.js`）。从旧的 `expr` 过渡到新的 `expr`，每个点按编号错开起步
  （`staggerFraction`），整张网格依次流向新形状。表达式本身带时间参数 `t`（`src/js/Transformation.js`），
  和我们“画面只由 t 决定”的做法一致，可以照着写一个 `morph(f, g, p, i)`。
- **可以倒退的分步演示**（`src/js/Director.js`、`HistoryRecorder.js`）：记录每一步的起止值，按键前进后退。
- **屏幕空间的粗线**（`src/js/outputs/LineOutputShaders.js`）：三维里画等宽、带转角的线。
- **从数据文件生成晶体**（`docs/crystalgroups/src/threeD/parseCIF.js`）：读晶体学 CIF 文件，按对称操作展开成球棍模型；
  凯莱图用 SVG 箭头画（`twoD/`）。

## matrix-arcade

SoME3 荣誉提名《Matrix Arcade》（矩阵与线性变换，滚动驱动的交互网页）。SvelteKit、Threlte、Mathbox、GSAP。

- 来源：<https://github.com/yizhe-ang/matrix-explorable>，提交 `5517389`（2023-08-22）
- 作品：<https://yizhe-ang.github.io/matrix-explorable/>
- 许可证文本里的版权人写的是模板作者 The Pudding，原样保留

值得看的（主要在 `src/components/matrix/Arcade.svelte`）：

- **滚动条就是时钟**：每一段是一条 GSAP 时间轴，`scrollTrigger` 加 `scrub`，画面跟着滚动位置前进后退。
- **可以随意拖动的矩阵动画**：4×4 矩阵从单位阵逐个元素线性插值（`ease: "linear"`，约第 122 行），进度就是变换程度；
  矩阵挂在 Mathbox 的 `view.transform()` 上，所有网格、平面、点、向量一起变形。
- **剧本和自由操作之间的切换**用 `spring` 平滑过渡（约第 167 行）。
- **用坐标当颜色**的着色器（`src/shaders/`），**运动残影**（`Scene.svelte` 里的 `AfterimagePass`）。

## 看过但没有收的

| 作品 | 原因 |
|---|---|
| 3Blue1Brown 自己的视频代码 `3b1b/videos` | `_2024/holograms/diffraction.wgsl` 逐像素叠加点波源画干涉，很值得学；但许可证是 CC BY-NC-SA 4.0（非商业、相同方式共享），没有放进仓库，直接看原仓库 |
| How Computers Use Numbers（SoME3 获奖） | 源码公开但没有许可证 |
| The science of complexity（SoME4 教师奖） | 源码公开但没有许可证 |
| Cayley Graphs and Pretty Things | 没有许可证文件 |
| What Is The Most Complicated Lock Pattern?（SoME1 获奖） | manim 源码公开但没有许可证 |
| 其余视频类获奖作品 | 没有找到公开的动画源码 |
