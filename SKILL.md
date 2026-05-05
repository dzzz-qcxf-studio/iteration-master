---
name: iteration-master
description: 嵌入式项目迭代升级 — 由 embedded-pipeline 调用，不直接触发。支持 Bug修复、功能添加、硬件更换、性能优化四种迭代类型
---

# Iteration Master — 嵌入式项目迭代升级

当用户对**已有项目**提出修改需求时，由 `embedded-pipeline` 路由到本 skill。本 skill 是迭代模式的唯一入口。

## 触发条件（由 embedded-pipeline 判断）

本 skill **不直接触发**，由 embedded-pipeline 检测到以下条件后调用：
1. 项目目录中存在 `requirements.json`（已有项目）
2. 用户消息匹配迭代关键词

## 迭代类型分类

收到用户消息后，**第一步**进行分类：

| 类型 | 关键词 | 描述 |
|------|--------|------|
| **bug_fix** | 不对/有问题/不工作/报错/不准/修复/修一下/fix/bug | 诊断现有代码问题并修复 |
| **feature_addition** | 加一个/增加/加上/新增/添加/支持/add | 在现有项目上增加新功能或模块 |
| **hardware_change** | 换成/替换成/改用/换掉/替代/replace | 替换现有传感器/执行器/模块 |
| **optimization** | 优化/改进/提升/改善/精度/速度/功耗/optimize | 改善现有代码的性能指标 |

分类方法：读取用户消息，按上表关键词匹配。如果匹配到多个类型，取匹配度最高的。如果无法分类，**询问用户**。

## 执行协议

### 前置步骤：加载项目上下文

`embedded-pipeline` 已确定工作目录（`projectPath`），本 skill 直接使用：
1. 在 `projectPath` 下查找 `requirements.json`
2. 如果找到，读取并解析为项目上下文
3. 如果没找到，询问用户确认项目路径
4. 扫描项目结构：图表目录（`docs/diagrams/`）、源码目录（`Core/Src/`, `fal/`, `drivers/`）

---

### Bug Fix 执行协议

```
用户："温度传感器读数不对"
```

**Step 1: 诊断**
- 在 requirements.json 的 `inputs[]` 中找到与症状相关的模块
- 读取对应的源文件（根据模块名推断文件名，如 `temp_sensor.c`, `ds18b20.c`）
- 分析可能的根因：
  - 初始化配置错误（分辨率、采样率）
  - 时序问题（协议时序不满足 spec）
  - 数据处理错误（单位转换、偏移量）
  - 硬件接线问题（上拉电阻、电压匹配）
- **向用户确认**诊断结果

**Step 2: 修复**
- 对源文件进行精确编辑（surgical edit）
- **不修改** requirements.json
- **不重新生成**图表

**Step 3: 重编译**
- 调用 `Skill('stm32-master')` 编译烧录
- 提示用户在硬件上验证

---

### Feature Addition 执行协议

```
用户："给声控灯加一个蓝牙模块"
```

**Step 1: 需求分析**
- 读取现有 requirements.json
- 分析新功能需要的硬件模块、接口、引脚
- 检查引脚冲突和资源限制
- **通过 AskUserQuestion 向用户确认**关键选型（1-2 个问题，如"选 HC-05 还是 HC-06？"）

**Step 2: 合并需求**
- 备份当前 requirements.json 为 `requirements.v{N}.json`
- 将新模块追加到 `inputs[]` 或 `outputs[]`
- 更新 `constraints`（如有变化）
- 在 `changelog` 数组中记录本次变更
- 保存新的 requirements.json

**Step 3: 更新图表**
- 调用 `Skill('diagram-master')`，传入更新后的 requirements.json
- diagram-master 重新生成接线图、流程图、软件设计文档

**Step 4: 增量代码修改**
- 基于新的 software_design.md，为新模块编写驱动代码（使用 stm32-master 的模板）
- 修改 main.c 添加新模块的初始化和主循环逻辑
- **不重写**现有代码

**Step 5: 重编译**
- 调用 `Skill('stm32-master')` 编译烧录

---

### Hardware Change 执行协议

```
用户："把DHT11换成DS18B20"
```

**Step 1: 兼容性分析**
- 在 requirements.json 中找到要替换的模块
- 分析新旧模块差异：接口类型、电压、引脚、协议、时序
- 识别影响范围（如果接口类型变化，影响更大）
- **通过 AskUserQuestion 向用户确认**（如"是否需要保留湿度传感功能？"）

**Step 2: 合并需求**
- 备份当前 requirements.json
- 在 `inputs[]` 或 `outputs[]` 中找到旧模块，原地替换为新模块
- 更新引脚分配
- 在 `changelog` 中记录

**Step 3: 更新图表 + 代码**
- 调用 `Skill('diagram-master')` 重新生成受影响的图表
- 替换对应的驱动文件
- 更新 main.c 中的引用

**Step 4: 重编译**
- 调用 `Skill('stm32-master')` 编译烧录

---

### Optimization 执行协议

```
用户："优化一下ADC采样的精度"
```

**Step 1: 分析现有代码**
- 在 requirements.json 中找到相关模块
- 读取对应的源文件
- 识别优化点：
  - ADC：过采样、DMA传输、校准补偿、参考电压选择
  - 定时器：中断频率、PWM分辨率
  - 通信：波特率、缓冲区大小、DMA
  - 内存：静态分配、对齐优化

**Step 2: 应用优化**
- 对特定函数进行精确编辑
- **不修改** requirements.json
- **不重新生成**图表

**Step 3: 重编译**
- 调用 `Skill('stm32-master')` 编译烧录

---

## 需求合并规则

### 增量合并原则

- **追加，不覆盖**：新模块追加到数组末尾，已有条目不动
- **原地替换**：硬件更换时，按模块名找到旧条目原地替换
- **版本备份**：每次修改前，将当前 requirements.json 备份为 `requirements.v{N}.json`（N 从 1 递增）
- **变更日志**：在 requirements.json 中维护 `changelog` 数组

### changelog 字段格式

```json
{
  "changelog": [
    {
      "version": 2,
      "date": "2026-05-05",
      "type": "feature_addition",
      "description": "添加蓝牙模块 HC-05",
      "changes": {
        "added": [{ "module": "HC-05", "interface": "UART", "pin": "PA9,PA10" }]
      }
    }
  ]
}
```

### 备份文件命名

```
requirements.json        ← 当前版本
requirements.v1.json     ← 第一次迭代前的备份
requirements.v2.json     ← 第二次迭代前的备份
```

---

## 禁止事项

- **禁止**在迭代模式下调用 `requirements-master`（新项目专用）
- **禁止**在 Bug 修复和性能优化时重新生成图表
- **禁止**覆盖 requirements.json 而不备份
- **禁止**重写用户已有的业务代码（只做增量修改）

---

## 工作流链指令

### Bug Fix / Optimization 完成后

```
修复/优化完成
  → Skill('stm32-master') 编译烧录
  → 提示用户在硬件上验证
```

### Feature Addition / Hardware Change 完成后

```
需求合并完成
  → Skill('diagram-master') 更新图表
  → 用户确认图表
  → 编写/修改驱动代码
  → Skill('stm32-master') 编译烧录
  → 提示用户在硬件上验证
```
