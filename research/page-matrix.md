# 第一份已上线站完整度迁移样板页面矩阵

本轮基线：`research/站点完整度.json` 为 `ready` + `launch-slice`。本轮实际验收了三条纵向旅程：Clay 搜索 → canonical 攻略 → 来源 → planner、planner 空/部分/完整结果 → 攻略 → 返回保留状态、Research 前置条件 → checklist → planner/更新。完整度仍保留 launch-slice，因为完整 Research 资料库和跨局价值尚未有证据。

| 路径 | 访客问题 | 页面角色 | 首要动作 | 来源边界 | 状态 |
|---|---|---|---|---|---|
| `/` | 我刚开始 Dungeon Settlers，先从哪里看？ | 入口首页 | 进入 First Expedition Planner | S001/S002；S004/S005 不可分析，不供事实 | implemented |
| `/tools/first-expedition-planner` | 第一次远征前，哪些准备和返回问题要先写清楚？ | 可重复决策工具 | Review preparation | S001/S002；不计算隐藏数值、完整科技树或最佳顺序 | implemented |
| `/guides/beginner-guide` | 第一次建 settlement 和下 dungeon 要先做什么？ | 代表攻略页 | Follow the first expedition route | S001/S002；研究顺序不编造 | implemented |
| `/guides/how-to-get-clay` | Clay 从哪里来？ | 资源攻略页 | Compare the current Clay routes | S001/S002/S003；掉落数量为日期敏感二手观察 | implemented |
| `/guides/how-to-research` | Research 如何帮助下一次 expedition？ | 系统攻略页 | Use the safe research checklist | S001/S002；完整研究树保持 pending_verification | implemented |
| `/library` | 已发布的攻略里，哪一页对应当前问题？ | 攻略查找中心 | Search the guide library | S001/S002/S003；只索引已有真实页面 | implemented |
| `/updates` | 哪些结论需要在 Early Access 更新后重查？ | 日期更新入口 | Recheck a first run | S001/S002/S003；不伪造完整开发者 changelog | implemented |

## 旧路径兼容

`/library/beginner-guide`、`/library/how-to-get-clay`、`/library/how-to-research` 是可达的历史 URL，统一返回 308 到对应 `/guides/...` canonical 页面；它们不进入 sitemap，也不作为独立内容页计数。

## 扩页停止条件

三条旅程已经按桌面和 390×844 移动 viewport 实测，旧路径也完成兼容检查。level up、gold、food、bone 只留在内部观察记录，直到有新的来源覆盖、页面合同和代表页质量证据。
