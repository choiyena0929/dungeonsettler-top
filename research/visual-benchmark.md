# Dungeon Settlers 视觉基准与公开文案边界

观察日期：2026-09-07。本站选择“攻略 + 现场手册 + 一条决策工具纵向切片”原型：首屏先给新玩家一个明确的 First Expedition Planner 入口，再用 Beginner、Clay、Research 三个具体任务页承接问题。三条旅程已在桌面和 390×844 移动 viewport 实测；搜索量、难度、抓取状态和内部优先级不出现在页面。

## 对标页面

| 对标 | 截图证据 | 观察区域 | 可借鉴的具体关系 | 本站落点 | 不复制 |
|---|---|---|---|---|---|
| Dungeon Settlers Guide / Wiki | `artifacts/visual-benchmark/dungeon-settlers-site.png` | 首屏大标题、宽幅实机图、右侧目录和 Quick Tips | 首屏同时给身份、下一步和目录；旁栏承担版本/行动提醒 | 首页用官方 Steam 实机截图承担身份，正文用任务入口承担下一步；不复制旁栏成品布局 | 对方的 Logo、文案、统计标签、布局、字体和自制视觉资产 |
| Steam 官方商店页 | `artifacts/visual-benchmark/steam-header.jpg`（官方静态图）；页面截图直连被关闭，见 `capture-log.json` | 官方身份图和核心玩法说明 | 一张宽幅视觉先建立游戏身份，正文再说明真实循环 | 首页与玩法区使用 Steam 官方截图的本地副本；下方接 Beginner Guide | Steam 品牌、商店按钮样式、Logo 和页面布局 |
| Prima Games Clay 指南 | `https://primagames.com/tips/how-to-get-clay-in-dungeon-settlers`（页面 URL；截图被 Cloudflare 拦截，见 `capture-log.json`） | 文章标题、Quick Answer、步骤段落和相关入口 | 具体资源问题先给直接答案，再按早期/中期路径解释，并保留相关页面入口 | `/guides/how-to-get-clay` 的结论条、来源边界和 related guide 链接 | Prima 的截图、正文、广告布局、字体与品牌组件 |

## 首页资产映射

| 区块 | 用户任务 | 资产 ID | 实现文件/组件 | 视觉职责 |
|---|---|---|---|---|
| 顶部导航 | 确认当前站点对应哪款游戏 | `dungeon-settlers-capsule` | `app/layout.tsx` | 用官方 capsule 代替抽象字母标记 |
| 首屏 | 判断这里是否解决自己的 Dungeon Settlers 早期问题 | `dungeon-settlers-hero` | `app/page.tsx` | 用官方聚落实机画面直接建立游戏身份 |
| Start here | 选择 Beginner、Clay 或 Research 入口 | `dungeon-settlers-research-loop`、`dungeon-settlers-dungeon-scene`、`dungeon-settlers-hero` | `app/page.tsx`、`app/components/game-loop-diagram.tsx` | 每个攻略入口使用不同的官方实机小图，并用营地与地下城画面解释阅读路径 |
| 官方视频 | 先看游戏实际画面再选择攻略 | `dungeon-settlers-youtube-trailer` | `app/page.tsx` | 使用 CanOpener 官方 Trailer 缩略图链接到 YouTube，不从未核验视频中提取攻略事实 |
| 第一次远征规划器 | 让目的、准备和返回观察点有视觉锚点 | `dungeon-settlers-party-portrait-01`、`02`、`03`、`04`、`dungeon-settlers-workstations-icon`、`dungeon-settlers-storage-icon` | `app/components/entity-icon-strip.tsx`、`app/components/expedition-planner.tsx`、`app/tools/first-expedition-planner/page.tsx` | settlement/party/Research/return 四项各有对应裁切图；规划器侧栏只显示额外 party、工作台和储存标识，不整排重复；不把裁切图当作独立官方素材 |

## 公开文案边界

- 可写：Steam 官方确认的 settlement、food/shelter、四人 party、research unlock、resource gathering、crafting、real-time-with-pause combat 和 Early Access 前两个 dungeon regions。
- 可写但须标来源/日期：Prima Games 报告的 Clay 敌人来源、商人和 Region 2 观察。
- 版本锁定资料库现在展示 DS_B.0.4.19 的完整 Research、资源、实体、掉落和配方表行；仍不写未来版本永久概率、universal best build、GSC/GA4 流量结果，以及未经 W3 核验的视频逐步操作。
- 首页不展示 raw keyword、Semrush volume、KD、SERP 竞争、抓取状态、AI 分析日志或内部阶段名。

## 资产来源

本站已从 Steam App 2798330 官方商店接口登记三张官方游戏截图和一张 capsule，并登记 CanOpener 官方 YouTube Trailer 缩略图，全部保存为本地生产资产。本轮新增实体小图标全部是 `settlement.jpg` 的本地裁切，裁切坐标和来源也已登记。原始页面、精确 URL、文件、使用位置和裁切规则见 `research/素材清单.json`。第三方站点只用于观察信息层级，不复制其品牌、组件皮肤、自制图片或水印素材；原创 SVG、AI 生图与抽象占位图不得承担游戏身份。

## 截图回查说明

- `dungeon-settlers-site.png` 是 2026-09-06 使用 Edge headless + 本机显式代理对公开页面的真实渲染截图。
- `artifacts/quality/migration-complete/fe21f53f-3b70-4698-9c6a-183e3a0910d9/` 保存本轮四条旅程的桌面/移动关键状态截图；`artifacts/production/migration-journey.json` 记录同一 runId、8 个 viewport、3 条旧路径、内链、横向溢出和脚本错误结果。
- `steam-header.jpg` 是早期构图观察文件；生产页面实际使用的三张官方截图及其精确来源记录在 `research/素材清单.json`。
- Steam HTML 页和 Prima HTML 页的本地截图尝试分别留下了真实连接关闭/Cloudflare 阻断画面；这些文件不作为设计绿灯，只保留在 `artifacts/visual-benchmark/` 供回查。
