## 贝塞尔曲线之美（Freya Holmér，The Beauty of Bézier Curves，SoME1 视频）

讲三次贝塞尔曲线：从线性插值、de Casteljau，到 Bernstein 形式、导数、曲率、包围盒、弧长参数化。

读了：视频（YouTube `aVwxzDHniEw`，B 站转载 BV1m44y1y7bC）全片每 10 秒一帧，3:48–9:10、16:10–17:20 每 2 秒一帧；作者交互演示 <https://acegikmo.com/bezier/> 的页面源码。

### Bernstein 形式画成"按权重缩放的位置向量首尾相接"，链尾就是曲线上的点

- **哪一刻**：4:26–6:20，"Bernstein Polynomial Form" 一章。
- **画面**：四个控制点各有一种颜色（P₀ 红、P₁ 蓝、P₂ 绿、P₃ 黄）。左上是按 P₀…P₃ 合并后的多项式，左下是四条同色的基函数曲线，一根竖线标出当前 t。画面中间一个原点，四条同色线段从原点连到四个控制点（"each point can be visualized as a vector from the origin"）。右下四根同色权重条。四个向量按权重缩放：t=0 时只有红色是满长，其余退成虚线；t 增大，红色缩短，蓝、绿伸长，最后只剩黄色。缩放后的四个向量从原点首尾相接成一条彩色折线，t 从 0 扫到 1，链尾画出曲线，曲线的颜色是四色按权重混合：起点红、中段蓝绿、终点黄。
- **难点**：只看 P(t) = Σbᵢ(t)Pᵢ，感觉不到哪个控制点什么时候起主导，也想不通它为什么和逐层插值是同一条曲线。
- **比常规好在哪**：教科书只画四条基函数曲线，那是一张 t 轴上的图，和平面上的控制点分开，观众得自己把"t=0.6 时蓝线最高"翻译成"此刻曲线被 P₁ 拉着走"。这里权重直接乘在平面向量上，权重消长就是箭头伸缩，加法就是首尾相接，曲线颜色记下了每一段由谁主导。同一个 t 同时驱动竖线、权重条、向量长短和曲线颜色，链尾正好落在前一章 de Casteljau 画出的曲线上（"exactly the same behavior as with the lerps but using a different interpretation of the same math"）。
- **我们怎么用**：权重和为 1，原点放在哪里链尾都是 ΣwᵢPᵢ，可以把原点放在不挡曲线的位置。
- **证据**：截帧 `bezier-bernstein.jpg`（5:44 t=0、5:52 首尾相接、6:06 曲线画到一半，右下 8:56 是下一条的三联小窗）。交互演示的 "Quick-evaluation vectors" 是同一画法（页面源码 513–542 行）：
  ```js
  v = mulV2s( subV2(p0,cnt), eval_weight(0, t ) );
  v = addV2(v,mulV2s( subV2(p1,cnt), eval_weight(1, t ) ) );
  ```

![Bernstein 形式：缩放后的向量首尾相接](highlights/bezier-bernstein.jpg)

### 导数放进一个固定的 "Derivative" 小窗，画速度箭头尖端的轨迹；后面讲包围盒、讲匀速都回到这个小窗

- **哪一刻**：6:58–9:06 引入；13:10 包围盒、16:18 弧长两次复用。
- **画面**：
  1. 曲线上的点带一支红色速度箭头。右侧小窗里同一支箭头从小窗原点画出，箭头尖扫出一条带三个控制点的曲线（"the derivative of the cubic bézier curve is, in and of itself a quadratic bézier curve"）。
  2. 8:20 左侧竖排三个小窗：速度窗里是一段抛物线弧，加速度窗里是一条线段，急动度窗里只有一个点。次数逐次降低直接读成形状：曲线、线段、点。
  3. 13:10 讲包围盒：小窗里的速度曲线和两条坐标轴相交处打上红、绿圈，与主画面包围盒上的红、绿极值点一一对应（"the roots are the t-values at which the quadratic derivative curve crosses the X and Y axes"）。
  4. 16:18 讲匀速：小窗里加一个以原点为圆心的虚线圆。对称的曲线，速度曲线几乎贴着圆，等 t 取的点也几乎等距；把两个中间控制点拉近，速度曲线离开圆，点距不均；拉成尖角，速度曲线擦过原点，点在尖角处挤成一团。
