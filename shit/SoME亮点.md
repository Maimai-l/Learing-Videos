# SoME 获奖作品的画面和教案亮点

只收换一个作品就说不出来的做法，每条都有源码支撑。代码路径相对各作品的仓库根目录。

---

## 一、解锁图案最复杂能有多复杂（Dr. Zye，SoME1 视频）

"最复杂"的定义：9 个点全用上，8 段连线的斜率两两不同（3×3 里正好 8 种斜率）。

源码：<https://github.com/zyeworld/youtube> 的 `2021/01_patterns/manim/`。

### 1. 斜率图标：把"斜率两两不同"变成一排可以逐个点亮的格子

- **哪一刻**：2:03 定义复杂度；3:36 起第一次手工尝试；之后 5×5、3×5 的解沿用。
- **画面**：
  - 每种斜率画成"刚好装下它的最小点阵加一条对角线"，图标本身就是解锁网格里的一步。
  - 定义时并排两个图案，每段线复制一份飞到下方，斜率相同的落进同一个图标：蛇形图案只剩 2 个图标，乱画的剩 7 个。复杂度就是"最后剩几个图标"。
  - 尝试时 8 个图标排在网格下方，每画一段，对应图标闪一下变黄。
  - 试画一段重复斜率时，新线变红，同时早先画过的同斜率旧线也变红。
- **难点**：斜率两两不同是全局约束，要把 8 段线两两比较；一团交叉的折线，观众判断不了合不合格。
- **比常规好在哪**：常规做法是给线段标斜率数值，让观众比对数字。这里定义第一次出现就被演出来（2 个图标对 7 个）；冲突时撞车的两段一起标红，死路的原因直接画在图案上；更大的网格沿用同一套图标。
- **代码**：
  - `chapter_1to3.py:52-68` 图标是 (w+1)×(h+1) 的点阵加一条线：
    ```python
    def SlopeGroup(width, height):
        for y in range(abs(height) + 1):
            for x in range(width + 1):
                dot = Dot([x - x_offset, y - y_offset, 0])
        ...
        line = Line(start=group[0].get_center(), end=group[-1].get_center())
    ```
  - `chapter_1to3.py:233-290` 线段飞进图标，左边 8 段只有两个目标：
    ```python
    FadeTransform(lines1[0], slope_list1[0], run_time=1.5),
    FadeTransform(lines1[1], slope_list1[0], run_time=1.5),
    FadeTransform(lines1[2], slope_list1[1], run_time=1.5),
    ```
  - `chapter_1to3.py:576-625` 画线、闪图标、变黄同时发生；冲突时新线红、旧线也染红：
    ```python
    Create(lines[i], run_time=0.5),
    Flash(slope_list[PATTERN_SLOPES[i]], ...),
    slope_list[PATTERN_SLOPES[i]].animate(run_time=0.5).set_color(YELLOW),
    ...
    line1 = Line(start=dots[1].get_center(), end=dots[4].get_center(), color=RED)
    Create(line1, run_time=0.5),
    lines[4].animate(run_time=0.5).set_color(RED),
    ```

### 2. 斜率位置小图：把"这一步只能这样走"摊开

