## 弦艺术的数学（Virtually Passed，The Mathematics of String Art，SoME3 视频）

一根黑线绕圆周上的钉子，怎样选线才能拼出一张灰度图。路线：像素化，写成 Ax=b，用伪逆求解，结果失败，诊断出两个原因（线的模型太粗糙；x 只能取 0 或 1），最后改用贪心算法。

读了：视频（YouTube `WGccIFf6MF8`，archive.org 没有镜像，从 B 站转载 BV1T14y1X7bj 取的 480p 流；没有字幕，下面引的英文是机器转写），全片每 5 秒一帧，2:48–4:48 每秒一帧，6:25–9:20 每 1.5–2 秒一帧；作者的 MATLAB 源码。注意源码实现的不是视频里的方法：它先做 Radon 变换，再在 Radon 平面上逐根减线，没有构造 A，也不求伪逆，对应视频结尾说的 "a completely different method"。所以下面的画面分析只能靠帧。

### 先在图片上写加法式，再把所有图片同时拉直成列，拼成矩阵 A

- **哪一刻**：2:50–4:59，之后的 5:00–8:30 一直沿用。
- **画面**：
  1. 一块约 8×8、外轮廓近似圆形的像素画布，目标图是个笑脸。每根候选线单独画成一张同尺寸的小像素图，线经过的格子涂黑。
  2. 小图之间出现"×1 +""×1 +""×0 + … ="，最右边是笑脸。之后 ×1、×0 换成黄色的 x₁、x₂、x₃。
  3. 只留下笑脸，它的各行像素错开、首尾相接，变成一根竖条。
  4. 加法式回到画面，所有小图**同时**做同样的拆解，变成几根竖条，中间的 x₁ +、x₂ + … = 留在原位。
  5. 竖条上方标出蓝色的 a⃗₁、a⃗₂、a⃗₃，目标列标绿色的 b⃗。竖条淡出，a⃗ 收进一对蓝色方括号，x 滑进一对黄色方括号，最后蓝括号里只剩一个 A。
  6. 之后颜色不变：A 蓝、x 黄、b 绿。8:30 伪逆给出 x = [12, 3.1, −6.3, 1.1, 0.2]，黄色箭头指着 −6.3。
- **难点**：对不熟线性代数的观众，"把图像拉直成向量""A 的第 j 列是第 j 根线"完全抽象：A 里装的是什么？为什么要把二维图拉成一维？
- **比常规好在哪**：常规讲法直接写"b = vec(I)，线 j 经过像素 i 时 A_ij = 1"，最多再画一个抽象的稀疏矩阵。这里先在图片层面写出加法式，那时还没有任何向量；再让所有图片同时被同一种方式拆开，观众看到的是"每一项做了同一个操作，所以等式仍然成立"，拉直就有了理由。开头用 ×1、×0 把 x 定义成"画不画这根线"的开关，到 8:30 伪逆给出 −6.3 时不用解释就知道错了（旁白："There's no way I can possibly draw negative 6.3 lines"）。
- **证据**：截帧 `stringart-ax-b.jpg`，自上而下 3:15、3:47、3:59、4:25、4:40、4:47。旁白 3:54："we can do this trick for all lines and the image pixels." 4:36："All the vectors a1, a2, a3, etc. will go in this matrix I'll call capital A."

![从加法式到 Ax=b](highlights/stringart-ax-b.jpg)

### 同一块玩具画布贯穿全片："线该有多黑"从截面形状拉成山脊曲面，再采样回这块画布

