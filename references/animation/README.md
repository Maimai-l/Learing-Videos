# 动画参考

从 3Blue1Brown 数学科普比赛（SoME）的获奖作品和 3Blue1Brown 自己的代码里挑出来的源码，只收我们没用过、值得借鉴的部分。
每个目录保留原项目的许可证，文件内容未改动。没有许可证的作品不能复制，在最后一节给出链接和该看的文件。

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

## 3b1b-diffraction

3Blue1Brown 讲全息图的视频（2024）里画光波干涉的代码。不是 SoME 作品。

- 来源：<https://github.com/3b1b/videos>，提交 `306a134`（2026-09-29），目录 `_2024/holograms/`
- 作者：Grant Sanderson（3Blue1Brown）
- 许可证：CC BY-NC-SA 4.0（`LICENSE.txt`）。只能非商业使用，转用时注明出处，改编的部分也要用同样的许可证。

值得看的：

- **逐像素算光场**（`diffraction.wgsl`，87 行）：片元着色器对每个像素把最多 32 个点波源叠加起来，
  相位由距离和时间决定，强度随距离衰减，可以显示瞬时值或强度。时间是传进来的参数，
  画面完全是“像素位置和 t 的函数”，相当于我们 `render(ctx, t)` 的 GPU 版本。
  干涉、衍射这类每个像素都要算的场，用 Canvas 2D 逐点算太慢，可以照这个思路改用 WebGL。
- 调用它的是 `diffraction.py` 里的 `LightWaveSlice`（第 41 行起）。

## 没有许可证的（只能看，不能复制）

这些源码公开但没有写许可证，默认保留所有权利，所以没有放进仓库。

| 作品 | 源码 | 该看的 |
|---|---|---|
| How Computers Use Numbers（SoME3 获奖） | <https://github.com/Mabi19/numbers> | `components/`：整数、定点数、浮点数的逐位演示组件（Lit） |
| The science of complexity（SoME4 教师奖） | <https://github.com/MecanicaScience/website> | `app/(core)/articles/(2025)/science_of_complexity/simulations/`：伊辛模型、萤火虫同步（Kuramoto）、鱼群等模拟 |
| Cayley Graphs and Pretty Things（SoME3 荣誉提名） | <https://github.com/JuliaPoo/Cayley-Graph-Plotting> | `ts/cayley.ts`：6000 多个有限群的凯莱图，力导向布局 |
| What Is The Most Complicated Lock Pattern?（SoME1 获奖） | <https://github.com/zyeworld/youtube> | `2021/01_patterns/manim/`：整支视频的 manim 场景 |

其余视频类获奖作品没有找到公开的动画源码。
