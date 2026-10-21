# 动画参考

3Blue1Brown 数学科普比赛（SoME）获奖作品和 3Blue1Brown 自己的代码里，我们没用过、值得借鉴的动画做法。
前三个的源码文件就在本目录，后四个看链接。

## explanaria

SoME2 获奖作品《Clear Crystal Conundrums》（用群论讲晶体，交互网页），作者自己写的动画库，基于 three.js。

- 源码：本目录 `explanaria/`，原仓库 <https://github.com/explanaria/explanaria.github.io>（MIT）
- 作品：<https://explanaria.github.io/crystalgroups/>

- **把函数本身当成动画对象**（`src/js/Animation.js`）：从旧的 `expr` 过渡到新的 `expr`，每个点按编号错开起步
  （`staggerFraction`），整张网格依次流向新形状。表达式本身带时间参数 `t`（`src/js/Transformation.js`），
  和我们“画面只由 t 决定”的做法一致，可以照着写一个 `morph(f, g, p, i)`。
- **可以倒退的分步演示**（`src/js/Director.js`、`HistoryRecorder.js`）：记录每一步的起止值，按键前进后退。
- **屏幕空间的粗线**（`src/js/outputs/LineOutputShaders.js`）：三维里画等宽、带转角的线。
- **从数据文件生成晶体**（`docs/crystalgroups/src/threeD/parseCIF.js`）：读晶体学 CIF 文件，按对称操作展开成球棍模型；
  凯莱图用 SVG 箭头画（`twoD/`）。

## matrix-arcade

SoME3 荣誉提名《Matrix Arcade》（矩阵与线性变换，滚动驱动的交互网页），SvelteKit、Threlte、Mathbox、GSAP。

- 源码：本目录 `matrix-arcade/`，原仓库 <https://github.com/yizhe-ang/matrix-explorable>（MIT）
- 作品：<https://yizhe-ang.github.io/matrix-explorable/>

主要在 `src/components/matrix/Arcade.svelte`：

- **滚动条就是时钟**：每一段是一条 GSAP 时间轴，`scrollTrigger` 加 `scrub`，画面跟着滚动位置前进后退。
- **可以随意拖动的矩阵动画**：4×4 矩阵从单位阵逐个元素线性插值（`ease: "linear"`，约第 122 行），进度就是变换程度；
  矩阵挂在 Mathbox 的 `view.transform()` 上，所有网格、平面、点、向量一起变形。
- **剧本和自由操作之间的切换**用 `spring` 平滑过渡（约第 167 行）。
- **用坐标当颜色**的着色器（`src/shaders/`），**运动残影**（`Scene.svelte` 里的 `AfterimagePass`）。

## 3b1b-diffraction

3Blue1Brown 讲全息图的视频（2024）里画光波干涉的代码。

- 源码：本目录 `3b1b-diffraction/`，原仓库 <https://github.com/3b1b/videos> 的 `_2024/holograms/`（CC BY-NC-SA 4.0）

- **逐像素算光场**（`diffraction.wgsl`，87 行）：片元着色器对每个像素把最多 32 个点波源叠加起来，
  相位由距离和时间决定，强度随距离衰减，可以显示瞬时值或强度。画面完全是“像素位置和 t 的函数”，
  相当于我们 `render(ctx, t)` 的 GPU 版本。干涉、衍射这类每个像素都要算的场，Canvas 2D 逐点算太慢，可以照这个思路改用 WebGL。
- 调用它的是 `diffraction.py` 里的 `LightWaveSlice`（第 41 行起）。

## How Computers Use Numbers

SoME3 获奖作品，讲计算机怎么表示数。

- 源码：<https://github.com/Mabi19/numbers>
- 作品：<https://mabi.land/numbers/>
- 看 `components/`：整数、定点数、浮点数的逐位演示组件（Lit），一位一位地翻给读者看。

## The science of complexity

SoME4 教师奖作品，讲简单的个体规则怎样产生整体行为。

- 源码：<https://github.com/MecanicaScience/website> 的 `app/(core)/articles/(2025)/science_of_complexity/`
- 作品：<https://www.explorablescience.com/articles/science_of_complexity>
- 看 `simulations/`：伊辛模型、萤火虫同步（Kuramoto 模型）、鱼群等模拟，Canvas 加 three.js。

## Cayley Graphs and Pretty Things

SoME3 荣誉提名，画有限群的凯莱图。

- 源码：<https://github.com/JuliaPoo/Cayley-Graph-Plotting>
- 作品：<https://juliapoo.github.io/mathematics/2023/07/15/plotting-cayley-graphs.html>
- 看 `ts/cayley.ts`：6000 多个有限群，用力导向布局在三维里排开。

## What Is The Most Complicated Lock Pattern?

SoME1 获奖视频，手机解锁图案最复杂能有多复杂。

- 源码：<https://github.com/zyeworld/youtube> 的 `2021/01_patterns/manim/`
- 视频：<https://youtu.be/PKjbBQ0PBCQ>
- 整支视频的 manim 场景，可以对照视频看一个完整作品的场景是怎么拆的。
