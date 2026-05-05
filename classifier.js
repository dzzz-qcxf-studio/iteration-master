/**
 * classifier.js — 迭代类型分类器
 * 根据用户消息中的关键词，将迭代请求分为 4 种类型
 */

const ITERATION_TYPES = {
  bug_fix: {
    keywords: ['不对', '有问题', '不工作', '报错', '不准', '读数', '修复', '修一下', 'fix', 'bug', '出错', '异常', '失败', '不能'],
    description: 'Bug修复 — 诊断现有代码问题并修复',
    affectsRequirements: false,
    affectsDiagrams: false,
  },
  feature_addition: {
    keywords: ['加一个', '增加', '加上', '新增', '添加', '支持', 'add', '实现', '接入', '连接'],
    description: '功能添加 — 在现有项目上增加新功能或模块',
    affectsRequirements: true,
    affectsDiagrams: true,
  },
  hardware_change: {
    keywords: ['换成', '替换成', '改用', '换掉', '替代', 'replace', '更换', '升级'],
    description: '硬件模块更换 — 替换现有传感器/执行器/模块',
    affectsRequirements: true,
    affectsDiagrams: true,
  },
  optimization: {
    keywords: ['优化', '改进', '提升', '改善', '精度', '速度', '功耗', 'optimize', '性能', '效率'],
    description: '性能优化 — 改善现有代码的性能指标',
    affectsRequirements: false,
    affectsDiagrams: false,
  },
};

/**
 * 分类用户迭代请求
 * @param {string} userMessage - 用户消息
 * @returns {{ type: string, confidence: number, matchedKeywords: string[], description: string, affectsRequirements: boolean, affectsDiagrams: boolean } | null}
 */
function classifyIteration(userMessage) {
  if (!userMessage || typeof userMessage !== 'string') {
    return null;
  }

  const msg = userMessage.toLowerCase();
  const scores = {};

  for (const [type, config] of Object.entries(ITERATION_TYPES)) {
    const matched = config.keywords.filter(kw => msg.includes(kw));
    scores[type] = {
      type,
      score: matched.length,
      matchedKeywords: matched,
      description: config.description,
      affectsRequirements: config.affectsRequirements,
      affectsDiagrams: config.affectsDiagrams,
    };
  }

  // 按匹配数排序
  const sorted = Object.values(scores).filter(s => s.score > 0).sort((a, b) => b.score - a.score);

  if (sorted.length === 0) {
    return null; // 无法分类
  }

  const best = sorted[0];
  return {
    type: best.type,
    confidence: best.score,
    matchedKeywords: best.matchedKeywords,
    description: best.description,
    affectsRequirements: best.affectsRequirements,
    affectsDiagrams: best.affectsDiagrams,
  };
}

/**
 * 检测用户消息是否包含迭代意图
 * @param {string} userMessage
 * @returns {boolean}
 */
function hasIterationIntent(userMessage) {
  return classifyIteration(userMessage) !== null;
}

module.exports = {
  classifyIteration,
  hasIterationIntent,
  ITERATION_TYPES,
};
