# 第一份已上线站完整度迁移样板页面矩阵

本轮基线：`research/站点完整度.json` 为 `ready` + `launch-slice`。已实现的纵向样板是“首页 → 第一次远征规划器 → 结果 → Beginner 承接页 → 返回规划器”；其他两条旅程只登记为 planned，不能当成已闭环。

| 路径 | 访客问题 | 页面角色 | 首要动作 | 来源边界 | 状态 |
|---|---|---|---|---|---|
| `/` | 我刚开始 Dungeon Settlers，先从哪里看？ | 入口首页 | 进入 First Expedition Planner | S001/S002；S004/S005 不可分析，不供事实 | implemented |
| `/tools/first-expedition-planner` | 第一次远征前，哪些准备和返回问题要先写清楚？ | 可重复决策工具 | Build my route | S001/S002；不计算隐藏数值、完整科技树或最佳顺序 | implemented |
| `/guides/beginner-guide` | 第一次建 settlement 和下 dungeon 要先做什么？ | 代表攻略页 | Follow the first expedition route | S001/S002；研究顺序不编造 | implemented |
| `/guides/how-to-get-clay` | Clay 从哪里来？ | 资源攻略页 | Compare the current Clay routes | S001/S002/S003；掉落数量为日期敏感二手观察 | implemented |
| `/guides/how-to-research` | Research 如何帮助下一次 expedition？ | 系统攻略页 | Use the safe research checklist | S001/S002；完整研究树保持 pending_verification | implemented |
| `/library` | 已发布的攻略里，哪一页对应当前问题？ | 攻略查找中心 | Search the guide library | S001/S002/S003；只索引已有真实页面 | implemented |
| `/updates` | 哪些结论需要在 Early Access 更新后重查？ | 日期更新入口 | Recheck a first run | S001/S002/S003；不伪造完整开发者 changelog | implemented |

## 扩页停止条件

迁移样板只把第一次远征工具做成已实现的可重复旅程。Clay 和 Research 旅程已有页面，但仍先保留为 planned，等真实承接路径和独立复核完成后再推进。level up、gold、food、bone 只留在内部观察记录，直到有新的来源覆盖、页面合同和代表页质量证据。