- **哪一刻**：6:18 出题（给定前两个点，不靠试错找到解），6:40–7:24 解答，7:28 写成流程图，8:00 宣布共 296 个解。
- **画面**：点亮一个斜率，网格下方弹出几张缩小的 3×3，每张画着这个斜率在网格里的一种放法。碰到已用点的那张变红，主网格上同时闪出那条红线；唯一剩下的那张变黄，主网格画出它。之后每一步同样五拍，节奏越来越快。
- **难点**：穷举靠的是"某个斜率只剩一个位置，所以现在必须用它"。口述时观众得在脑子里列全一个斜率的所有位置再逐个排除。
- **比常规好在哪**：常规讲回溯会画搜索树，说明了在穷举，说明不了这一步为什么只能这样走。这里按斜率列出全部放法，画的是剪枝的理由。出题时特意选了每一步都只有一种走法的局面，观众先自己碰到"被迫"，流程图只是把这个体验写成规则。
- **代码**：
  - `chapter_1to3.py:71-95` 枚举一个斜率及其整数倍在 3×3 里的全部放法，每种画成缩小的网格：
    ```python
    def Minigrids(width, height):
        while w < 3 and abs(h) < 3:
            for y in range(3 - abs(h)):
                for x in range(3 - w):
                    grid = Dots(3, 3).scale(0.4)
                    grid.add(Line(start=grid[start].get_center(), end=grid[end].get_center()))
            w += width
            h += height
    ```
  - `chapter_1to3.py:676-769` `minigrid_ans = [None, None, 0, 0, 1, 5, 0, 0]` 记每一步唯一可行的是第几张；`step()` 固定五拍：
    ```python
    def step(i, time, wait):
        Indicate(slope_list[pattern_slopes[i]]), Flash(...)        # 点亮斜率
        minigrid = Minigrids(*slopes[pattern_slopes[i]])           # 弹出全部放法
        minigrid[minigrid_ans[i]].animate.set_color(YELLOW)        # 可行的变黄
        Create(lines[i]), slope_list[...].animate.set_color(YELLOW) # 画线
        FadeOut(minigrid)                                          # 小图消失
    ```

### 3. 归纳构造：按斜率族拆成四个彩色图层，每层往外多套一圈

- **哪一刻**：22:48 说明种子就是 4:43 靠试错找到的第一个解；24:15 提示卡；24:45–25:30 图解；25:58 揭示分组。
- **画面**：3×3 的解拆成红 X、橙小 X、黄 V、绿"一竖一横"四层。提示卡只画出红 X 从 3×3 扩到 3×5，橙和黄留成问号。之后每层单独演示 3→5→7，每次往外多套一对更平的交叉线或更宽的 V；四层在透视里汇合成原解，再在 3×5 上汇合，按路径顺序描一遍、点亮斜率图标。最后左边按 ±1/偶数、±1/奇数、±2/奇数、0 和 ∞ 列出全部斜率，右边是对应颜色的四层。
- **难点**：3×(2k+1) 的解是 6k+2 段交错的折线，看不出下一个网格的解长什么样。
- **比常规好在哪**：常规要么直接给公式，要么摆出 3×3、3×5、3×7 三个完整的解让观众找规律，叠在一起只是一团线。这里分层的依据就是复杂度的定义（斜率），拆法本身就是证明思路。种子用片头随手凑出的解，片尾接回片头。
- **代码**：`induction.py:7-36` 四层各是一个 for 循环，参数 k 是网格宽度，每次循环往外加一对线：
  ```python
  def subp1(k):   # 斜率 ±1/(2i)，红
    for i in range(1, (k//2)+1):
      lines.add(Line([-i,0,0], [i,-1,0]))
      lines.add(Line([i,0,0], [-i,-1,0]))
  def subp2(k):   # 斜率 ±1/(2i+1)，橙
    for i in range(k//2):
      lines.add(Line([-i,1,0], [i+1,0,0]))
      lines.add(Line([i+1,1,0], [-i,0,0]))
  def subp3(k):   # 斜率 ±2/(2i+1)，黄
    for i in range(k//2):
      lines.add(Line([-i-1,1,0], [i,-1,0]))
      lines.add(Line([i+1,1,0], [-i,-1,0]))
  def subp4(k):   # 竖线加横线，绿
    lines.add(Line([0,1,0],[0,0,0]))
    lines.add(Line([-(k//2),-1,0],[k//2,-1,0]))
  ```
  `induction.py:40-59` 四层分别着色后沿 z 方向错开、转到透视；`induction.py:125-203` 在 3×5 上汇合并按路径描线。

---

## 二、计算机怎么表示数（Mabi19，SoME3 文章）

从 8 位无符号整数一路"重新发明"到 IEEE 754 浮点数，每一步先提出一种格式，指出毛病，再改。

源码：<https://github.com/Mabi19/numbers>。

### 小数点是一个会跑的格子：放不下时读数是"?"，下一步补上灰色的"虚拟零"

