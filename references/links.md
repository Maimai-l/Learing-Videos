# 获奖作品的文案和教案链接

SoME 各届获奖作品，作者公开的文稿、字幕、讲义、演示文件和中文版本。核对日期 2026-10-21，没打开验证过的会注明。
写作手法的分析见 `writing.md`，动画源码见 `animation/`。

## 怎么拿到文字

YouTube 从云端机器访问会被要求登录，下面这些办法可以绕开：

- **转写全文**：`https://ytscribe.com/v/<视频ID>`，curl 直接拿到，页面里还嵌着原视频简介。没缓存的视频要付费。
- **字幕和简介**：archive.org 的镜像，`https://archive.org/metadata/youtube-<ID>` 列出文件，
  `https://archive.org/download/youtube-<ID>/<ID>.en.vtt`、`<ID>.description` 下载。
- **视频简介和章节**：POST `https://www.youtube.com/youtubei/v1/next`，
  body `{"videoId":"<ID>","context":{"client":{"clientName":"WEB","clientVersion":"2.20251015.01.00","hl":"en"}}}`，
  返回里的 `attributedDescription.content` 是完整简介。
- **标题和作者**：`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<ID>`。
- **B 站转载的简介**：curl 视频页，解析 `__INITIAL_STATE__` 里的 `videoData.desc`；转载常照抄原简介，中配版常有中文摘要。
  搜索：先 GET `https://www.bilibili.com` 拿 cookie，再请求
  `https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=<关键词>`。字幕要登录。
- **Desmos 文件的全部表达式**：curl 时加 `-H 'Accept: application/json'`。
- **Patreon 公开帖正文**：`https://www.patreon.com/api/posts/<ID>` 的 `content_json_string`。

## SoME1（2021）

### That weird light at the bottom of a mug, ENVELOPES（Paralogical）

- 文案：作者项目页，只嵌了视频 <https://paralogical.dev/envelopes>；转写未找到
- 教案：未找到
- 中文：未找到

### Hiding Images in Plain Sight: The Physics Of Magic Windows（Matt Ferraro）

- 文案：作品就是长文 <https://mattferraro.dev/posts/caustics-engineering>；
  配套长文：泊松方程怎么解 <https://mattferraro.dev/posts/poissons-equation>，CNC 加工 <https://mattferraro.dev/posts/cnc-router>；
  作者在 HN 上答疑 <https://news.ycombinator.com/item?id=28283411>
- 教案：Julia 源码 <https://github.com/MattFerraro/causticsEngineering>；
  文中引用的论文 <http://nishitalab.org/user/egaku/tog14/yue-continuous-caustics-lens.pdf>
- 中文：未找到；相关的有 Steve Mould 讲焦散透镜的官方双语视频 <https://www.bilibili.com/video/BV1K94y1z7GS>

### The Beauty of Bézier Curves（Freya Holmér）

- 文案：英文转写全文 <https://ytscribe.com/v/aVwxzDHniEw>（章节表在页内简介里）；
  作者做视频前的推特长串 <https://threadreaderapp.com/thread/1063633408411295744.html>；
  同内容 Medium 版 <https://acegikmo.medium.com/the-ever-so-lovely-b%C3%A9zier-curve-eb27514da3bf>（未能打开）
- 教案：作者的交互演示，可以拖控制点、看每一层插值 <https://acegikmo.com/bezier/>；
  作者的数学库，`Runtime/Splines` 下有实现 <https://github.com/FreyaHolmer/Mathfs>；
  简介致谢的参考资料 <https://pomax.github.io/bezierinfo/>，有官方中文版 <https://pomax.github.io/bezierinfo/zh-CN/>
- 中文：B 站转载，带简体中文字幕轨 <https://www.bilibili.com/video/BV1m44y1y7bC>；
  中英字幕转载，简介是原简介全文 <https://www.bilibili.com/video/BV1tqhYe1Eo6>

### What Is The Most Complicated Lock Pattern?（Dr. Zye）

