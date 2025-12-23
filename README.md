# Quest Designer 使用说明

Quest Designer 是一个可视化的游戏对话和任务编辑器，通过图形界面帮助你轻松创建 NPC 对话系统和游戏任务。

---

## 📝 目录

- [基本操作](#基本操作)
- [NPC 编辑器](#npc-编辑器)
  - [NPC 节点类型](#npc-节点类型)
  - [操作流程](#npc-操作流程)
- [任务编辑器](#任务编辑器)
  - [任务配置](#任务配置)
  - [操作流程](#任务操作流程)
- [数据导入导出](#数据导入导出)
- [快捷键与技巧](#快捷键与技巧)

---

## 基本操作

### 进入编辑器

打开网站后，你会看到首页有两个主要入口：

- **🎭 NPC Editor** - 创建和编辑 NPC 对话系统
- **📜 Quest Editor** - 创建和编辑游戏任务

### 项目管理

1. **设置项目名称**：在首页顶部输入框中输入你的项目名称（如 "MyGame"）
2. **导入导出数据**：点击右上角的 "Import/Export Data" 按钮

---

## NPC 编辑器

NPC 编辑器用于创建对话系统，包括对话文本、选项分支、条件判断等。

### NPC 节点类型

#### 1. 🟦 Dialog 节点（对话节点）

**用途**：显示 NPC 对话文本

**字段说明**：
- **Label**：节点显示名称（用于标识节点）
- **Dialog Texts**：对话文本列表
  - 可以添加多段对话文本
  - 点击 `+ Add Text` 添加新文本
  - 点击 `✕` 删除某段文本

**使用场景**：NPC 说话、讲述故事、提供信息等

**示例**：
```
Dialog Texts:
- "你好，旅行者！欢迎来到我的商店。"
- "我这里有各种珍稀物品出售。"
```

---

#### 2. 🟪 Options 节点（选项节点）

**用途**：让玩家从多个选项中选择

**字段说明**：
- **Label**：节点显示名称
- **Options**：选项列表
  - **Text**：选项显示的文本
  - **Entry Node**：选择该选项后跳转到哪个节点（通过连线设置）

**使用场景**：玩家需要做出选择的对话分支

**示例**：
```
Options:
1. "我想买点东西" → 跳转到商店节点
2. "给我讲讲这个城镇的历史" → 跳转到历史对话节点
3. "再见" → 结束对话
```

---

#### 3. 🟧 Condition 节点（条件节点）

**用途**：根据游戏状态判断走向不同的分支

**字段说明**：
- **Label**：节点显示名称
- **Conditions**：条件列表
  - **Condition**：条件表达式（下方会显示高亮预览）
  - **Entry Node**：满足该条件时跳转到哪个节点

**条件语法**：
```
mission.任务ID = completed      # 任务已完成
mission.任务ID = active         # 任务进行中
mission.任务ID = not_started    # 任务未开始

var.变量名 = 值                 # 变量等于某个值
var.等级 >= 5                   # 数值比较
var.声望 > 100

AND                             # 与运算
OR                              # 或运算
```

**使用场景**：根据任务状态、玩家等级、变量值等决定对话内容

**示例**：
```
Conditions:
1. "mission.救猫任务 = completed AND var.等级 >= 5" → 跳转到高级任务节点
2. "var.声望 < 50" → 跳转到低声望对话
3. 默认情况 → 跳转到普通对话
```

---

#### 4. ⚙️ Commands 节点（命令节点）

**用途**：执行游戏动作（设置变量、给予奖励等）

**字段说明**：
- **Label**：节点显示名称
- **Actions**：动作列表

**常用命令**：
```
var.set key=变量名 value=值        # 设置变量
mission.start id=任务ID          # 开始任务
mission.complete id=任务ID       # 完成任务
item.give id=物品ID amount=数量   # 给予物品
```

**使用场景**：触发游戏事件、修改游戏状态、给予奖励

**示例**：
```
Actions:
- var.set key=救猫任务完成 value=true
- item.give id=金币 amount=100
- mission.start id=下一个任务
```

---

#### 5. 🛒 Shop 节点（商店节点）

**用途**：打开商店界面

**字段说明**：
- **Label**：节点显示名称
- **Shop Type**：商店类型
  - `buy`：购买商店
  - `sell`：出售商店

**使用场景**：NPC 商人、商店交互

---

### NPC 操作流程

#### 创建 NPC

1. 点击右上角 `+ New NPC` 按钮
2. 新 NPC 会出现在 NPC 列表中
3. 点击 NPC 名称选中它

#### 编辑 NPC 基本信息

1. 在左侧图表中点击蓝色的 NPC 根节点（或确保没有选中任何子节点）
2. 右侧会显示 NPC 编辑面板
3. 填写信息：
   - **ID**：NPC 的唯一标识（只读）
   - **Name**：NPC 名称
   - **Description**：NPC 描述
   - **Root Options**：玩家与 NPC 对话时的初始选项

#### Root Options（根选项）

**什么是根选项？**
当玩家与 NPC 交互时，首先显示的选项列表。

**字段**：
- **Text**：选项文本（如 "打招呼"、"询问任务"）
- **Condition**：显示该选项的条件（可选）
- **Entry Node**：选择该选项后进入哪个节点（通过连线设置）

**示例**：
```
Root Options:
1. Text: "你好"
   Condition: (空)
   Entry Node: dialog_greeting

2. Text: "我完成了任务"
   Condition: mission.救猫任务 = active
   Entry Node: dialog_quest_complete
```

#### 添加对话节点

1. 点击左上角 `+ Add Node` 按钮
2. 新节点会添加到图表中
3. 点击新节点选中它
4. 在右侧面板编辑节点：
   - 修改 **Label**（节点名称）
   - 选择 **Type**（节点类型）
   - 填写该类型的具体内容

#### 连接节点（创建对话流程）

**方法 1：拖拽连线**
1. 鼠标放在源节点的边缘，会出现连接点
2. 按住鼠标拖拽到目标节点
3. 释放鼠标完成连接

**方法 2：在编辑面板设置**
- Dialog / Commands / Shop 节点：系统自动连接 `next` 字段
- Options 节点：每个选项可以连到不同的节点
- Condition 节点：每个条件可以连到不同的节点

#### 断开连线

**按住 `Ctrl` (Windows) 或 `Cmd` (Mac) + 点击连线**

连线会被删除，对应的连接关系也会清除。

#### 删除节点

1. 选中要删除的节点
2. 右侧面板顶部点击 `Delete Node` 按钮
3. 确认删除

**注意**：删除节点后，所有指向该节点的连接都会被清除。

#### 保存更改

点击右上角 `Save Changes` 按钮保存所有修改。

---

### NPC 对话示例流程

一个完整的 NPC 对话流程示例：

```
[NPC: 村长]
  Root Option: "你好，村长" → dialog_greeting

[dialog_greeting (Dialog)]
  Texts: "你好，勇敢的冒险者！我们村子遇到了麻烦。"
  → condition_check_level

[condition_check_level (Condition)]
  Condition 1: "var.等级 >= 10" → dialog_accept_quest
  Condition 2: "var.等级 < 10" → dialog_too_weak

[dialog_accept_quest (Dialog)]
  Texts: "你看起来很强大，能帮我们消灭森林里的怪物吗？"
  → options_accept

[options_accept (Options)]
  Option 1: "我接受任务" → commands_start_quest
  Option 2: "我再考虑考虑" → (结束)

[commands_start_quest (Commands)]
  Actions: 
    - mission.start id=消灭怪物
    - var.set key=接受了村长任务 value=true
  → dialog_good_luck

[dialog_good_luck (Dialog)]
  Texts: "太好了！祝你好运！"
  → (结束)
```

---

## 任务编辑器

任务编辑器用于创建游戏任务系统，包括任务目标、完成条件、任务链等。

### 任务配置

#### 基本信息

- **Title**：任务标题（如 "营救村民"）
- **Description**：任务描述（任务的详细说明）
- **Giver**：任务发布者（如 "村长"）
- **Difficulty**：难度等级
  - `easy`：简单
  - `medium`：中等
  - `hard`：困难

#### 任务关系

- **Unlocks**：完成本任务后解锁哪些任务（用逗号分隔任务 ID）
- **Repeatable**：是否可重复完成
  - `No`：只能完成一次
  - `Yes`：可以多次完成

#### Objective Structure（目标结构）

定义任务目标的逻辑关系。

**语法**：
```
目标ID                     # 单个目标
目标1 AND 目标2            # 两个目标都要完成
目标1 OR 目标2             # 完成其中一个即可
(目标1 AND 目标2) OR 目标3  # 复杂组合
```

**示例**：
```
# 示例 1：完成所有目标
kill_goblins AND collect_herbs AND return_to_village

# 示例 2：选择其中一种完成方式
(kill_boss) OR (collect_items AND talk_to_npc)

# 示例 3：顺序无关的并行目标
obj1 AND obj2 AND obj3
```

---

### 任务目标类型

#### 1. Event 类型（事件触发）

**用途**：监听游戏事件，当事件触发指定次数后完成

**字段**：
- **ID**：目标的唯一标识（用于 Objective Structure）
- **Description**：目标描述（如 "击败 10 只哥布林"）
- **Event Type**：监听的事件类型
  - 示例：`ENEMY_KILLED`, `ITEM_COLLECTED`, `NPC_TALKED`, `AREA_ENTERED`
- **Event Condition**：事件数据必须满足的条件
- **Amount**：需要触发的次数

**使用场景**：
- 杀怪任务
- 收集物品
- 与 NPC 对话
- 到达指定地点

**示例 1：击杀任务**
```
ID: kill_goblins
Description: 击败 10 只哥布林
Event Type: ENEMY_KILLED
Event Condition: enemy_id = goblin
Amount: 10
```

**示例 2：收集任务**
```
ID: collect_herbs
Description: 收集 5 个草药
Event Type: ITEM_COLLECTED
Event Condition: item_id = herb
Amount: 5
```

**示例 3：对话任务**
```
ID: talk_to_blacksmith
Description: 与铁匠对话
Event Type: NPC_TALKED
Event Condition: npc_id = blacksmith
Amount: 1
```

---

#### 2. Submit 类型（提交物品）

**用途**：需要玩家提交指定物品

**字段**：
- **ID**：目标的唯一标识
- **Description**：目标描述
- **Item Type or ID**：物品类型或物品 ID
- **Amount**：需要提交的数量

**使用场景**：
- 上交任务物品
- 缴纳费用

**示例**：
```
ID: submit_gold
Description: 提交 100 金币
Item Type or ID: gold
Amount: 100
```

---

#### 目标条件（Conditions）

可选字段，用于给目标添加额外的启用条件。

**用途**：
- 只有满足条件时，目标才会激活
- 用于创建阶段性任务

**示例**：
```
目标: collect_advanced_herbs
条件: mission.basic_collection = completed AND var.等级 >= 15

# 只有完成基础收集任务且等级达到 15 时，才能进行高级草药收集
```

---

### 任务操作流程

#### 创建任务

1. 点击右上角 `+ New Quest` 按钮
2. 新任务会出现在左侧图表中
3. 任务会自动被选中，可以在右侧编辑

#### 编辑任务信息

1. 在左侧图表中点击任务节点
2. 右侧面板显示任务编辑界面
3. 填写基本信息、目标结构等

#### 添加任务目标

1. 在任务编辑面板中找到 "Objectives" 区域
2. 点击 `+ Add Objective` 按钮
3. 在目标列表中点击新建的目标
4. 在下方 "Edit Objective" 区域编辑目标详情

#### 编辑目标

1. 填写目标 ID（用于在 Objective Structure 中引用）
2. 填写目标描述
3. 选择目标类型（Event 或 Submit）
4. 根据类型填写相应字段

#### 设置目标逻辑

在 "Objective Structure" 字段中填写目标的完成逻辑：

```
# 所有目标都要完成
obj1 AND obj2 AND obj3

# 完成其中一个即可
obj1 OR obj2 OR obj3

# 复杂组合
(obj1 AND obj2) OR obj3
```

输入后下方会显示语法高亮预览，如果语法错误会提示。

#### 创建任务链（设置任务解锁关系）

**方法 1：拖拽连线**
1. 在图表中，从前置任务拖拽连线到后续任务
2. 连线创建后，前置任务完成会解锁后续任务

**方法 2：手动输入**
1. 选中前置任务
2. 在 "Unlocks" 字段中输入后续任务的 ID
3. 多个任务用逗号分隔：`quest2, quest3, quest4`

#### 断开任务链

**按住 `Ctrl` (Windows) 或 `Cmd` (Mac) + 点击连线**

#### 删除任务

1. 选中要删除的任务
2. 点击右侧面板顶部的 `Delete Quest` 按钮
3. 确认删除

**注意**：删除任务会自动从其他任务的 unlocks 列表中移除。

#### 保存更改

点击右上角 `Save Changes` 按钮保存所有修改。

---

### 任务示例

#### 示例 1：简单的杀怪任务

```yaml
任务 ID: kill_slimes_quest
标题: 消灭史莱姆
描述: 村子附近出现了很多史莱姆，帮忙清理掉它们吧。
发布者: 村长
难度: easy
可重复: No

目标结构: kill_slimes

目标:
  - ID: kill_slimes
    描述: 击败 5 只史莱姆
    类型: Event
    事件类型: ENEMY_KILLED
    事件条件: enemy_id = slime
    数量: 5
```

---

#### 示例 2：多阶段任务

```yaml
任务 ID: help_merchant
标题: 帮助商人
描述: 商人需要一些帮助来准备货物。
发布者: 商人
难度: medium
可重复: No

目标结构: talk_start AND (collect_wood OR collect_stone) AND deliver

目标:
  - ID: talk_start
    描述: 与商人对话了解需求
    类型: Event
    事件类型: NPC_TALKED
    事件条件: npc_id = merchant AND dialog_stage = start
    数量: 1
    
  - ID: collect_wood
    描述: 收集 10 个木材
    类型: Event
    事件类型: ITEM_COLLECTED
    事件条件: item_id = wood
    数量: 10
    条件: mission.help_merchant.talk_start = completed
    
  - ID: collect_stone
    描述: 收集 5 个石头
    类型: Event
    事件类型: ITEM_COLLECTED
    事件条件: item_id = stone
    数量: 5
    条件: mission.help_merchant.talk_start = completed
    
  - ID: deliver
    描述: 将材料交给商人
    类型: Event
    事件类型: NPC_TALKED
    事件条件: npc_id = merchant AND dialog_stage = deliver
    数量: 1
```

---

#### 示例 3：任务链

```
[新手任务] → 解锁 → [进阶任务A] → 解锁 → [高级任务]
                   ↓
              [进阶任务B]

任务 1: 新手任务
  Unlocks: 进阶任务A, 进阶任务B

任务 2: 进阶任务A
  Unlocks: 高级任务
  
任务 3: 进阶任务B
  (独立任务线)

任务 4: 高级任务
  (需要先完成进阶任务A)
```

---

## 数据导入导出

### 导出数据

1. 在首页点击 `Import/Export Data` 按钮
2. 在弹出的面板中点击 `Export Project Data`
3. 选择要导出的项目名称
4. 数据会以 JSON 文件形式下载

**用途**：
- 备份项目数据
- 分享数据给团队成员
- 迁移到其他环境

---

### 导入数据

1. 在首页点击 `Import/Export Data` 按钮
2. 点击 `Import Data` 或拖拽 JSON 文件到指定区域
3. 选择要导入的 JSON 文件
4. 确认导入

**注意**：
- 导入会覆盖同名项目的数据
- 建议导入前先导出当前数据备份

---

## 快捷键与技巧

### 图表操作

| 操作 | 方法 |
|------|------|
| 放大/缩小 | 鼠标滚轮 |
| 平移视图 | 按住空白区域拖动 |
| 框选多个节点 | 按住鼠标左键拖动 |
| 连接节点 | 从节点边缘拖拽到另一个节点 |
| 断开连线 | `Ctrl/Cmd + 点击连线` |
| 删除节点 | 选中后点击右侧的 Delete 按钮 |
| 适应画布 | 点击左下角的适应按钮 |

---

### 编辑技巧

#### 1. 使用清晰的命名

**推荐**：
- NPC: `npc_village_elder`, `npc_blacksmith`
- 节点: `dialog_greeting`, `condition_level_check`, `options_main_menu`
- 任务: `quest_save_village`, `quest_collect_herbs`
- 目标: `kill_enemies`, `collect_items`, `talk_to_npc`

**不推荐**：
- `npc1`, `dialog`, `quest`, `obj`

#### 2. 合理使用条件节点

条件节点应该放在需要判断的地方：
- 检查任务状态
- 检查玩家等级
- 检查变量值

#### 3. 避免循环依赖

在设置任务链时，确保不会出现循环：
- ❌ 任务A 解锁 任务B，任务B 又解锁 任务A
- ✅ 任务A → 任务B → 任务C（单向链）

#### 4. 使用目标条件控制任务阶段

对于复杂任务，可以使用目标条件实现阶段控制：

```
目标1: 与NPC对话
  条件: (无)
  
目标2: 收集物品
  条件: mission.当前任务.目标1 = completed
  
目标3: 回报NPC
  条件: mission.当前任务.目标2 = completed
```

---

## 常见问题

### Q: 为什么我的对话选项不显示？

A: 检查以下几点：
1. Root Options 中的选项是否设置了 Condition，且条件是否满足
2. Options 节点中的选项是否正确连接到了 Entry Node
3. 是否正确保存了更改

### Q: 任务目标无法完成？

A: 检查：
1. Objective Structure 语法是否正确
2. 目标的 Event Type 和 Event Condition 是否正确
3. 目标是否设置了额外的 Conditions，且条件是否满足

### Q: 如何创建"二选一"的任务？

A: 使用 OR 逻辑：
```
Objective Structure: objective_a OR objective_b
```

### Q: 如何创建"必须全部完成"的任务？

A: 使用 AND 逻辑：
```
Objective Structure: obj1 AND obj2 AND obj3
```

### Q: 连线错了怎么办？

A: 按住 `Ctrl` (Windows) 或 `Cmd` (Mac) 点击连线即可删除。

### Q: 节点太多看不清了？

A: 使用图表左下角的控制按钮：
- 点击 "+" / "-" 缩放
- 点击适应按钮自动调整视图
- 拖动空白区域移动视图

---

## 小结

### NPC 编辑器核心要点

1. **NPC 根节点** 定义初始选项
2. **Dialog 节点** 用于对话文本
3. **Options 节点** 用于玩家选择
4. **Condition 节点** 用于条件分支
5. **Commands 节点** 用于执行动作
6. **Shop 节点** 用于商店交互

### 任务编辑器核心要点

1. **Event 目标** 监听游戏事件
2. **Submit 目标** 提交物品
3. **Objective Structure** 定义目标逻辑（AND/OR）
4. **任务链** 通过 unlocks 或连线设置

---

**开始创造你的游戏世界吧！** 🎮✨

如有问题，请联系技术支持或查看项目文档。

