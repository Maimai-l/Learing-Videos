# 交接说明

## 一、要避免的错误

1. **把用户没提的顾虑变成主题。** 任务难的时候，转去反复谈版权、合规这类容易说的话，会挤占任务本身，还在暗示用户动机不良。真实的风险说一次就够，不能因此改变任务方向。
2. **用容易拿到的材料代替最该看的材料。** 摘要、转写这类二手材料回答不了设计问题。动手前要先确定什么原始材料最能回答问题，再去拿来读；分析画面设计就要读动画源码、看画面。
3. **把具体发现抽象成空话。** 概括成通用原则看起来像洞见，其实没有信息。一句话换到别的对象上仍然成立，就该删掉。
4. **先定数量和格式，再往里填。** 这样只能硬凑，好的和平庸的混在一起。结论要从材料里来，没有就是没有。
5. **分不出好坏时，用最安全的说法代替判断。** 正确的做法是给出有依据的判断，或者说清楚还缺什么材料，然后去补。
6. **用自己的速记写标题和术语。** 没有上下文的读者要能一眼读懂。
7. **被批评时不去改被指出的那一点。** 辩解、找借口、转移到别的问题、反复请示，都是在回避。正确的做法是找准批评指的是什么，然后直接改。

## 二、未完成的任务

从 SoME 获奖作品的原始材料里，找出画面设计和教案设计的亮点，写成文档。

亮点的标准：
- 换一个作品就说不出来的才算；
- 少而精，没有亮点的作品不硬凑。

每条要说明：
- 哪一刻；
- 画面上是什么、怎么动；
- 解决了讲解中的什么难点；
- 为什么比常规画法好；
- 证据，即代码位置、截帧或原文。

之前的 `SoME精选.md` 已被否定，`references/` 下的现有内容也达不到这个标准。

## 三、材料

- **解锁图案**
  - manim 场景：<https://github.com/zyeworld/youtube/tree/main/2021/01_patterns>
  - 视频：<https://archive.org/download/youtube-PKjbBQ0PBCQ/PKjbBQ0PBCQ.mp4>
- **Clear Crystal Conundrums**：<https://github.com/explanaria/explanaria.github.io>，作品在 `docs/crystalgroups/src/`
- **Matrix Arcade**：<https://github.com/yizhe-ang/matrix-explorable>
- **How Computers Use Numbers**：<https://github.com/Mabi19/numbers>
- **The science of complexity**：<https://github.com/MecanicaScience/website> 的 `app/(core)/articles/(2025)/science_of_complexity/`
- **String Art**：<https://github.com/virtuallypassedsmartsparrow/StringArt>
- **Cayley Graphs**：<https://github.com/JuliaPoo/Cayley-Graph-Plotting>
- **计算器算对数**：<https://github.com/zachartrand/SoME-3>
- **Magic Windows**：<https://github.com/MattFerraro/causticsEngineering>
- **Relativity in Desmos**：`curl -H 'Accept: application/json' https://www.desmos.com/calculator/<id>`，id 见 `references/links.md`
- **视频文件**
  - Morphocular 分数阶导数：<https://archive.org/download/youtube-2dwQUUDt5Is/2dwQUUDt5Is.mp4>
  - The Lore of Calculus：<https://archive.org/download/youtube-5M2RWtD4EzI/5M2RWtD4EzI.mp4>
- 其他获奖视频的 B 站转载见 `references/links.md`。

**已从源码确认的一条（相对论 Desmos 图）**

- 网格、列车、隧道门全部经过同一个变换 `L(v)` 来画，拖动速度滑块，整幅时空图一起切换到另一个观察者的视角。
- 双曲线 `y²−x²=C²` 不经过 `L`，所以保持不动，网格在它们之间被挤压：不变量直接显示在画面上。
- 门的开关画成世界线上的一段虚线。另有一条可拖动的“同时”线，速度一变它就倾斜，跨过的开门区段随之改变，隧道悖论就落在这一处。
