/**
 * iteration-prompts.js — 迭代类型的 Prompt 模板
 * 为 4 种迭代类型生成分析用的 prompt
 */

/**
 * Bug 修复诊断 prompt
 * @param {object} requirements - 当前 requirements.json
 * @param {object[]} relatedModules - 与问题相关的模块（从 findRelatedModules 获取）
 * @param {string} symptom - 用户描述的症状
 * @returns {string}
 */
function getBugFixPrompt(requirements, relatedModules, symptom) {
  const moduleInfo = relatedModules.map(m =>
    `- ${m.module.module} (${m.module.interface}, ${m.module.voltage}, 引脚: ${m.module.pin})`
  ).join('\n');

  return `你是一个嵌入式固件工程师。用户报告了一个 Bug，请诊断并修复。

## 项目信息
- MCU: ${requirements.mcu}
- 项目名: ${requirements.projectName}

## 相关模块
${moduleInfo || '（未找到匹配的模块）'}

## 用户报告的症状
${symptom}

## 诊断步骤
1. 根据症状定位可能的问题源（代码/硬件/配置）
2. 读取相关源文件，分析代码逻辑
3. 列出可能的根因（按可能性排序）
4. 给出修复方案

请先分析根因，然后给出具体的代码修复。不需要修改需求文档或图表。`;
}

/**
 * 功能添加分析 prompt
 * @param {object} requirements - 当前 requirements.json
 * @param {string} featureDescription - 用户描述的新功能
 * @returns {string}
 */
function getFeatureAnalysisPrompt(requirements, featureDescription) {
  const currentInputs = (requirements.inputs || []).map(m =>
    `- ${m.module} (${m.interface}, ${m.voltage}, 引脚: ${m.pin})`
  ).join('\n');

  const currentOutputs = (requirements.outputs || []).map(m =>
    `- ${m.module} (${m.interface}, ${m.voltage}, 引脚: ${m.pin})`
  ).join('\n');

  return `你是一个嵌入式系统架构师。用户想在现有项目上添加新功能，请分析需求。

## 当前项目
- MCU: ${requirements.mcu}
- 项目名: ${requirements.projectName}

## 当前输入模块
${currentInputs || '（无）'}

## 当前输出模块
${currentOutputs || '（无）'}

## 用户想添加的功能
${featureDescription}

## 分析要求
1. 新功能需要哪些硬件模块？（给出具体型号推荐）
2. 需要什么接口？（UART/SPI/I2C/GPIO/ADC 等）
3. 需要占用哪些引脚？是否有引脚冲突？
4. 电压是否兼容？是否需要电平转换？
5. 软件上需要什么驱动？

请给出具体的模块推荐和引脚分配方案。`;
}

/**
 * 硬件更换分析 prompt
 * @param {object} requirements - 当前 requirements.json
 * @param {object} oldModule - 要替换的旧模块
 * @param {string} newModuleName - 新模块名
 * @returns {string}
 */
function getHardwareChangePrompt(requirements, oldModule, newModuleName) {
  return `你是一个嵌入式硬件工程师。用户想替换项目中的一个模块，请分析兼容性。

## 当前项目
- MCU: ${requirements.mcu}
- 项目名: ${requirements.projectName}

## 要替换的模块
- 模块名: ${oldModule.module}
- 接口: ${oldModule.interface}
- 电压: ${oldModule.voltage}
- 引脚: ${oldModule.pin}
${oldModule.note ? `- 备注: ${oldModule.note}` : ''}

## 替换目标
- 新模块: ${newModuleName}

## 分析要求
1. 新旧模块的接口类型是否相同？
2. 电压是否兼容？
3. 引脚分配是否可以复用？
4. 通信协议有何差异？
5. 是否需要额外的外围电路（如上拉电阻、电平转换）？
6. 驱动代码需要做哪些修改？

请给出详细的兼容性分析和替换方案。`;
}

/**
 * 性能优化分析 prompt
 * @param {object} requirements - 当前 requirements.json
 * @param {string} target - 优化目标（如"ADC精度"、"功耗"、"响应速度"）
 * @returns {string}
 */
function getOptimizationPrompt(requirements, target) {
  const allModules = [
    ...(requirements.inputs || []),
    ...(requirements.outputs || []),
  ].map(m => `- ${m.module} (${m.interface})`).join('\n');

  return `你是一个嵌入式性能优化专家。用户想优化项目的性能，请分析优化方案。

## 当前项目
- MCU: ${requirements.mcu}
- 项目名: ${requirements.projectName}

## 当前模块
${allModules || '（无）'}

## 优化目标
${target}

## 分析要求
1. 当前实现中可能的性能瓶颈是什么？
2. 针对 ${target}，有哪些优化手段？
3. 每种优化手段的预期效果和副作用？
4. 推荐的优化方案（按优先级排序）？

常见的嵌入式优化手段：
- ADC: 过采样、DMA传输、校准补偿、参考电压选择
- 定时器: 中断频率调整、PWM分辨率优化
- 通信: 波特率优化、缓冲区大小调整、DMA传输
- 内存: 静态分配、对齐优化、减少动态分配
- CPU: 编译优化等级、关键代码内联、查表替代计算

请给出具体的代码优化方案。`;
}

module.exports = {
  getBugFixPrompt,
  getFeatureAnalysisPrompt,
  getHardwareChangePrompt,
  getOptimizationPrompt,
};
