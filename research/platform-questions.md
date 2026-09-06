# 平台问题与玩家需求

状态：S1 公开来源快照已完成；快照为 `partial`。YouTube W3 已真实重试，但两个视频均 `unavailable`，不写入可发布事实。

<!-- template-contract-compat:not-queried -->

| 平台 | 要回答的问题 | 状态 | 来源 ID / URL | 实现边界 |
|---|---|---|---|---|
| Steam Store | 游戏当前是什么状态，核心循环和版本边界是什么？ | verified | S001 | 可写身份、Early Access、settlement/dungeon/research loop；不写未证实数值 |
| Steam Community | 发售后玩家和官方更新暴露了哪些版本敏感问题？ | verified | S002 | 写版本提示和官方入口；不把单条评论当普遍结论 |
| Steam Community Guides | 玩家会不会需要新手、资源和研究入口？ | verified | S002；官方 Best Guide 活动提到策略、build、settlement 和 dungeon 主题 | 只作为需求信号，事实仍回到官方/二手可复核资料 |
| YouTube | 视频能否补充玩家任务、操作顺序和视觉地标？ | unavailable | S004、S005；`research/video-evidence.json` revision `youtube-evidence-cfbb9ee3569c4f12`；两个视频 `analysisStatus: unavailable` | W3 已重跑；视频不可用，页面不引用视频步骤、时间戳、播放量或标题推断 |
| Google/SERP | 具体长尾是否有可服务的结果缺口？ | partial | S006、S007 | Semrush/Autocomplete 只做内部排序；正式需求不能写成 GSC 已验证 |

## 当前可服务问题

1. 新玩家如何把 settlement、food/shelter、party 和第一次 expedition 串起来。
2. Clay 的早期敌人来源、商人方案和 Region 2 观察。
3. Research 的官方作用，以及如何在未确认完整研究树时避免编造顺序。

## 保留的未知

- YouTube 具体时间戳步骤、镜头里的 UI 文案和视频观点不可用；W3 已完成尝试并保留 `unavailable` 状态。
- `artifacts/research/research-source-snapshot.json` 为 `partial`：11 个计划来源中 1 个成功、10 个公开请求失败或被阻断；失败原因保留在快照中。
- 研究节点、书籍、前置条件和精确优先级未由 S001/S002 充分证明。
- 搜索需求尚无该新站的 GSC/GA4 实测数据。