- **哪一刻**："Moving the binary point" 一节的两个演示（`content.html` 223–245 行），在讲指数之前。
- **画面**：一排 32 格。最左 5 格（绿）编码小数点位置，其余 27 格是数值，整数部分红、小数部分蓝。小数点自己占一格，插在红蓝之间。读者点绿色比特，小数点在这一排里跳到别处，红蓝分界跟着走。5 位编码最大是 31，但只有 27 个位置可放：编码超过 27 时，第一个演示里整排变红、小数点消失，读数只剩"?"；紧接着的第二个演示，同样的编码改成在数值右边接上几格灰色、点不动的 0，这一排比实际存的 32 位还长。
- **难点**："用几位比特存小数点的位置"是指数的前身，本身抽象；"能表示的位置比能放的多"这种浪费平常只能数数说明；"没存但当作存在的位"更难想象。
- **比常规好在哪**：常规讲法写 `value × 2^(p−27)` 再举几组例子，公式里看不到"点放不下"，也看不到"补出来的零"。这里两种情形各对应一种看得见的状态：一个问号、一段灰格。先给问号、下一步把问号修成灰格，正好是全文"指出毛病再改"的节奏。
- **代码**：`components/moving-point-demo.ts:10-43`
  ```ts
  const renderPointPosition = 27 - Math.min(27, parts.pointPosition);
  ...
  ${when(parts.virtualZeroes == 0 || this.type == "hypervalues", () => html`
      ${this.makeBitElements(fractionalPart, { class: "blue" })}
      <div class="bit virtual">.</div>
      ${this.makeBitElements(new Array(parts.virtualZeroes).fill(false), { locked: true, class: "gray virtual" })}
  `)}
  ${this.makeBitElements(integerPart, { ..., class: "red"})}
  ${this.makeBitElements(pointPart, { ..., class: "green" })}
  ...
  ${when(virtualZeroes == 0 || this.type == "hypervalues",
      () => html`${formatGenericNumber(value)}`,
      () => html`?`
  )}
  ```
  `components/bits.ts:63` `virtualZeroes: Math.max(0, bitsToUInt(pointPositionBits) - 27)`。同一个组件、同一套比特，只靠 `type` 从 `simple` 换成 `hypervalues`，问号就变成灰格。

---

## 三、复杂性科学（MecanicaScience，SoME4 教师奖文章）

磁铁、萤火虫、鱼群其实是同一个"对齐加噪声"的模型，都有相变；另一条线是"理论家怎么一步步搭模型"。

源码：<https://github.com/MecanicaScience/website> 的 `app/(core)/articles/(2025)/science_of_complexity/`，下文路径相对这个目录。

### 1. 萤火虫：先照着"只换个解释"的模型跑一遍，一只都不闪；打开箭头，全部朝右一动不动

- **哪一刻**：第二部分讲萤火虫同步（`text/Part2.tsx` 106–160 行）。顺序是：
  1. 这一节开头先放一个正常同步闪烁的版本，读者知道"对的样子"。
  2. 作者把话说满：萤火虫的箭头互相对齐，这正是 XY 模型，只是换了个解释。
  3. 给读者一个带滑块的模拟，萤火虫一只都不亮。
  4. 提问：为什么它们从来不闪？
  5. 承认漏了一项：每个箭头还要自己匀速旋转。加上自转频率 ω 后再给一个模拟。
- **画面**：深蓝夜空里漂着几十只萤火虫，有"相互作用""噪声"两个滑块和一个"箭头"勾选框。勾上后每只萤火虫变成圆圈加箭头，箭头转到朝上时才闪。失败版本里所有箭头整齐朝右、静止；加上 ω 后箭头开始转，把相互作用拉满，大部分箭头一起转到朝上、一起闪。
- **难点**：XY 模型讲"对齐"，萤火虫讲"一起闪"，读者容易当成一回事。
- **比常规好在哪**：常规讲法直接写出 Kuramoto 方程再解释 ω，读者不知道没有 ω 会怎样。这里读者先看到失败，打开箭头看到"完全对齐却不闪"，ω 是为了修好这个画面才加的。同一个模拟可以在萤火虫外观和模型箭头之间切换，失败的原因一勾就看见。
- **代码**：`simulations/2_FirefliesSynchronisation.tsx:106-132`
  ```ts
  newThetaList[i] = theta + omega * dt + coupling * sinSum
                  + Math.sqrt(temperature) * noiseIntensity * sampleGaussian(0, 10) * dt;
  if (!omegaActivated) {
      newThetaList[i] = 0;
  }
  ...
  const targetTheta = (3 * Math.PI) / 2;   // 朝上
  if (newThetaList[i] > targetTheta - eta && newThetaList[i] < targetTheta + eta) {
      newTickingList[i] = 1;              // 闪
  }
  ```
