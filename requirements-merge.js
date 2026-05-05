/**
 * requirements-merge.js — 需求增量合并
 * 处理 requirements.json 的版本备份、增量合并和变更日志
 */

const fs = require('fs');
const path = require('path');

/**
 * 备份当前 requirements.json
 * @param {string} projectPath - 项目目录路径
 * @returns {string|null} 备份文件路径，失败返回 null
 */
function backupRequirements(projectPath) {
  const reqPath = path.join(projectPath, 'requirements.json');
  if (!fs.existsSync(reqPath)) return null;

  // 找到下一个版本号
  let version = 1;
  while (fs.existsSync(path.join(projectPath, `requirements.v${version}.json`))) {
    version++;
  }

  const backupPath = path.join(projectPath, `requirements.v${version}.json`);
  try {
    fs.copyFileSync(reqPath, backupPath);
    return backupPath;
  } catch (e) {
    return null;
  }
}

/**
 * 合并需求（增量方式）
 * @param {object} existing - 现有 requirements.json
 * @param {string} changeType - 变更类型：feature_addition | hardware_change | bug_fix | optimization
 * @param {object} changeSpec - 变更规格
 * @param {string} changeSpec.action - 操作：add | replace | remove
 * @param {string} changeSpec.target - 目标数组：inputs | outputs
 * @param {object} changeSpec.module - 新模块信息
 * @param {string} [changeSpec.oldModuleName] - 旧模块名（replace/remove 时需要）
 * @param {string} changeSpec.description - 变更描述
 * @returns {object} 合并后的 requirements
 */
function mergeRequirements(existing, changeType, changeSpec) {
  // 深拷贝，不修改原对象
  const merged = JSON.parse(JSON.stringify(existing));

  // 如果是 bug_fix 或 optimization，不修改需求结构
  if (changeType === 'bug_fix' || changeType === 'optimization') {
    // 仍然记录 changelog
    merged.changelog = merged.changelog || [];
    merged.changelog.push({
      version: (merged.changelog.length || 0) + 1,
      date: new Date().toISOString().slice(0, 10),
      type: changeType,
      description: changeSpec.description,
    });
    return merged;
  }

  const target = changeSpec.target || 'inputs';
  if (!Array.isArray(merged[target])) {
    merged[target] = [];
  }

  switch (changeSpec.action) {
    case 'add':
      // 追加新模块
      merged[target].push(changeSpec.module);
      break;

    case 'replace':
      // 按模块名找到旧条目，原地替换
      if (changeSpec.oldModuleName) {
        const idx = merged[target].findIndex(
          m => m.module && m.module.toLowerCase() === changeSpec.oldModuleName.toLowerCase()
        );
        if (idx >= 0) {
          merged[target][idx] = changeSpec.module;
        } else {
          // 找不到旧模块，追加新模块
          merged[target].push(changeSpec.module);
        }
      }
      break;

    case 'remove':
      // 按模块名移除
      if (changeSpec.oldModuleName) {
        merged[target] = merged[target].filter(
          m => m.module && m.module.toLowerCase() !== changeSpec.oldModuleName.toLowerCase()
        );
      }
      break;
  }

  // 更新 changelog
  merged.changelog = merged.changelog || [];
  merged.changelog.push({
    version: (merged.changelog.length || 0) + 1,
    date: new Date().toISOString().slice(0, 10),
    type: changeType,
    description: changeSpec.description,
    changes: {
      [changeSpec.action]: [changeSpec.module || { module: changeSpec.oldModuleName }],
    },
  });

  return merged;
}

/**
 * 检测受影响的模块（用于决定图表和代码的重生成范围）
 * @param {object} oldReqs - 旧 requirements
 * @param {object} newReqs - 新 requirements
 * @returns {{ added: object[], removed: object[], modified: object[] }}
 */
function detectAffectedModules(oldReqs, newReqs) {
  const affected = { added: [], removed: [], modified: [] };

  for (const section of ['inputs', 'outputs']) {
    const oldModules = (oldReqs[section] || []).map(m => m.module);
    const newModules = (newReqs[section] || []).map(m => m.module);

    // 新增的模块
    for (const mod of newReqs[section] || []) {
      if (!oldModules.includes(mod.module)) {
        affected.added.push({ ...mod, section });
      }
    }

    // 移除的模块
    for (const mod of oldReqs[section] || []) {
      if (!newModules.includes(mod.module)) {
        affected.removed.push({ ...mod, section });
      }
    }

    // 修改的模块（同名但内容不同）
    for (const newMod of newReqs[section] || []) {
      const oldMod = (oldReqs[section] || []).find(m => m.module === newMod.module);
      if (oldMod && JSON.stringify(oldMod) !== JSON.stringify(newMod)) {
        affected.modified.push({ ...newMod, section, old: oldMod });
      }
    }
  }

  return affected;
}

/**
 * 保存合并后的 requirements.json
 * @param {string} projectPath - 项目目录路径
 * @param {object} requirements - 合并后的 requirements
 * @returns {boolean} 是否保存成功
 */
function saveRequirements(projectPath, requirements) {
  const reqPath = path.join(projectPath, 'requirements.json');
  try {
    fs.writeFileSync(reqPath, JSON.stringify(requirements, null, 2), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = {
  backupRequirements,
  mergeRequirements,
  detectAffectedModules,
  saveRequirements,
};
