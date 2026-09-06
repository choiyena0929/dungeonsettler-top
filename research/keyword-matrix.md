# Dungeon Settlers 关键词矩阵

本文件沿用 data-to-decision-site-starter template 的机器校验字段；以下内容已替换为 Dungeon Settlers 实际研究，不是示例数据。

核验日期：2026-09-06。以下资料分为内部需求信号和公开页面输入；搜索量、难度、SERP 观察和机会优先级不进入前台文案。

## 需求信号（内部）

| 词或词簇 | 意图 | 实测信号 | 证据 | 处理 |
|---|---|---|---|---|
| dungeon settlers | 游戏识别 / 进入游戏 | US Semrush volume 320，KD 33 | S006 | 作为首页自然标题和官方入口上下文，不单独做词页 |
| dungeon settlers steam | 商店与当前版本确认 | US Semrush volume 2,900，KD 未提供 | S006 | 首页和版本说明的官方 Steam 入口 |
| dungeon settlers beginner guide | 新玩家想知道第一轮如何展开 | 由已确认首版范围、Steam 官方核心循环和近期视频需求共同支持 | S001、S004、S005 | 首页 + `/guides/beginner-guide` |
| dungeon settlers clay / how to get clay | 资源卡点、寻找来源与用途 | Autocomplete 形成具体资源任务；Prima Games 已给出当前来源 | S003、S006 | `/guides/how-to-get-clay` |
| dungeon settlers how to research | 研究解锁和优先级困惑 | Autocomplete 形成具体研究任务；Steam 官方确认研究会解锁建筑和装备 | S001、S006 | `/guides/how-to-research`，未知机制显式保留 |
| dungeon settlers how to level up / gold / food / bone | 后续可观察任务簇 | Autocomplete 有信号，但本轮首版不扩页 | S006 | 记录为观察，不进入首版 |

## 页面输入

| 页面 | 访客自然问题 | 允许回答的范围 | 当前状态 |
|---|---|---|---|
| `/` | “我刚开始 Dungeon Settlers，先从哪里看？” | 游戏身份、Early Access 边界、三条已核验入口 | approved |
| `/guides/beginner-guide` | “第一次建 settlement 和下 dungeon 要先做什么？” | 官方描述的 settlement、food/shelter、party、research、expedition loop | approved |
| `/guides/how-to-get-clay` | “Clay 从哪里来，什么时候不该继续硬刷？” | Prima 的敌人、商人、Region 2 说法；数值标为来源和版本边界 | approved |
| `/guides/how-to-research` | “Research 具体解决什么，怎样避免凭旧资料乱排顺序？” | 官方确认的 unlock 作用；具体节点、书籍、前置条件暂不编造 | approved-with-unknowns |

## 缺口与停止条件

- Steam/itch 自动采集在机会阶段出现过部分失败，已保留 `partial`；本轮只使用可回查的官方页面和公开二手来源，不把失败写成零结果。证据见 S007。
- Semrush 需求信号是内部优先级输入，不能代替 Google 真实点击，也不能作为前台事实。S006 的具体数值只留在研究目录。
- 新站没有 GSC/GA4 数据；本轮不能声称已有曝光、点击或转化。
- 任何无法从 S001—S005 复核的研究树、掉落概率、完整配方和最佳顺序保持 `pending_verification`。