- 文案：英文字幕全文 <https://archive.org/download/youtube-PKjbBQ0PBCQ/PKjbBQ0PBCQ.en.vtt>（同目录有韩文字幕）；
  原简介，含参考资料和章节 <https://archive.org/download/youtube-PKjbBQ0PBCQ/PKjbBQ0PBCQ.description>
- 教案：作者的推导文档（找出 3×3 格子里全部最复杂图案，英文和韩文 PDF）
  <https://drive.google.com/drive/folders/1oHTxjipJ-VdSXGqzaZXxvgR7LRXxRlHi>（文件名已核对，PDF 没下载）；
  计数代码和按章节分的 manim 场景 <https://github.com/zyeworld/youtube/tree/main/2021/01_patterns>
- 中文：中配版，简介有中文逐章时间线和每章摘要，可以当中文提纲 <https://www.bilibili.com/video/BV1VLW2zAEDM>；
  另一个中配版 <https://www.bilibili.com/video/BV1g2je6oEcr>；原声转载 <https://www.bilibili.com/video/BV12KBVBgEE8>

### Pick's theorem: The wrong, amazing proof（spacematt）

- 文案：转写未找到
- 教案：未找到
- 中文：转载《Pick定理：错误的、惊人的证明!》<https://www.bilibili.com/video/BV1cL4y1z7wo>（字幕情况未核对）

## SoME2（2022）

### Clear Crystal Conundrums（Explanaria，交互网页）

- 文案：作品本身 <https://explanaria.github.io/crystalgroups/>；逐页原文在 Svelte 源码里，每个 `exp-slide` 是一页，
  目录 <https://github.com/explanaria/explanaria.github.io/tree/master/docs/crystalgroups/src/chapters>，
  纯文本例：<https://raw.githubusercontent.com/explanaria/explanaria.github.io/master/docs/crystalgroups/src/chapters/1-CrystalIntroPart.svelte>
- 教案：D6 群交互页 <https://explanaria.github.io/crystalgroups/d6group.html>；
  引擎的设计说明（本仓库 `animation/explanaria/` 也有一份）
  <https://raw.githubusercontent.com/explanaria/explanaria.github.io/master/DOCUMENTATION_AND_PHILOSOPHY.md>
- 中文：未找到

### The Lore of Calculus（A Well-Rested Dog）

现标题 "This Is the Calculus They Won't Teach You"。

- 文案：英文转写全文 <https://ytscribe.com/v/5M2RWtD4EzI>；
  原简介，含章节和作者自己的勘误清单 <https://archive.org/download/youtube-5M2RWtD4EzI/5M2RWtD4EzI.description>
- 教案：作者的延伸阅读文档，按微积分史、无穷、微积分该怎么教分类，每本附推荐理由，叙事顺序参照 Bressoud《Calculus Reordered》
  <https://docs.google.com/document/d/1K-QuzMCWtl0f5E17_fhE128vl-gJcW5RB3ANVy-pCMA/edit>（纯文本：把 `/edit` 换成 `/export?format=txt`）
- 中文：机翻双语 <https://www.bilibili.com/video/BV13r421W7gz>；中文简介转载 <https://www.bilibili.com/video/BV1Jz421o7CT>

### How Realistic CGI Works (And How To Do It Way Faster)（Josh's Channel）

现标题 "How Ray Tracing (Modern CGI) Works And How To Do It 600x Faster"。

- 文案：英文转写全文，简介也在页内 <https://ytscribe.com/v/gsZiJeaMO48>
- 教案：简介列出的论文：RIS <https://diglib.eg.org/bitstream/handle/10.2312/EGWR.EGSR05.139-146/139-146.pdf?sequence=1&isAllowed=y>，
  ReSTIR <https://cdn.pharr.org/ReSTIR.pdf>，ReSTIR GI <https://d1qx31qr3h6wln.cloudfront.net/publications/ReSTIR%20GI.pdf>
