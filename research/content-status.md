# 内容状态

- 当前阶段：S3-S6 按迁移样板重新验收；GSC、GA4 或 Clarity 仍不推进，站点完整度已通过严格 visitor-complete 门。
- 代表旅程：Clay 搜索 → `/guides/how-to-get-clay` → 来源 → planner；planner 空/部分/完整结果 → 对应攻略 → 返回并保留会话；Research 前置条件 → checklist → planner/updates。工具结果来自访客本次勾选，不写入或计算未核验游戏数据。
- 页面家族：首页、工具、三篇攻略、Guide library、Guide updates、版本锁定资料库；三条主要旅程已登记为 implemented，并由同一轮桌面/移动浏览器收据覆盖。
- 视觉：官方 Steam capsule、三张官方游戏截图、官方 Trailer 缩略图，以及从官方 settlement 截图裁切的 4 个 party portrait 和 Workstations/Storage 两个游戏内分类图标。
- 事实边界：S001 为官方玩法和版本边界；S003 为二手 Clay 观察；S004/S005 仅作为已尝试但不可分析的视频参考，不提供前台事实。
- 事实边界：S008 已补齐 DS_B.0.4.19 的 31 条 Research、62 条资源、244 条物品、111 条单位、559 条建筑、244 条掉落、163 条配方和 8 条商人池；未来版本、实机冲突和 universal best order 仍需重验。
- 扩页：新增一个版本锁定资料库，并把 Planner 的历史/比较能力落到浏览器本地；level up 等没有来源的页面仍不扩展。
- 完全体门槛：`npm run check:completeness` 与 `npm run check:complete-site` 均通过；通过依据是代码、来源收据和桌面/移动实测，未靠修改状态字段伪造。