- **难点**："导数也是贝塞尔曲线"要靠系数代数推；包围盒为什么要解二次方程、等 t 为什么不等距，本来是两件互不相干、各需一套解释的事。
- **比常规好在哪**：常规只在曲线上画切线箭头，包围盒画 x(t)、y(t) 两张函数图，匀速只给一个积分公式。这里把速度箭头尖端的轨迹单独画出来，位置和标题全片固定，后面两件事都变成"看速度曲线在哪儿过轴""看它贴不贴圆"，用的是观众已经认得的同一个小窗。
- **证据**：截帧 `bezier-derivative.jpg`（13:20 包围盒、16:34 对称曲线贴圆、16:46 偏离圆、17:02 尖角处擦过原点）。旁白 16:40："the derivative lies within a circle which means the speed is almost constant … use any other curve, and you can see that it's no longer circular at all"。这个小窗只在视频里有，交互演示里没有。

![同一个 Derivative 小窗讲包围盒和匀速](highlights/bezier-derivative.jpg)

没有收的：de Casteljau 逐层插值（2:00–4:24）画得干净，但和维基百科的动图是同一种构图。

## 包络线（Paralogical，ENVELOPES，SoME1 视频）

讲包络线：先用 Line Rider 引出，再讲曲线族的包络怎么定义、怎么求，最后解释马克杯底那道心形亮线。

读了：视频（YouTube `fJWnA4j0_ho`，B 站转载 BV1wL4y147Jb，带中英字幕）全片每 10 秒一帧，三段每 2 秒一帧；简介里两个 Desmos 文件的全部表达式。

### 用 Line Rider 的"只准画直线"引出包络：雪橇只碰得到直线族的最上沿

- **哪一刻**：0:30–2:08，在标题和定义（3:20）之前。
- **画面**：Line Rider 里雪橇小人从 "Here" 滑到 "There"。
  1. 1:10 用短直线手画一条弯道，歪歪扭扭。
  2. 1:32 把每一小段向两端延长，延长部分都落在弯道下方："notice the extended parts stay underneath the curve we're making so doing this doesn't actually affect the sled"。
  3. 1:46 倒过来做：先只画进站、出站两条线，再 "connect the top of the first to the bottom of the second, then just below the first to just above the other and so on"，搭出一片直线网。
  4. 2:00 雪橇滑过网的上沿："and what do you know we get a pristine curve"。
- **难点**：一上来给"与族中每条曲线都相切的曲线"这个定义，观众不知道为什么要关心一族直线的边界。
- **比常规好在哪**：常规讲法直接画一族直线让曲线浮现，观众看到的是一个漂亮图案，不知道这条曲线回答了什么问题。这里先有任务（只能画直线，又要顺滑的弯道），游戏规则本身就是定义：雪橇只沿最上层的线走，下面的延长部分碰不到。"把曲线拆成切线，再用切线搭回曲线"的顺序也正是包络的思路。曲线出现时观众已经在等它。
- **证据**：截帧 `envelopes-linerider.jpg`（1:10、1:36、1:56、2:02）。Desmos 文件 "Quadratic Envelope" 是这套搭法的参数化：`F(t,u)=(1-t)P_1(u)+tP_2(1-u)`，滑块 `n_steps` 控制直线根数。

![Line Rider：手画、延长、搭网、滑过上沿](highlights/envelopes-linerider.jpg)

没有收的：后面用"相邻两条线的交点取极限"定义包络点，讲杯底光线时原样再做一遍（挑两条相邻光线加粗、橙点标交点），把包络点和最亮处接上。交点取极限是教科书定义，独到的只是重用，分量不够单列。

## 渗流（Spectral Collective，Percolation: a Mathematical Phase Transition，SoME2 视频）

二维方格上的 Bernoulli 渗流：先定义并用模拟探索，再证明临界概率在 1/3 和 2/3 之间。

读了：视频（YouTube `a-767WnbaCQ`，B 站转载 BV1de4y1x7Yi，硬中文字幕）全片每 10 秒一帧，五段每 1.5–3 秒一帧；原简介的章节表和注释。

### 每条边上印一个随机数，"数字小于 p 就接通"；先用来让动画连续，后来直接成为单调性的证明

- **哪一刻**：5:23–7:56 定义，16:29–18:30 用于证明。右侧的 p 刻度尺从片头就在。
- **画面**：
  1. 画面右侧一根 0 到 1 的竖直刻度尺，红色 p 标记上下滑。片头的大规模模拟、中段的探索都带着它。
  2. 5:26 先只画格点，每条潜在边的位置印一个两位小数（0.82、0.35、0.07…）。5:50 弹出规则："an edge is in the graph at parameter p ⇔ the number at that potential edge is < p"。
  3. 数字不动、只动 p：p=0.08 时只有印着 0.07、0.05、0.03 的边亮起；p 升到 0.64，同一批数字下更多边接通，团簇合并。两个团合并时保留大团的颜色，所以 p 变化时颜色连续，不乱跳。
  4. p 不动、重抽数字：p 固定在 0.50，整排数字重新抽，每次得到一张独立样本。6:44 写出 "P[a uniform random number between 0 and 1 is < p] = p = P_p[an edge is open]"。
  5. 16:29 标题 "Uniform Coupling ⇔ random function f:[0,1]→{graphs}"，用同一批数字画 f(0.14)、f(0.36)、f(0.64)…，由此推出"p₁<p₂ 时原点连到无穷远的概率不减"，并定义临界概率。
