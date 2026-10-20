# 文案参考

素材来自 3Blue1Brown 的数学科普比赛 Summer of Math Exposition（SoME）：Grant Sanderson 的评审标准和写作建议，
以及能读到全文的文字类获奖作品。引文都是原文短句，出处见文末。

## 评审标准

Grant 的四条标准，他说前两条最重要。

1. **动机**：前 30 秒就要让人知道为什么值得看。分两层：
   - 开头的钩子，用具体例子，不用空泛的承诺。他说自己犯过的错是开头 "over-philosophize"。
     好例子：飞机靠近时音调为什么慢慢变低（先指出多普勒效应解释不了）；看似不可能的十个囚犯猜帽子。
   - 每个新概念出场都要有理由。好例子：讲阶乘推广，不直接给 Gamma 函数，先列出推广版必须满足的性质再推出来；
     先给一个幼稚但有缺陷的方案，再一步步改进。
2. **清晰**："The best hook in the world is wasted if the lesson which follows is confusing."
   清晰的作品始终把一两个例子放在中间，先让观众把玩例子，再给一般规律。配乐如果有，要退到背景里。
3. **新意**：风格上找到自己的样子；更重要的是内容在别处很难找到。
4. **好记**：几个月后还记得。他承认这一条很主观。

另外两点：好作品是对特定观众来说的好作品，不存在面向所有人的好讲解；
2025 年起他还问"如果我教这门课，有多想发给学生看"。

## 写作建议

都出自 Grant 本人（SoME1 开赛视频、2023 年演讲《Math's pedagogical curse》、访谈）。

- **先具体后抽象。** 先蛋糕后分数，先公司利润再抽象函数。他承认自己每份初稿都会违反这条，
  因为懂了的人习惯从抽象往下想。
- **每个定义都要有引出它的例子**，并说明为什么这样定义、还可能怎样定义，让观众觉得是自己发现的。
- **课从一个问题开始。** 例：先让学生分解 35、143、3599，再给平方差公式；抽象只是把已经存在的规律说出来。
- **先让人试，再讲。** 引用"productive failure"研究：先尝试解题再听讲解，理解更深。
- **该画的都画出来**，画图常常也给作者自己带来新直觉。
- **听起来像一个真人在说话**，带一点情绪和个性。
- **在选题上多花时间。** 实际上选题只占百分之一的时间，应该多得多。新手选更小众、更具体的题目。
- **先定体裁**：权威讲解、边学边探、习题讲解、演示激发兴趣。讲解型要懂的比说出来的多十倍。
  他早期的教训是语速太快。
- **篇幅不是敌人**，只要不啰嗦；为了能让人重新推出来，宁可长一点。
- **编程动画只在真正需要时用**，不为炫而炫；声音质量比画面更要紧。
- 好讲解难，是因为"懂了以后很难记起不懂时的感受"。

## 获奖作品的写法

### Magic Windows（SoME1 获奖，Matt Ferraro）

- **开头**：一块透明亚克力，手电一照投出一幅画。第一句："I recently made a physical object that defies all intuition."
- **结构**：实物奇观，认识现象，最简单的情形，三步解法，制作，坦白代码的毛病，结尾彩蛋。
- **可借鉴**：
  - 先拍实物制造"这不可能"，再进原理。
  - 中途保留一次走错的路：梯度法失败，只写一个词 "Crap."，再说为什么错。
  - 公式出来马上翻成人话；第二次碰到同一个方程时问"认得吗"。
  - 一只猫的照片从头用到尾。

### Clear Crystal Conundrums（SoME2 获奖，Explanaria，交互幻灯片）

- **开头**：两块矿石，原子种类和比例完全一样，只是排列不同。怎么描述这种不同？
- **结构**：复杂的真实对象引出问题（晶体），最小例子练手（三角形），回到真实对象揭晓答案。
- **可借鉴**：
  - 一屏一句话，一句话对应一次画面变化，关键词的颜色和图里对应物体同色。这就是代码动画视频的分镜写法。
  - 先让读者亲手做，再命名：对称群、凯莱图都是做过之后才给名字。
  - 故意让读者失败：只用两个旋转搭图，搭不全，引出子群。
  - 给口语记忆句：群就是"能组合、能撤销的东西"。

### Functions are Vectors（SoME3 荣誉提名，Max Slater）

- **开头**：从读者熟悉的说法起步，"向量通常被介绍成一列数"。
- **结构**：每节先复习有限维，再推广到函数；最后揭晓傅里叶变换就是换一组基。
- **可借鉴**：
  - 固定的转场：还记得……吗？现在把它换成函数。
  - 公式记号和图并排同步变化，让人看到同一个东西的两种写法。
  - 开头就说清楚严谨到什么程度，不证明的就明说。

### Matrix Arcade（SoME3 荣誉提名，Yi Zhe Ang，滚动交互）

- **开头**："What do matrices mean to you?" 接着说出学校里背公式、机械计算的痛点，再承诺换个角度。
- **结构**：一个算例，基向量，"注意到相似之处了吗"，核心结论，从一个向量扩到整片网格，自由操作，推广到三维。
- **可借鉴**：
  - 同一组数字用到底。
  - 核心结论出现时明确说"这就是关键"，不让它淹没在推导里。
  - 文字推进一句，画面变换一次。

