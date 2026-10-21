## 凯莱图（JuliaPoo，Cayley Graphs and Pretty Things，SoME3 荣誉提名文章）

用凯莱图介绍群：生成元、旋转群（多边形、正多面体）、直积、半直积。文中嵌着三维力导向布局的活图。

读了：文章 HTML 原文（正文和每张活图的绘图脚本都在里面）、两张示意图，源码 `JuliaPoo/Cayley-Graph-Plotting` 的 `ts/Group.ts`、`docs/index.html`；活图逐张截图，A₅ 那张每 3 秒截一张。下文 `cayley.html` 指 <https://juliapoo.github.io/mathematics/2023/07/15/plotting-cayley-graphs.html> 的页面源码。

### 同一张 A₅ 凯莱图，只改两种边的长短，在正十二面体和正二十面体之间来回变

- **哪一刻**："Rotation Groups" 一节末尾。前文刚说完二十面体和十二面体互为对偶、旋转群都是 A₅，紧接着："$A_5$ in particular exhibits both an icosahedron and dodecahedron simply by changing the lengths of the edges"。
- **画面**：60 个点，两种颜色的边各对应一个生成元（3 阶和 5 阶）。读者不用操作，图自己动：每 3 秒把一种边的目标长度设成 0，另一种设成 200 或 280，布局重新松弛。
  - 3 阶的边收成 0：每个三角形缩成一团，共 20 团，是十二面体的 20 个顶点，长边围成五边形面。
  - 5 阶的边收成 0：每个五边形缩成一团，共 12 团，是二十面体的 12 个顶点，长边围成三角形面。
- **难点**：两个立体顶点数一个 12 一个 20，面的形状也不同，"它们是同一个群"只读文字很难信。
- **比常规好在哪**：教科书把两种多面体分开画，分别列旋转对称；凯莱图通常只给一个固定布局，A₅ 的 60 个点像个足球，看不出和这两种多面体的关系。这里点和边始终是同一组，只调一个画法参数，"同一个群"由画面本身说明。边收成 0 等于把每个陪集并成一点（12 个五阶子群陪集、20 个三阶子群陪集），这张图顺带预演了"商掉一个子群"（这一层是我们的解读，原文没说）。
- **我们怎么用**：原作用力导向布局，收成 0 的边会被斥力撑开，留下小三角形和小五边形，每次变形还要抖一两秒才稳。我们做视频可以先算出每个陪集的中心，点画在"中心 + s(t) × 偏移"，变形完全由 t 决定。
- **证据**：
  - `cayley.html` 599–619 行：
    ```js
    linkforcectxx.distance(d => [0, 280][d.group]);
    ...
    linkforcectxx.distance(d => [200, 0][d.group]);
    ```
    两组 `setInterval` 错开 3 秒交替执行。作者特意把生成元换成 (a², b)："If the other site used $(a,b)$, I used $(a^2, b)$ here."
  - 截图：`cayley-a5-morph.jpg`，3×3 拼图，第 2 秒到第 26 秒每 3 秒一格。

![A₅ 凯莱图在十二面体和二十面体之间变形](highlights/cayley-a5-morph.jpg)

### 半直积的"扭转"画成两份拷贝之间的横档：平行是直积，交叉是半直积

- **哪一刻**："Direct Products" 一节的示意图，然后 "Semi-direct Products" 开头并排的 C₆×C₂ 和 D₆ 两张活图，再紧接一张示意图。
- **画面**：
  1. 直积示意图先立下说法：沿第二个因子的边走，是从 A 的第 b 份拷贝跳到第 bb′ 份拷贝，落在同一个 a 上。原文："we're still in the same spot $b$ but we've just changed 'universe'"。
  2. 两张活图都是六棱柱，"They look the same, except for the direction of the arrows."
  3. 第二张示意图左右各画两个绿色 C₆ 环，环上箭头方向相同。左边（直积）白色横档全部平行；右边（半直积）环和箭头都不动，只是横档交叉，落到另一个环的别的点上。原文："one can move the edges and nodes around to form the Cayley plot of $D_6$."
- **难点**：半直积的乘法 (a′, b′)(a, b) = (a′ψ(b′)(a), b′b)，教科书直接给出，不解释 ψ 为什么必须是 B 到 Aut(A) 的同态。
- **比常规好在哪**：常规讲法要么先给公式再验证 D_n ≅ C_n ⋊ C₂，全程无图；要么画一张 D₆ 凯莱图说"内外环方向相反"，只给结果。这里直积和半直积放进同一个画面框架：两份拷贝加一组横档，唯一的变量是横档怎么连。之后的推导顺着画面走：每个点一进一出，横档是一一对应；横档要保持环上的箭头，所以是自同构。ψ 是同态成了推出来的结论。"C₆⋊C₂ 只有两种扭转"也有了画面依据：把一个六元环接到另一个并保持箭头，只有原样对上和整个翻转两种接法。作者自述："to my knowledge, a new way to introduce the subject."
- **我们怎么用**：原文这里是静态图，两张活图太小，也没标出是哪个环的箭头反了。做视频可以让两个环不动，横档从平行逐条转成交叉；再把一个环原地翻面，横档变回平行，这个环的箭头随之反向。这样两种画法等价就直接看出来了。
- **证据**：
  - `cayley.html` 627–641 行：左 `"12_5"`（C₆×C₂），右 `"12_4"`（D₆），`_Ggens = [_Ggens[1], _Ggens[0]];` 对调生成元让两张图配色对应。示意图在 877 行（universe.png）和 904 行（universe2.png）。
  - 截图：`cayley-semidirect.jpg`（作者的第二张示意图）。

![平行的横档和交叉的横档](highlights/cayley-semidirect.jpg)

## 矩阵与线性变换（Yizhe Ang，Matrix Arcade，SoME3 荣誉提名交互网页）

没有达到标准的亮点。讲解顺序、例子和画面沿用 3Blue1Brown《线性代数的本质》第 3 集，作者在页脚写明了（`src/components/matrix/Footer.svelte:87-92`）。例子数值也是那一集的，`src/data/variables.js:6-9` 里还留着被注释掉的原值：

```js
export const egMatrixX = [1, -2];
// export const egMatrixY = [3, 0];
export const egMatrixY = [2, 0];
```

其余是交互外壳：滚动驱动时间轴、可拖动的数字、和基向量同色的矩阵列。读了 `Article.svelte`、`Arcade.svelte` 全部 13 段时间轴，线上页每 1000px 截一张。