- **注意**：失败版本是摆拍的，`omegaActivated` 为假时角度直接写成 0，所以那个版本里拖滑块没有作用。真跑 XY 动力学，箭头会对齐到随机方向并抖动，同样几乎不闪，结论不变。借鉴时失败版本要真正跑模型：去掉 `newThetaList[i] = 0`，只把 `omega` 设为 0。

### 2. 磁化强度曲线的上下两支各配一个晶格小窗

- **哪一刻**：第一部分讲温度的作用，磁化强度随温度变化图（`text/Part1.tsx` 214–218 行）。
- **画面**：左边是总磁化强度对温度的曲线，低温段分成 +1、−1 上下两支，到临界温度合成 0。图的右上角、右下角各一个晶格小窗，分别对应上支和下支，窗里一根白色大箭头，长度是磁化强度大小。鼠标移动时一条竖虚线跟着走，两个圆点落在上下两支上：低温时上窗几乎全红、下窗几乎全蓝；靠近临界点两窗都变斑驳；过了临界点两个圆点合成一个，两窗变成一样的噪点。
- **难点**：低温时磁化强度有两个可能的值，具体是哪个靠偶然选定；高温时只有一个。只画大小对温度的曲线看不出这一点。
- **比常规好在哪**：常规是一张曲线图配"低温、临界、高温"三张快照，读者自己把快照和曲线上的点对应起来，而且通常只画一支。这里一根竖线同时驱动两个窗，窗的上下位置就是分支的上下位置，"两种磁铁在临界点变成同一种东西"不用术语就看得见。
- **代码**：`simulations/1_IsingMagnetizationGraph.tsx`
  ```ts
  // 152-158 行：曲线
  const func = (x: number, pm: number) => {
      if (x < 1.0) { const xl = -((-x-1) / 2 * 2 + 1); return pm * Math.sqrt(1 - xl * xl); }
      return 0;
  };
  // 211-217 行：上下两支
  line(d3.range(0, 2, 0.001).map((x) => ({ x: x, y: func(x, 1) })))
  line(d3.range(0, 2, 0.001).map((x) => ({ x: x, y: func(x, -1) })))
  // 270-276 行：一个鼠标位置同时给出两支的值
  setMagnetizationValue([yDownValue, yUpValue]);
  // 302-314 行：分别交给上下两个窗
  <div className={styles['ising-graph-canvas-container-up']}><CanvasSimulation magnetization={magnetizationValue[0]} /></div>
  <div className={styles['ising-graph-canvas-container-down']}><CanvasSimulation magnetization={magnetizationValue[1]} /></div>
  ```
- **注意**：曲线是手写的半椭圆，窗里的晶格也只是按磁化强度的比例随机撒点，没有跑模拟；温度轴 0–2 和前面模拟里 0–10 的滑块不是同一套刻度。借鉴时应该用真实模拟的数据。

---

## 四、凯莱图（JuliaPoo，Cayley Graphs and Pretty Things，SoME3 荣誉提名文章）

用凯莱图介绍群：生成元、旋转群、直积、半直积。文中嵌着三维力导向布局的活图。

源码：文章页面 <https://juliapoo.github.io/mathematics/2023/07/15/plotting-cayley-graphs.html> 的页面源码（正文和每张活图的绘图脚本都在里面，下文行号按页面源码），以及 <https://github.com/JuliaPoo/Cayley-Graph-Plotting>。

### 1. 同一张 A₅ 凯莱图，只改两种边的长短，在正十二面体和正二十面体之间来回变