- **哪一刻**：6:15–8:12；贪心算法 9:00–9:36 回到同一块画布。
- **画面**：
  1. 6:15 伪逆的结果做成真实的弦艺术，是一团看不出形状的灰线。
  2. 6:30 回到那块带红色圆边和白色钉子的玩具画布。斜线穿过时，碰到的格子都涂黑，成了两三格宽的阶梯带；换成水平线只黑一行。两张一比，斜线被画得更黑。
  3. 7:05 换成截面图：横轴是离线中心的距离，纵轴是黑度。当前模型是蓝色方波，两侧标 "white"。方波先压低（远看一根黑线只是浅灰），再试半圆、三角，最后选定梯形。
  4. 7:55 梯形截面沿线方向拉开，成为一张隆起一道山脊的曲面。
  5. 8:05 按像素网格采样，回到玩具画布：斜线经过的格子变成深浅不同的灰。
  6. 9:00 贪心算法也在这块画布上演示：候选线从一颗钉子扫过其余钉子，选中一根，下一轮从它的另一端出发。
- **难点**："伪逆的结果为什么一团糟"可以有很多原因；"线该用什么截面"本是个调参细节，很难讲得有意思。
- **比常规好在哪**：常规讲法说一句"改用抗锯齿"，或展示一张模糊处理过的线，观众不知道问题出在哪、改了什么。这里先用观众三分钟前见过的同一块画布让缺陷暴露（斜线对水平线），再分两层修：一维截面管"中心多黑、边缘怎么衰减"，二维曲面采样回像素管"斜线不该比水平线黑"，每一步画面只改一个量。修好后仍回到同一块画布，前后两张可以直接比较。
- **证据**：截帧 `stringart-line-model.jpg`，上排 6:38、6:48、7:20、7:52，下排 7:58、8:08、8:30、9:14。旁白 6:42："we're artificially making slanted lines darker than horizontal or vertical lines." 源码里的梯形截面：`Circular_String_Art_BlackWhite_Nail_List.m` 24–27 行（`d = 0.036`、`tstart = 0.0014`、`tend = 0.0161`），216–226 行在 tstart 到 tend 之间按 `(tend-t(i))/(tend-tstart)` 线性衰减。

![同一块画布上的线模型](highlights/stringart-line-model.jpg)

## 藏在平板里的图像（Matt Ferraro，Hiding Images in Plain Sight: The Physics Of Magic Windows，SoME1 长文）

一块看上去平整的亚克力，阳光照过去投出一只猫。文章讲怎样从目标图算出表面高度：先把透镜面上的网格变形，让每个格子的面积正比于对应像素的亮度；再用折射定律求法向；最后解泊松方程，从法向积分出高度。

读了：原文和文中全部图片、动图；Julia 源码 `causticsEngineering/src/create_mesh.jl`。

### "光往哪去"改写成"每个格子多大"，再把变形后的网格本身渲染出来：网格就是那只猫

- **哪一刻**："Formulating the Problem" 一节的示意图，"Computing the Loss" 的式 (1.0)，"Stepping to Reduce Loss" 末尾的四张网格图。
- **画面**：
  1. 示意图：左边三根标 "Sunlight" 的箭头，中间是标 "Magic Window" 的弯曲网格，右边是画着简笔猫的方格网。"Grid cell (i, j)" 标注分出两根箭头，一根指透镜面上变形的格子，一根指像面上编号相同的方格。
  2. 式 (1.0) 配一句大白话："If a single pixel contributes x% of the brightness of the entire image, the corresponding window cell should take up x% of the area of the entire window."
  3. 迭代后的透镜网格在 Fusion360 里的线框渲染：只有网格线，底上浮现出整只猫，连胡须都在。
  4. 放大到眼睛，再放大到瞳孔，能数清一个个被挤扁、撑开的四边形格子。
