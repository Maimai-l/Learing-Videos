# 小样

把 `../animation/` 里的亮点做法用我们自己的写法各做一节，放在同一个 48 秒的“视频”里，四个章节。
每一帧都由 `render(ctx, t)` 画出，只由 `t` 决定，所以拖动进度条、倒退、变速、进度条预览都能对上。

打开：在仓库根目录运行 `python3 -m http.server`，打开 `/references/samples/`。

| 章节 | 做法 | 出处 | 代码位置（`samples.js`） |
|---|---|---|---|
| 函数变形 | 两个映射之间逐点插值，每个点按位置错开起步，网格从左到右流向新形状 | `animation/explanaria` 的 `TransitionTo` 和 `staggerFraction` | `staggered`、`morphPoint` |
| 矩阵变换 | 矩阵四个数逐个线性插值，进度就是变换程度；残影是把前几刻的位置再画一遍，不需要上一帧的状态 | `animation/matrix-arcade` 的矩阵补间和 `AfterimagePass` | `matrixAt`、`sceneMatrix` |
| 光波干涉 | WebGL 片元着色器逐像素叠加两个波源，按需要的像素尺寸渲染，再 `drawImage` 回 2D 画布；先看瞬时波，再过渡到强度 | `animation/3b1b-diffraction` 的 `diffraction.wgsl` | `FRAG`、`sceneWaves` |
| 萤火虫同步 | Kuramoto 模型要一步步积分，第一次用到时一次算完存成表，`render` 按 `t` 查表并在两步之间插值；底部曲线是同步程度 | The science of complexity 的萤火虫模拟 | `simulateFlies`、`sceneFlies` |

两点约定，后面的视频可以照用：

- 随机数用固定种子（`mulberry32`），每次加载、每次预览画出来都一样。
- WebGL 不可用时这一节只画波源，不报错。