- **哪一刻**：讲旋转群一节的末尾。前文刚说完二十面体和十二面体互为对偶、旋转群都是 A₅。
- **画面**：60 个点，两种颜色的边各对应一个生成元（3 阶和 5 阶）。图自己动：每 3 秒把一种边的目标长度设成 0，另一种设成 200 或 280，布局重新松弛。3 阶的边收成 0 时，每个三角形缩成一团，共 20 团，是十二面体的顶点；5 阶的边收成 0 时，每个五边形缩成一团，共 12 团，是二十面体的顶点。
- **难点**：两个立体顶点数一个 12 一个 20，"它们是同一个群"只读文字很难信。
- **比常规好在哪**：教科书把两种多面体分开画；凯莱图通常只给一个固定布局，A₅ 的 60 个点像个足球，看不出和这两种多面体的关系。这里点和边始终是同一组，只调一个画法参数，"同一个群"由画面本身说明。边收成 0 等于把每个陪集并成一点，这张图顺带预演了"商掉一个子群"。
- **代码**：页面源码 599–619 行
  ```js
  _Ggens[0] = _Ggens[0].mul(_Ggens[0]);           // 生成元换成 (a², b)
  const linkforcectxx = pltt.d3Force('link');
  const a = window.setInterval(() => {
    linkforcectxx.distance(d => [0, 280][d.group]);   // 第一种边收成 0
    pltt.d3ReheatSimulation()
  }, 6000);
  const woof = window.setInterval(() => {
    const b = window.setInterval(() => {
      linkforcectxx.distance(d => [200, 0][d.group]); // 第二种边收成 0
      pltt.d3ReheatSimulation()
    }, 6000)
    clearInterval(woof)
  }, 3000)
  ```
  独立绘图页里每种边的长度都有滑块（仓库 `docs/index.html` 238–244 行）。
- **我们怎么做**：力导向布局里收成 0 的边会被斥力撑开，每次变形还要抖一两秒。按"画面只由 t 决定"，可以先算出每个陪集的中心，点画在"中心 + s(t) × 偏移"，s(t) 在 0 和 1 之间来回，两种生成元交替。

### 2. 半直积的"扭转"画成两份拷贝之间的横档：平行是直积，交叉是半直积

- **哪一刻**：讲直积一节的示意图，讲半直积一节开头并排的 C₆×C₂ 和 D₆ 两张活图，紧接一张示意图。
- **画面**：直积示意图先立下说法：沿第二个因子的边走，是从 A 的一份拷贝跳到另一份，落在同一个元素上（作者说"换了一个宇宙"）。半直积示意图左右各画两个 C₆ 环，环上箭头方向相同：左边横档全部平行，右边环和箭头都不动、横档交叉，落到另一个环的别的点上。作者指出右边整理一下就是 D₆ 的凯莱图。
- **难点**：半直积的乘法 (a′, b′)(a, b) = (a′·ψ(b′)(a), b′b)，教科书直接给出，不解释 ψ 为什么必须是到自同构群的同态。
- **比常规好在哪**：常规讲法先给公式再验证 Dₙ ≅ Cₙ ⋊ C₂，或画一张 D₆ 凯莱图说"内外环方向相反"。这里直积和半直积放进同一个框架：两份拷贝加一组横档，唯一的变量是横档怎么连。之后的推导顺着画面走：每个点一进一出，横档是一一对应；横档要保持环上的箭头，所以是自同构。"C₆⋊C₂ 只有两种扭转"也有了画面依据：把一个六元环接到另一个并保持箭头，只有原样对上和整个翻转两种接法。
- **代码**：页面源码 627–641 行并排画两张活图，左 `"12_5"`（C₆×C₂），右 `"12_4"`（D₆），并用 `_Ggens = [_Ggens[1], _Ggens[0]];` 对调生成元，让两张图的配色对应。两张示意图在 877 行和 904 行。
- **我们怎么做**：两个环不动，横档从平行逐条转成交叉；再把一个环原地翻面，横档变回平行，这个环的箭头随之反向。两种画法等价就直接看出来了。

---

## 五、用 Desmos 讲相对论（Mr Happy Face，Relativity in Desmos，SoME4 教师奖）

