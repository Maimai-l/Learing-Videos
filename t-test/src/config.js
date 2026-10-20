// Timing decisions for the whole video. Times in seconds.
export const CONFIG = {
  fps: 60,
  title: 6.5, // title card before the narration starts
  lead: 0.3, // keep this much of the recording before the first word
  tail: 7.0, // closing after the last word
  chapterPause: 1.8, // silence added before every chapter except the first
  // extra silence after a paragraph (1-based paragraph number -> seconds),
  // for places where the picture needs time to finish before the next sentence
  pauses: { 11: 1.4, 40: 1.0 },
  chapters: [
    { n: 1, cn: '一', title: '五批数据', start: '一家工厂试用了一种新工艺' },
    { n: 2, cn: '二', title: '平均值会偏离多远', start: '每个数据与真实均值之差' },
    { n: 3, cn: '三', title: '多大的偏离才算少见', start: '有了这个结果，问题就可以说得更准确' },
    { n: 4, cn: '四', title: '用数据估计方差', start: '西格玛平方衡量的是数据离真实均值有多远' },
    { n: 5, cn: '五', title: '这个“1”是什么', start: '少掉的这一份，还可以从数据里有几条信息来理解' },
    { n: 6, cn: '六', title: '分母也会变', start: '除以 n 减 1，保证了 s 平方在重复抽样中平均等于西格玛平方' },
    { n: 7, cn: '七', title: 't 分布', start: '要得到 t 的确切分布' },
    { n: 8, cn: '八', title: '自由度可以不是整数', start: '回头看，自由度起了两个作用' },
    { n: 9, cn: '九', title: '回到五批数据', start: '现在回到开头的五批数据' },
  ],
};