- **难点**："弯曲的表面怎么把光挪到指定位置"本是三维光学问题，读者会卡在追踪每条光线去哪。
- **比常规好在哪**：常规讲焦散用光线图，文章前面也有一张：平行光进凸透镜会聚到一点。光线图只能讲"会聚就亮"，对几十万像素的图无能为力，也看不出每处该收多少光。示意图用同一个 (i, j) 编号把两边的格子绑在一起，"光往哪去"变成"每个格子多大"，第一步成了纯平面几何，折射定律推到下一节。网格渲染图验证了这个改写：不做任何光学计算，只靠网格线的疏密，网格本身已经是那张图（"The reason it is darker in some areas is because the mesh is more tightly packed in those areas."）。从整只猫到瞳孔的三级放大，把读者认出的图像和单个格子这个机制连起来。
- **证据**：
  - 原文："Step 1: We morph the cells on the lens, making them bigger or smaller, so that the area of lens cell (i, j) is proportional to the brightness of image cell (i, j)."
  - `create_mesh.jl:469-470` `LJ = getPixelArea(meshy)`、`D = Float64.(LJ - img)`：损失就是面积减亮度。519 行（已注释）`# saveObj!(meshy, "./examples/mesh_$(suffix).obj", flipxy=true)` 把变形网格导出，Fusion360 截图由此而来。
  - 图：`caustics-mesh-cat.jpg`（原图和网格渲染并排）、`caustics-mesh-zoom.jpg`（眼睛和瞳孔）。

![变形后的网格渲染出来就是猫](highlights/caustics-mesh-cat.jpg)
![放大到瞳孔：每个格子的大小](highlights/caustics-mesh-zoom.jpg)

### 先画出"直接沿梯度走"是一团乱箭头，再换成泊松方程解出的平滑速度场

- **哪一刻**："Stepping to Reduce Loss" 一节：∇L 的箭头图，紧接一句 "Crap."；流体类比；−∇Φ 的箭头图。
- **画面**：两张同尺寸、同画法的箭头图。∇L 每隔 10 像素一个箭头，相邻箭头方向乱跳，整片是锯齿状的乱线。−∇Φ 的箭头方向平滑渐变，边界上沿边走、不穿出边框。最后一张把猫和 −∇Φ 并排："If you squint you can almost see how the bright background will expand and the cat's dark fur will shrink."
- **难点**：学过梯度下降的读者自然会问"为什么不直接沿梯度挪点"，泊松方程看起来绕了一大圈。
- **比常规好在哪**：原论文和一般讲解直接给出泊松方程。这里先把走不通的路画出来：相邻点要往相反方向走（"improving one cell's loss will necessarily worsen its neighbor's losses"），一眼就知道不行，"光压"类比和 ∇²Φ = L 才有了动机。读者的疑问由画面回答，不靠权威。
- **证据**：原文："∇L is a very poorly behaved vector field. It is noisy, discontinuous, and in many places equal to zero." "None of the arrows pierce the boundary." `create_mesh.jl:479-481` 作者为文章专门留下了画 ∇L 的代码：`# These lines are just for plotting the quiver of L, which I needed for the blog post`。图：`caustics-gradients.jpg`（左 ∇L，右 −∇Φ）。

![左：直接沿梯度走；右：泊松方程解出的速度场](highlights/caustics-gradients.jpg)

## 计算器怎么算对数（Zach Chartrand，SoME3 荣誉提名文章）

没有达到标准的亮点。把几何级数逐项积分得到 ln(1+x) 的级数，用对数性质把输入缩到 1 附近，再用 ln((1+x)/(1−x)) 的级数加速。全文只有 4 张静态截图和几个带滑块的 Desmos 图，都是常规的"部分和随项数逼近函数"。计算器的算法步骤（缩小输入、拆出指数、Horner 求值）只出现在文字例子和 Python 脚本里，没有画出来。读了仓库 `zachartrand/SoME-3` 全部文件和三个 Desmos 图的表达式；这件作品没有视频。

最接近的一处：Desmos 图 zr1vhmoign 里，N=3 时普通级数在 x>2 后直冲上去，加速版仍贴着 ln x，因为 (x−1)/(x+1) 把所有正数压进了 (−1, 1)。正文只用一句括号话带过（"Also, notice the difference in the radius of convergence."）。