七个 Desmos 文件就是课堂演示。取全部表达式：`curl -H 'Accept: application/json' https://www.desmos.com/calculator/<编号>`（三维的换成 `3d`）。下文"表达式 n"指文件里的表达式编号。

**七个文件共用一个骨架**：变换写成一个函数，矩阵四个元素是单独的表达式；凡是属于某个参考系的东西都写成 `L((…))` 来画；观察者速度是滑块 B，物体速度是另一个变量 H。

```
L\left(v\right)=\left(av.x+bv.y,\ cv.x+dv.y\right)
a=G   b=-BG   c=-BG   d=G        G=\frac{1}{\sqrt{1-B^{2}}}
```

**更正交接说明里"已确认的一条"**：双曲线 `y^2-x^2=C^2` 不在隧道悖论那张图（khvga9rool）里，在洛伦兹变换那张（xa6ytgjqtp）。隧道图里默认显示的"同时"线是表达式 43 `L((t,t_0))`，它和门一起经过 L，拖速度时虽然倾斜，跨过的开门区段并不变；真正随速度改变跨过区段的是表达式 48 `(t,t_0)`（屏幕上水平），存档里设为隐藏。

### 1. 不变量是唯一不套 L 的东西；把四个矩阵元素换成 cos、sin，同一份文件就成了旋转

- **文件**：洛伦兹变换 xa6ytgjqtp，旋转变换 bfn16xvrs9。
- **画面**：网格和光线都经过 L；红色双曲线族不经过 L。两段世界线从原点出发，橙线终点 (−0.3, 1) 的间隔是 √0.91 ≈ 0.954，正好落在加粗的 C₀=0.95 那条双曲线上。拖 B，网格沿光锥方向挤成菱形，双曲线和光线不动，橙线终点沿粗双曲线滑；B=0.5 时蓝线竖直，看到的是蓝色物体自己的静止系。旋转那张骨架一模一样（文件夹名还叫 "Lorentz Transformation"），拖 B 时方格整体转动，同心圆不动。
- **难点**："洛伦兹变换是双曲旋转""间隔不变"对学生通常只是一句公式类比。
- **比常规好在哪**：常规时空图要画第二套斜轴，再加校准双曲线，学生同时读两套刻度。这里没有第二套轴，整张网格就是另一个参考系的坐标；变不变由写不写 `L(…)` 决定，拖动时不变量就是唯一不动的背景。世界线终点特意选在加粗曲线上，学生看到一个点在曲线上滑。旋转和洛伦兹只差四个元素和一个正负号。
- **代码**：
  ```
  xa6ytgjqtp
    11  L\left(\left(t,K\right)\right)          网格，经过 L
    12  L\left(\left(K,t\right)\right)
    33  L\left(\left(Ht,t\right)\right)          蓝线，H=0.5
    38  L\left(\left(It,t\right)\right)          橙线，I=-0.3
    36  y^{2}-x^{2}=C^{2}                         双曲线族，不经过 L
    39  y^{2}-x^{2}=C_{0}^{2}                     加粗的一条，C_0=0.95
  bfn16xvrs9
    2 a=\cos B   3 b=\sin B   6 c=-\sin B   7 d=\cos B
    36  y^{2}+x^{2}=C^{2}
  ```

### 2. 谷仓悖论：撞墙的消息以光速传过杆子，画成杆子后端世界线在光线上的折点

