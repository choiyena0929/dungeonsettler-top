# 内容状态

- 当前阶段：S3-S6 按迁移样板重新验收；GSC、GA4 或 Clarity 仍不推进，站点完整度基线为 `ready` + `launch-slice`。
- 代表旅程：`/` → `/tools/first-expedition-planner` → hold/ready 结果 → `/guides/beginner-guide` → 返回 planner。工具结果来自访客本次勾选，不写入或计算未核验游戏数据。
- 页面家族：首页、工具、三篇攻略、Guide library、Guide updates；Clay 和 Research 已有真实页面，但对应完整用户旅程仍登记为 planned。
- 视觉：官方 Steam capsule、三张官方游戏截图、官方 Trailer 缩略图，以及从官方 settlement 截图裁切的 4 个 party portrait 和 Workstations/Storage 两个游戏内分类图标。
- 事实边界：S001 为官方玩法和版本边界；S003 为二手 Clay 观察；S004/S005 仅作为已尝试但不可分析的视频参考，不提供前台事实。
- 未知状态：研究树前置、书籍/节点规则、完整掉落表、概率和最佳顺序均为 `pending_verification`。
- 扩页：本轮只新增一个承接工具和两个导航型页面，不扩展 level up、gold、food、bone 或完整实体数据库。
- 完全体门槛：`npm run check:complete-site` 预期继续失败，原因是目前只有一条已实现旅程，尚未实现三条旅程、跨局重复价值和完整资料库条件。