- 中文：中配版，简介是一大段中文内容摘要 <https://www.bilibili.com/video/BV1YFWBzgE2c>；
  机翻版，带简体中文字幕轨 <https://www.bilibili.com/video/BV1FP4y1S7jn>

### Percolation: a Mathematical Phase Transition（Spectral Collective）

- 文案：原简介全文的镜像，含分工和几处时间点的学术注释、参考文献
  <https://dynasnet.renyi.hu/articles/spectral-collective-percolation-mathematical-phase-transition>；转写未找到
- 教案：上面那页的参考文献
- 中文：中配版 <https://www.bilibili.com/video/BV1eHz7BzEmW>；UP 主自翻字幕版 <https://www.bilibili.com/video/BV1de4y1x7Yi>

### The Coolest Hat Puzzle（Going Null）

- 文案：英文转写全文 <https://ytscribe.com/v/6hVPNONm7xw>
- 教案：未找到
- 中文：未找到

## SoME3（2023）

### The Mathematics of String Art（Virtually Passed）

- 文案：视频简介有章节（问题、图像模型、线条模型、Ax = b、伪逆、约束最小化、贪心算法、另一种方法）
  <https://youtube.com/watch?v=WGccIFf6MF8>；作者介绍页，讲 MATLAB 算法转 g-code 交给绕线机
  <https://sites.google.com/view/virtuallypassed/about>
- 教案：作者的 MATLAB 源码，圆形和矩形画布、黑白和彩色四个脚本，附示意图
  <https://github.com/virtuallypassedsmartsparrow/StringArt>
- 中文：原片搬运 <https://www.bilibili.com/video/BV1T14y1X7bj>（字幕情况未核对）

### Minimal Surfaces & the Calculus of Variations（Dr. Trefor Bazett）

现标题 "The Math of Bubbles // Minimal Surfaces & the Calculus of Variations"。

- 文案：视频简介有章节和摘要（悬链面面积写成泛函，推 Euler-Lagrange 方程，解出 f(x)）
  <https://youtube.com/watch?v=8SABptOYUVk>；同题讲座摘要 <https://www.ulethbridge.ca/notice/node/13816>
- 教案：未找到这期的讲义；作者的整套课程播放列表 <https://www.youtube.com/@DrTrefor/playlists>
- 中文：AI 中文配音版《气泡的数学奥秘 极小曲面与变分法精解》<https://www.bilibili.com/video/BV1MeUEBXETT>

### Pixel Art Anti-Aliasing（t3ssel8r）

现标题 "Crafting a Better Shader for Pixel Art Upscaling"。

- 文案：视频简介有章节 <https://youtube.com/watch?v=d6tp43wZqps>；
  作者免费公开的视频补充笔记，其中坦白 smoothstep 那段是叙事技巧，先有结论后补解释
  <https://www.patreon.com/posts/83276362>（正文读法见开头）
- 教案：作者的预乘 alpha 脚本 <https://gist.github.com/t3ssel8r/bae7362e9a055c51f08ba762e232eeba>；
  视频引用的博客 <https://colececil.dev/blog/2017/scaling-pixel-art-without-destroying-it/>；完整 shader 未公开
- 中文：AI 中文配音版 <https://www.bilibili.com/video/BV1vM4m1k7SS>

### Rethinking the real line（Proof of Concept，Katherine Stange）

- 文案：视频简介写明数学内容来自 Caroline Series 的文章 <https://doi.org/10.1007/BF03025802>，
  工具是 Sage、Manim、VPython、p5.js <https://youtube.com/watch?v=uFWJuZQLKJs>；
  作者同主题的文字版 <https://proofofconceptmath.substack.com/p/how-to-organize-your-rational-numbers>
- 教案：作者的 Farey 镶嵌交互页 <https://katestange.net/farey-lattice/>；
  初等数论可视化页（含 GeoGebra 笔记本）<https://katestange.net/illustration/elementary-number-theory/>；
  作者的教学资料页 <https://katestange.net/for-teachers/>
- 中文：未找到

### How Computers Use Numbers（Mabi19，文章）