### Cayley Graphs and Pretty Things（SoME3 荣誉提名，JuliaPoo）

- **开头**：做了个小工具画 6000 多个群的凯莱图，"因为它们好看"。
- **可借鉴**：
  - 先放两张只差箭头方向的图让人找不同，再从这个不同推出半直积的定义。
  - 推导时先写出必须满足的约束，问"看着眼熟吗"，再给名字（同态）。
  - 弱项：结尾很突然，没有收束。

### 计算器怎么算对数（SoME3 荣誉提名，zachartrand）

- **开头**：按下等号答案就出来了，怎么知道它是对的？高中老师也只是挥挥手。
- **可借鉴**：
  - 从"按钮背后发生了什么"切入，天然有悬念。
  - 中段安排一次假结局：收敛范围太窄，"算了，收拾回家吧"，下一段立刻反转。
  - 用数值表格让收敛看得见：每多一项，多一位准确数字。
  - 开头和结尾都是同一个好奇的学生。

## 共同的写法

1. 从具体物件或日常疑问开场，不从定义开场。
2. 故意走一次死路，再转向正确方法。
3. 先让人看到或做到，再给名字。
4. 替观众把疑问说出来。
5. 一个例子用到底。
6. 说清楚讲到哪里、跳过什么；结尾回到开头。
7. 文字直接告诉人看图的哪里，不让图自己说话。

## 获奖名单

全部参赛作品见 <https://some.3b1b.co/archive>。

**SoME1（2021）**

- That weird light at the bottom of a mug, ENVELOPES（Paralogical）<https://youtu.be/fJWnA4j0_ho>
- Hiding Images in Plain Sight: The Physics Of Magic Windows（Matt Ferraro，文章）<https://mattferraro.dev/posts/caustics-engineering>
- The Beauty of Bézier Curves（Freya Holmér）<https://youtu.be/aVwxzDHniEw>
- What Is The Most Complicated Lock Pattern?（Dr. Zye）<https://youtu.be/PKjbBQ0PBCQ>
- Pick's theorem: The wrong, amazing proof（spacematt）<https://youtu.be/uh-yRNqLpOg>

**SoME2（2022）**

- Clear Crystal Conundrums（Explanaria，交互）<https://explanaria.github.io/crystalgroups/>
- The Lore of Calculus（A Well-Rested Dog）<https://youtu.be/5M2RWtD4EzI>
- How Realistic CGI Works（Josh's Channel）<https://www.youtube.com/watch?v=gsZiJeaMO48>
- Percolation: a Mathematical Phase Transition（Spectral Collective）<https://youtu.be/a-767WnbaCQ>
- The Coolest Hat Puzzle（Going Null）<https://youtu.be/6hVPNONm7xw>

**SoME3（2023）**

- The Mathematics of String Art（Virtually Passed）<https://youtube.com/watch?v=WGccIFf6MF8>
- Minimal Surfaces & the Calculus of Variations（Dr. Trefor Bazett）<https://youtube.com/watch?v=8SABptOYUVk>
- Pixel Art Anti-Aliasing（t3ssel8r）<https://youtube.com/watch?v=d6tp43wZqps>
- Rethinking the real line（Proof of Concept）<https://youtube.com/watch?v=uFWJuZQLKJs>
- How Computers Use Numbers（文章）<https://mabi.land/numbers/>

**2024** 社区自办，不评奖，只有同行评审排名。

**SoME4（2025）** 改为奖励对老师有用的作品：

- The fight over fairness that revolutionized math（Chalk Talk）<https://youtu.be/_YRfSe-f1FE>
- Relativity in Desmos（Mr Happy Face）<https://youtu.be/ccoBbOTf31k>
- A trick for analyzing cubics（Dr PK Math）<https://youtu.be/mqdCKLipDiI>
- The world's oldest algorithm（Eric Rowland）<https://youtu.be/6OgDTCG1QCU>
- The science of complexity（文章）<https://www.mecanicascience.fr/articles/science_of_complexity>

**SoME5（2026）** 同行评审中，还没有公布获奖。

## 没有覆盖的

- **视频类获奖作品的文案。** YouTube 拒绝这台云端机器访问，拿不到字幕。把字幕文件放进 `references/` 后可以补上分析。
- **How Computers Use Numbers 和 The science of complexity。** 两个网站从这里都打不开。

## 出处

- Grant 本人视频的字幕全文：<https://github.com/3b1b/captions>（`2021/some1`、`2021/some1-results`、
  `2022/some2-results`、`2023/some3-results`、`2023/maths-pedagogical-curse`）
- 评审规则：<https://some.3b1b.co/rules>，<https://www.3blue1brown.com/blog/some1>
- 各届结果：<https://www.3blue1brown.com/blog/some1-results>，<https://www.3blue1brown.com/blog/some2>，
  <https://3blue1brown.substack.com/p/some3-results>，<https://3blue1brown.substack.com/p/some4-prizes>
- 演讲：<https://www.3blue1brown.com/lessons/pedagogical-curse>
- 访谈：<https://www.dwarkesh.com/p/grant-sanderson>