- **文件**：谷仓悖论 farprypcea。作者在文件里写了三段说明（表达式 56、59、61）。
- **画面**：谷仓后墙 x=0，门在 x=−5，开着的那段画成点线。杆静长 8、速度 0.8。前端撞墙前沿 `L((Ht,t))` 走，t=0 撞墙后变成 `L((0,t))` 跟着谷仓。后端继续以 0.8 前进，到 t=2.7 才折向：2.7 正好是撞击点向左发出的光线 x=−t 追上后端的时刻（−t = −4.8 + 0.8t）。这条光线就是网格里本来就有的虚线 `L((t,-t))`。折点之后两种情形：停在原地，或以可拖的速度向后弹开。拖到跑者系（B=0.8），后端竖直不动，折点仍落在同一条光线上，在 t′≈8。
- **难点**：学生会追问"跑者系里杆比谷仓长得多，门关上时杆到底在哪"，教科书常停在"相对论里没有刚体"一句脚注。
- **比常规好在哪**：常规只画到撞墙那一刻，或只讲同时性。这里把撞击之后的世界线画全，消息直接用网格里现成的 45° 光线。光线在任何参考系里都是同一条 45° 线，所以拖 B 时折点在两个参考系里都落在它上面，"刚体不存在"变成图上看得见的折点。
- **代码**：
  ```
  33  L\left(\left(Ht,t\right)\right)                                   前端，撞墙前
  49  L\left(\left(0,t\right)\right)                                    前端，撞墙后
  36  L\left(\left(-P_{oleLength}\sqrt{1-H^{2}}+Ht,t\right)\right)      后端
  50  S_{topT}=2.7                                                      后端折点时刻
  51  L\left(\left(-P_{oleLength}\sqrt{1-H^{2}}+H\left(S_{topT}\right),t\right)\right)   折后停住（虚线）
  53  L\left(\left(-P_{oleLength}\sqrt{1-H^{2}}+H\left(S_{topT}\right)-E_{xpandVelocity}\left(t-…   折后弹开
  54  E_{xpandVelocity}=0.5
  32  L\left(\left(t,\ -t\right)\right)                                 光线（消息）
  63  \left(t,t_{0}\right)                                              当前观察者的"此刻"，水平
  ```
- **注意**：作者说明 59 第一句把左右写反了（说信号左侧跟着谷仓走，按图应是右侧），借用时要改。

隧道悖论（khvga9rool）用同一套画法：门的开关画成世界线上的点线段（文件夹名 "Tunnel doors (gap indicates open)"），列车两端是两条世界线。把隐藏的表达式 48 打开，拖到列车系（B=0.8），能看到右门已经开了、左门还没关，列车系里找不到两扇门同时关着的时刻。

### 3. 光行差：相对论版和伽利略版是同一份三维文件，只换矩阵；一个保住光锥，一个把光锥推歪

- **文件**：光行差 ouj1bwauoo，伽利略光行差 1xpcvjooj7（都在 `desmos.com/3d/`）。x、y 是空间，z 是 ct，B 是沿 x 方向的速度。
- **画面**：60 条光线在粒子静止系里均匀发出；灰色参考光锥不经过 L；波峰画成一串光锥，锥顶沿粒子世界线排列。相对论版拖到 B=0.8，光线仍然全部贴在不动的灰锥上，只是沿锥面挤向运动前方，波峰锥前密后疏（多普勒）。伽利略版拖到 B=0.8，光线扇面被剪切成一个歪锥，不同方向的光速不再相同。
- **难点**：光行差公式只告诉学生"角度变了"。学生想不通的是：光速在各系都是 c，方向怎么会变？
- **比常规好在哪**：常规画法是"雨伞和雨"或一个速度三角形，相对论版和经典版看起来都只是"斜了一点"。这里只换四个矩阵元素，对比落在一个几何事实上：锥面保不保得住。伽利略变换下方向变了，代价是光锥歪了；洛伦兹变换下光锥纹丝不动，变的只是每条光线落在锥面的哪个位置。
- **代码**：
  ```
  10  L\left(v\right)=\left(Av.x+B_{m}v.y+Cv.z,\ Dv.x+Ev.y+Fv.z,\ G_{m}v.x+Hv.y+Iv.z\right)
      相对论版  A=G  C=-BG  G_{m}=-BG  I=G     （其余 B_m=D=F=H=0，E=1）
      伽利略版  A=1  C=-B   G_{m}=0    I=1
  35  L\left(\left(\cos\left(a_{ngles}\right)t,\ \sin\left(a_{ngles}\right)t,\ t\right)\right)\{L(…).z<t_{cutoff}\}
      截止条件作用在变换之后的 z 上：拖 t_cutoff 时，光在当前观察者的时间里向外传播
  73  L\left(\left(u\cos v,\ u\sin v,\ u+p_{eaks}\right)\right)    波峰：锥顶沿世界线排列的一串光锥
  82  z^{2}=x^{2}+y^{2}                                             灰色参考光锥，不经过 L
  ```
  作者保留了一个隐藏文件夹 "Peaks and troughs (old and wrong)"（表达式 76）：旧版把波峰画成同一个光锥上的几个圈，相当于只闪了一次光；新版改成一串光锥。