- 文案：作品 <https://mabi.land/numbers/>；全文 HTML <https://raw.githubusercontent.com/Mabi19/numbers/main/content.html>
- 教案：逐位演示组件（整数、加法、定点数、浮点数、内存）<https://github.com/Mabi19/numbers> 的 `components/`；
  文中引用的工具 <https://float.exposed>、<https://0.30000000000000004.com/>
- 中文：未找到

## SoME4（2025）教师奖

### The fight over fairness that revolutionized math（Chalk Talk，Kelsey Houston-Edwards）

现标题 "The fairness puzzle that sparked probability"。

- 文案：视频简介有章节和四本参考书 <https://youtu.be/_YRfSe-f1FE>；
  SoME 条目页，有同行评审意见，包括老师视角的建议 <https://some.3b1b.co/entries/6ed691c3-cfef-49c9-b1ed-2adf66536c0b>
- 教案：作者没有公开讲义；可配合的原始史料，费马与帕斯卡通信英译 <https://www.york.ac.uk/depts/maths/histstat/pascal.pdf>
- 中文：未找到

### Relativity in Desmos（Mr Happy Face）

- 文案：视频简介有章节和全部 Desmos 链接 <https://youtu.be/ccoBbOTf31k>；
  SoME 条目页，有评审建议 <https://some.3b1b.co/entries/c46f3c19-f1e2-402e-af55-8b4b61c508b3>
- 教案：七个 Desmos 文件，就是课堂演示本身：
  洛伦兹变换 <https://www.desmos.com/calculator/xa6ytgjqtp>，
  旋转变换 <https://www.desmos.com/calculator/bfn16xvrs9>，
  隧道悖论 <https://www.desmos.com/calculator/khvga9rool>，
  谷仓悖论 <https://www.desmos.com/calculator/farprypcea>，
  三维洛伦兹变换 <https://www.desmos.com/3d/zp6wgriorw>，
  光行差 <https://www.desmos.com/3d/ouj1bwauoo>，
  伽利略光行差 <https://www.desmos.com/3d/1xpcvjooj7>
- 中文：未找到

### A trick for analyzing cubics（Dr PK Math）

现标题 "One of the Most Powerful Math Techniques No One Knows Who Invented It"。

- 文案：视频简介很短 <https://youtu.be/mqdCKLipDiI>；SoME 条目页信息更多，有作者自述、高中老师的评语和补充建议
  <https://some.3b1b.co/entries/e55b9384-641c-4709-8aef-3447c8d25e80>
- 教案：未找到
- 中文：未找到

### The world's oldest algorithm（Eric Rowland）

现标题 "The Ancient Secret Behind Prime Factorization"。

- 文案：视频简介有章节 <https://youtu.be/6OgDTCG1QCU>；SoME 条目页，作者说明为什么要讲：
  教科书里的欧几里得算法总是凭空出现 <https://some.3b1b.co/entries/d4dd701c-240a-48d3-ac87-cbba560afee5>；
  作者的数学写作原则（不是这期的文稿）<https://ericrowland.github.io/papers/Writing_mathematics_effectively.pdf>
- 教案：未找到这期的讲义
- 中文：未找到（B 站有一个同题的中配视频，核对后不是这一期）

### The science of complexity（MecanicaScience，文章）

原网站已关闭，现在的地址：

- 文案：作品 <https://www.explorablescience.com/articles/science_of_complexity>；
  正文源文件（导言、三部分、结语）在 <https://github.com/MecanicaScience/website> 的
  `app/(core)/articles/(2025)/science_of_complexity/text/`（默认分支 master）；
  SoME 条目页 <https://some.3b1b.co/entries/b8300cb6-9de1-44d4-ac2a-fd1ca5b20819>
- 教案：文中自带 10 处提问和 7 处“戴上理论家的帽子”，按建模、失败、修正推进；
  同目录 `simulations/` 里的模拟可以单独拿出来用；独立的伊辛模型模拟页
  <https://www.explorablescience.com/simulations/2022-modele_ising>
- 中文：未找到
