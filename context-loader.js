/**
 * context-loader.js — 项目上下文加载器
 * 加载 requirements.json、workflow-state.json 和项目结构信息
 * 支持老项目（没有 workflow-state.json）的优雅降级
 */

const fs = require('fs');
const path = require('path');

/**
 * 加载项目上下文
 * @param {string} projectPath - 项目目录路径
 * @returns {{ hasWorkflowState: boolean, hasRequirements: boolean, hasDiagrams: boolean, hasSourceCode: boolean, requirements: object|null, workflowState: object|null, projectPath: string, needsReconstruction: boolean, sourceDirs: string[], diagramsDir: string|null }}
 */
function loadProjectContext(projectPath) {
  const context = {
    hasWorkflowState: false,
    hasRequirements: false,
    hasDiagrams: false,
    hasSourceCode: false,
    requirements: null,
    workflowState: null,
    projectPath: projectPath,
    needsReconstruction: false,
    sourceDirs: [],
    diagramsDir: null,
  };

  if (!projectPath || !fs.existsSync(projectPath)) {
    context.needsReconstruction = true;
    return context;
  }

  // Tier 1: workflow-state.json（完整管道项目）
  const statePath = path.join(projectPath, 'workflow-state.json');
  if (fs.existsSync(statePath)) {
    try {
      context.hasWorkflowState = true;
      context.workflowState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    } catch (e) {
      // 文件损坏，忽略
    }
  }

  // Tier 2: requirements.json（部分管道）
  const reqPath = path.join(projectPath, 'requirements.json');
  if (fs.existsSync(reqPath)) {
    try {
      context.hasRequirements = true;
      context.requirements = JSON.parse(fs.readFileSync(reqPath, 'utf8'));
    } catch (e) {
      // 文件损坏，忽略
    }
  }

  // Tier 3: 图表目录
  const possibleDiagramDirs = [
    path.join(projectPath, 'docs', 'diagrams'),
    path.join(projectPath, 'docs'),
  ];
  for (const dir of possibleDiagramDirs) {
    if (fs.existsSync(dir)) {
      context.hasDiagrams = true;
      context.diagramsDir = dir;
      break;
    }
  }

  // Tier 4: 源码目录
  const possibleSrcDirs = ['Core/Src', 'fal', 'pal', 'drivers', 'src', 'app'];
  for (const dir of possibleSrcDirs) {
    const fullPath = path.join(projectPath, dir);
    if (fs.existsSync(fullPath)) {
      context.hasSourceCode = true;
      context.sourceDirs.push(dir);
    }
  }

  // 判断是否需要重建上下文
  if (!context.hasRequirements && !context.hasSourceCode) {
    context.needsReconstruction = true;
  }

  return context;
}

/**
 * 在 requirements.json 中查找与关键词相关的模块
 * @param {object} requirements - requirements.json 解析后的对象
 * @param {string} keyword - 搜索关键词（如"温度"、"蓝牙"）
 * @returns {{ section: string, index: number, module: object }[]}
 */
function findRelatedModules(requirements, keyword) {
  const results = [];
  const sections = ['inputs', 'outputs'];

  for (const section of sections) {
    if (!Array.isArray(requirements[section])) continue;
    for (let i = 0; i < requirements[section].length; i++) {
      const mod = requirements[section][i];
      const text = JSON.stringify(mod).toLowerCase();
      if (text.includes(keyword.toLowerCase())) {
        results.push({ section, index: i, module: mod });
      }
    }
  }

  return results;
}

/**
 * 查找项目中的源文件
 * @param {string} projectPath - 项目目录路径
 * @returns {string[]} 源文件路径列表
 */
function findSourceFiles(projectPath) {
  const srcDirs = ['Core/Src', 'fal', 'pal', 'drivers', 'src', 'app'];
  const extensions = ['.c', '.h', '.cpp'];
  const files = [];

  for (const dir of srcDirs) {
    const fullPath = path.join(projectPath, dir);
    if (!fs.existsSync(fullPath)) continue;

    try {
      const entries = fs.readdirSync(fullPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
          files.push(path.join(fullPath, entry.name));
        }
      }
    } catch (e) {
      // 目录不可读，跳过
    }
  }

  return files;
}

/**
 * 根据模块名推断可能的源文件名
 * @param {string} moduleName - 模块名（如"DS18B20"、"LD3320"）
 * @returns {string[]} 可能的文件名模式
 */
function inferSourceFilePatterns(moduleName) {
  const name = moduleName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return [
    `${name}.c`,
    `${name}_driver.c`,
    `${name}_sensor.c`,
    `device_${name}.c`,
  ];
}

module.exports = {
  loadProjectContext,
  findRelatedModules,
  findSourceFiles,
  inferSourceFilePatterns,
};
