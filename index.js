/**
 * index.js — iteration-master 入口
 * 导出所有迭代模式相关的函数
 */

const { classifyIteration, hasIterationIntent, ITERATION_TYPES } = require('./classifier');
const { loadProjectContext, findRelatedModules, findSourceFiles, inferSourceFilePatterns } = require('./context-loader');
const { backupRequirements, mergeRequirements, detectAffectedModules, saveRequirements } = require('./requirements-merge');
const { getBugFixPrompt, getFeatureAnalysisPrompt, getHardwareChangePrompt, getOptimizationPrompt } = require('./iteration-prompts');

module.exports = {
  // 分类器
  classifyIteration,
  hasIterationIntent,
  ITERATION_TYPES,

  // 上下文加载
  loadProjectContext,
  findRelatedModules,
  findSourceFiles,
  inferSourceFilePatterns,

  // 需求合并
  backupRequirements,
  mergeRequirements,
  detectAffectedModules,
  saveRequirements,

  // Prompt 模板
  getBugFixPrompt,
  getFeatureAnalysisPrompt,
  getHardwareChangePrompt,
  getOptimizationPrompt,
};