---

## 六、藏在平板里的图像（Matt Ferraro，Hiding Images in Plain Sight: The Physics Of Magic Windows，SoME1 长文）

一块看上去平整的亚克力，阳光照过去投出一只猫。文章讲怎样从目标图算出表面高度：先把透镜面上的网格变形，让每个格子的面积正比于对应像素的亮度；再用折射定律求法向；最后解泊松方程，从法向积分出高度。

源码：<https://github.com/MattFerraro/causticsEngineering> 的 `src/create_mesh.jl`。文章：<https://mattferraro.dev/posts/caustics-engineering>。

### 1. "光往哪去"改写成"每个格子多大"，再把变形后的网格本身渲染出来：网格就是那只猫

- **哪一刻**：讲问题表述一节的示意图，算损失一节的式 (1.0)，讲迭代一节末尾的四张网格图。
- **画面**：示意图用同一个 (i, j) 编号把透镜面上变形的格子和像面上的方格绑在一起；式 (1.0) 配一句大白话：一个像素占全图亮度的百分之几，对应的格子就占整块窗面积的百分之几。迭代后的透镜网格导出来做线框渲染，只有网格线，底上浮现出整只猫；再放大到眼睛、瞳孔，能数清一个个被挤扁、撑开的格子。
- **难点**："弯曲的表面怎么把光挪到指定位置"本是三维光学问题，读者会卡在追踪每条光线去哪。
- **比常规好在哪**：常规讲焦散用光线图（平行光进凸透镜会聚到一点），只能讲"会聚就亮"，看不出每处该收多少光。面积表述把第一步变成纯平面几何，折射定律推到下一节。网格渲染图验证了这个改写：不做任何光学计算，只靠网格线的疏密，网格本身已经是那张图。
- **代码**：`src/create_mesh.jl`
  ```julia
  # 465-470 行：损失就是"格子面积 − 像素亮度"
  function oneIteration(meshy, img, suffix)
      LJ = getPixelArea(meshy)
      D = Float64.(LJ - img)
      D .-= sum(D) / (512 * 512)
  # 519 行（已注释）：把变形网格导出，文中的线框渲染由此而来
  # saveObj!(meshy, "./examples/mesh_$(suffix).obj", flipxy=true)
  ```

### 2. 先画出"直接沿梯度走"是一团乱箭头，再换成泊松方程解出的平滑速度场

- **哪一刻**：讲迭代一节：∇L 的箭头图，紧接一句"糟了"；流体类比；−∇Φ 的箭头图。
- **画面**：两张同尺寸、同画法的箭头图。∇L 每隔 10 像素一个箭头，相邻箭头方向乱跳；−∇Φ 的箭头方向平滑渐变，边界上沿边走、不穿出边框。最后把猫和 −∇Φ 并排，眯眼能看出亮的背景要扩张、暗的毛要收缩。
- **难点**：学过梯度下降的读者自然会问"为什么不直接沿梯度挪点"，泊松方程看起来绕了一大圈。
- **比常规好在哪**：原论文和一般讲解直接给出泊松方程。这里先把走不通的路画出来：改善一个格子的损失必然恶化它的邻居，相邻点要往相反方向走，一眼就知道不行，∇²Φ = L 才有了动机。读者的疑问由画面回答，不靠权威。
- **代码**：`src/create_mesh.jl:478-494`，作者为文章专门留下了画 ∇L 的代码，下面紧接着用松弛法解 Φ：
  ```julia
  # These lines are just for plotting the quiver of L, which I needed for the blog post
  # ∇Lᵤ, ∇Lᵥ = ∇(D)
  # plotVAsQuiver(∇Lᵤ, ∇Lᵥ, stride=10, scale=10, max_length=200)

  ϕ = zeros(width, height)
  for i = 1:10000
      max_update = relax!(ϕ, D)
  ```
