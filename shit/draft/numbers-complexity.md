## 计算机怎么表示数（Mabi19，How Computers Use Numbers，SoME3 文章）

从 8 位无符号整数一路"重新发明"到 IEEE 754 浮点数，每一步先提出一种格式，指出毛病，再改。

读了：`Mabi19/numbers` 的全文 `content.html` 和 `components/` 全部组件；线上页逐个点了预设和比特。下文代码路径相对仓库根。

### 小数点是一个会跑的格子：放不下时读数是"?"，下一步补上灰色的"虚拟零"

- **哪一刻**："Moving the binary point" 一节的两个演示（`content.html` 223–245 行），在讲指数之前。
- **画面**：一排 32 格。最左 5 格（绿色下划线）编码小数点位置，其余 27 格是数值，整数部分红色下划线，小数部分蓝色。小数点"."自己占一格，插在红蓝之间。读者点绿色比特，小数点在这一排里跳到别处，红蓝分界跟着走。
  - 5 位编码最大是 31，但只有 27 个位置可放。编码超过 27 时，第一个演示里整排变红、小数点消失，读数只剩 **"= ?"**。
  - 紧接着的第二个演示，同样的编码不再显示问号，而是在数值右边接上几格**灰色、点不动**的 0，小数点画在它们后面，这一排比实际存的 32 位还长。正文："putting extra *virtual zeroes* to fill in the space"。
- **难点**："用几位比特存小数点的位置"是后面"指数"的前身，本身很抽象；"5 位能表示的位置比能放的多"这种浪费，平常只能靠数数说明；"没存但当作存在的位"更难想象。
- **比常规好在哪**：常规讲法写一个 `value × 2^(p−27)` 再举几组例子，公式里看不到"点放不下"，也看不到"补出来的零"。这里两种情形各对应一种看得见的状态：一个问号、一段灰格。先给问号、下一步再把问号修成灰格，正好是"指出毛病再改"的节奏。
- **证据**：
  - `components/moving-point-demo.ts:14` `const renderPointPosition = 27 - Math.min(27, parts.pointPosition);`
  - 同文件 21–24 行：虚拟零画成 `{ locked: true, class: "gray virtual" }`；35–37 行：越界时读数为 `?`。
  - `components/bits.ts:63` `virtualZeroes: Math.max(0, bitsToUInt(pointPositionBits) - 27)`
  - 截图：`numbers-moving-point.jpg`，从上到下：750,000（点在最右）、0.0005（点在最左）、编码越界读数"?"、1.5 billion（4 格灰色虚拟零）。

![小数点的四种状态](highlights/numbers-moving-point.jpg)

没有收的：补码一节切换"无符号/补码"读法时，比特和高亮的"−3"按钮都不变、读数变成 253。说明的是"同一串比特两种读法"，这种开关在别的进制演示里也常见。精度丢失全文没有专门的演示，讲舍入那节只有文字。

## 复杂性科学（MecanicaScience，The science of complexity，SoME4 教师奖文章）

磁铁（伊辛模型）、萤火虫（XY 模型到 Kuramoto 模型）、鱼群（Vicsek 模型）其实是同一个"对齐加噪声"的模型，都有相变。另一条线是"理论家怎么一步步搭模型"。

读了：`MecanicaScience/website` 的 `app/(core)/articles/(2025)/science_of_complexity/` 下 `text/` 全部正文和 `simulations/` 全部模拟；线上页截了图。下文路径相对这个目录。

### 萤火虫：先照着"只换个解释"的模型跑一遍，一只都不闪；打开箭头一看，全部朝右一动不动

- **哪一刻**：第二部分 "The synchronisation of fireflies"（`text/Part2.tsx` 106–160 行）。顺序是：
  1. 这一节开头先放一个正常同步闪烁的版本，读者知道"对的样子"（24 行）。
  2. 作者把话说满："…the little arrows of the fireflies are trying to align with each other... And this is exactly what the XY model describes!" "Just a change of interpretation, nothing more."（116、135 行）
  3. 给读者一个带滑块的模拟，萤火虫一只都不亮。
  4. 提问："Hum... why are they never flashing?"（145 行）
  5. 补上一项："Oops! We forgot to add in our equation that each little arrow now rotates continuously over time."（148 行）加上自转频率 ω 后再给一个模拟。