- **难点**：随着 p 增大渗流怎么变，本身就不好画：每个 p 独立抽一次样，画面整片闪烁，看不出团簇在长大、合并。到证明时，"为什么连通概率关于 p 单调、临界概率才有定义"又需要一个耦合构造。
- **比常规好在哪**：教科书在证明里才引入耦合，是纯符号构造；一般科普视频直接把不同 p 的独立样本并排放。这里随机数直接印在边上，规则一句话，观众能逐条核对；"固定数字改 p"和"固定 p 改数字"分开演示，一个说明单调、一个说明分布对。前面每段连续生长的动画背后都是这套机制，到证明时只要指出来，不用引入新东西。
- **证据**：截帧 `percolation-coupling.jpg`（5:41 印数、6:02 p=0.08、6:14 p=0.64、16:56 f(0.39)）。

![边上的数字和 p 刻度尺](highlights/percolation-coupling.jpg)

没有收的：对偶格（20:44）、数回路得到 ℓ·3^ℓ（22:30）都是这个领域的标准示意图。

## 实时光线追踪（Josh's Channel，How Realistic CGI Works，SoME2 视频）

现标题 "How Ray Tracing (Modern CGI) Works And How To Do It 600x Faster"。讲路径追踪、蒙特卡洛和重要性采样，再讲 RIS、蓄水池抽样、ReSTIR 的时间和空间复用。

读了：视频（YouTube `gsZiJeaMO48`，B 站转载 BV1FP4y1S7jn）全片每 10 秒一帧，23:08–24:42、28:16–29:18 每 2 秒一帧；英文转写对照旁白。

### 权重画成砝码，蓄水池抽样画成一个桶加一枚两面印着砝码的硬币，估计式也用砝码图标写

- **哪一刻**：23:16–24:40，之后时间复用、空间复用部分沿用。
- **画面**：
  1. 一排红色砝码，标着 1–4，大小随数字变大。先演示不用桶的做法：数轴上每格长度正比于权重，随机数落在哪格选哪个。旁白指出缺点：要查一半的格子，还要存下所有样本。
  2. 引出 "magic bucket"：俯视的蓝桶里放一个黄叉（当前选中的样本）和一个蓝砝码（累计权重）。
  3. 来了新样本（红叉加红砝码 5）。一枚橙色硬币两面分别印着红砝码和蓝砝码，翻转（"heads is weighted the same as the incoming item and tails was weighted with the total weight of the reservoir"）。翻出红面，红叉换进桶里，蓝砝码从 3 变成 8。下一个样本带绿砝码 3，翻出蓝面，桶里的样本不变，累计权重照样加到 11。
  4. 桶里标出 "#3"（见过的样本数），右边写 "Estimate Weight: 1/3 ·（蓝砝码 11）/（红砝码 5）"。
- **难点**：加权蓄水池抽样是流式算法，只存一个样本和一个总和，每来一个样本掷一次带权硬币，最终选中的概率就正比于权重，这一点不直观。ReSTIR 后面全靠"把一个桶当成一个带总权重的样本，再丢进另一个桶"，样本、权重、状态没有能搬动的图形，观众在这里会跟丢。
- **比常规好在哪**：常规讲法是伪代码 `if rand() < w/W then y = x` 加一张 w、W、M 的符号表，观众得自己记哪个字母是谁的权重。这里红砝码永远是"这个样本自己的权重"，蓝砝码永远是"桶里累计的权重"，颜色和形状就把两者分开；硬币两面直接印着两个权重，"概率正比于权重"不用说。连估计式都用同样的图标写，公式和画面是一套符号。
- **证据**：截帧 `cgi-bucket.jpg`（23:20 砝码、24:02 硬币、24:12 累计到 11、24:30 估计式）。

![砝码、桶和硬币](highlights/cgi-bucket.jpg)

## 帽子谜题（Going Null，The Coolest Hat Puzzle，SoME2 视频）

没有评估。archive.org 没有镜像，B 站搜不到转载，YouTube 和几个镜像站都拒绝访问，只拿到英文转写，转写不能代替画面。