- **画面**：深蓝夜空里漂着几十只萤火虫，有 Interaction、Noise 两个滑块和一个 Arrows 勾选框。勾上 Arrows，每只萤火虫变成一个圆圈加一根箭头，箭头转到朝上时才闪。失败版本里所有箭头整齐朝右、静止不动；加上 ω 后箭头开始转，把 Interaction 拉满，大部分箭头一起转到朝上、一起闪。
- **难点**：XY 模型讲"对齐"，萤火虫讲"一起闪"，读者（包括作者自己在第 2 步的说法）很容易当成一回事。
- **比常规好在哪**：常规讲法直接写出 Kuramoto 方程，再解释 ω 是固有频率，读者不知道没有 ω 会怎样。这里读者先拖滑块看到失败，打开箭头看到"完全对齐却不闪"，ω 是为了修好这个画面才加进去的。同一个模拟可以在"萤火虫外观"和"模型箭头"之间切换，失败的原因一勾就看见。
- **注意**：失败是摆拍的。没有 ω 的版本把角度直接写成 0（`simulations/2_FirefliesSynchronisation.tsx:116-118` `if (!omegaActivated) { newThetaList[i] = 0; }`），所以在那个版本里拖滑块没有作用。真跑 XY 动力学，箭头会对齐到随机方向并抖动，同样几乎不闪，结论不变。我们借鉴时应该让失败版本真正跑模型。
- **证据**：
  - `simulations/2_FirefliesSynchronisation.tsx:125-132`：只有角度落在 3π/2 ± 0.1 时才闪。
  - 同文件 422、427–432 行：带滑块的版本默认耦合 0.3（不同步），开头的版本预设 1.5（同步）。
  - 截图：`complexity-fireflies-no-omega.jpg`（全部朝右，下方是提问）、`complexity-fireflies-omega.jpg`（加 ω 后拉满耦合）。

![没有 ω：箭头全部朝右，一只不闪](highlights/complexity-fireflies-no-omega.jpg)

### 磁化强度曲线的上下两支各配一个晶格小窗

- **哪一刻**：第一部分 "The crucial role of temperature" 的磁化强度随温度变化图（`text/Part1.tsx` 214–218 行）："Try clicking on the graph to see how the magnets internal structure changes…"
- **画面**：左边是总磁化强度对温度的曲线，低温段分成 M≈+1 和 M≈−1 上下两支，到临界温度合成 M=0 的一条线。图的右上角、右下角各有一个晶格小窗，分别对应上支和下支，窗里一根白色大箭头，长度是 |M|。鼠标移动时一条竖虚线跟着走，两个圆点落在上下两支上：低温时上窗几乎全红、箭头朝上，下窗几乎全蓝、箭头朝下；靠近临界点两个窗都变斑驳、箭头变短；过了临界点两个圆点合成一个，两个窗变成一样的红蓝噪点。
- **难点**："低温时 M 有两个可能的值，到底是哪个靠偶然选定；高温时只有一个"。只画 |M| 对 T 的曲线看不出这一点。
- **比常规好在哪**：常规是一张曲线图，旁边配"低温、临界、高温"三张快照，读者自己把快照和曲线上的点对应起来，而且通常只画一支。这里一根竖线同时驱动两个窗，窗的上下位置就是分支的上下位置，"两种磁铁在临界点变成同一种东西"不用术语就看得见。
- **注意**：正文说 "we will measure the total magnetization"，但曲线是手写的半椭圆（`simulations/1_IsingMagnetizationGraph.tsx:152-158`），窗里的晶格也只是按 M 的比例随机撒点，没有跑模拟。温度轴 0–2 也和前面模拟里 0–10 的滑块不是同一套刻度。我们借鉴时应该用真实模拟的数据。
- **证据**：
  - `simulations/1_IsingMagnetizationGraph.tsx:211-217` 画上下两支 `func(x, 1)`、`func(x, -1)`；238、276 行一个鼠标位置同时给出两支的值；302–314 行分别交给 `…-up`、`…-down` 两个窗。
  - `1_IsingMagnetizationGraph.module.css` 7–16、56–59 行：两个窗贴在右上角和右下角。
  - 截图：`complexity-ising-two-windows.jpg`，四格依次是 T≈0.3、0.8、1.1、1.7。

![温度扫过临界点时的两个小窗](highlights/complexity-ising-two-windows.jpg)

没有收的：开头提出"切成两半还是磁铁吗""加热后为什么失效"，零温模型之后用打勾清单验收，"Magnets stop working when hot." 打红叉。安排得好，但失败只在清单里说出来，零温模拟里没有温度可调，画面上看不见。
