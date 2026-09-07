# Dungeon Settlers 视觉基准与公开文案边界

观察日期：2026-09-06。本站选择“攻略优先 + 现场手册”原型：首屏先给新玩家一个明确的 Beginner Guide 入口，再用两个具体任务页承接资源和研究问题。搜索量、难度、抓取状态和内部优先级不出现在页面。

## 对标页面

| 对标 | 截图证据 | 观察区域 | 可借鉴的具体关系 | 本站落点 | 不复制 |
|---|---|---|---|---|---|
| Dungeon Settlers Guide / Wiki | `artifacts/visual-benchmark/dungeon-settlers-site.png` | 首屏大标题、宽幅实机图、右侧目录和 Quick Tips | 首屏同时给身份、下一步和目录；旁栏承担版本/行动提醒 | 首页用官方 Steam 实机截图承担身份，正文用任务入口承担下一步；不复制旁栏成品布局 | 对方的 Logo、文案、统计标签、布局、字体和自制视觉资产 |
| Steam 官方商店页 | `artifacts/visual-benchmark/steam-header.jpg`（官方静态图）；页面截图直连被关闭，见 `capture-log.json` | 官方身份图和核心玩法说明 | 一张宽幅视觉先建立游戏身份，正文再说明真实循环 | 首页与玩法区使用 Steam 官方截图的本地副本；下方接 Beginner Guide | Steam 品牌、商店按钮样式、Logo 和页面布局 |
| Prima Games Clay 指南 | `https://primagames.com/tips/how-to-get-clay-in-dungeon-settlers`（页面 URL；截图被 Cloudflare 拦截，见 `capture-log.json`） | 文章标题、Quick Answer、步骤段落和相关入口 | 具体资源问题先给直接答案，再按早期/中期路径解释，并保留相关页面入口 | `/guides/how-to-get-clay` 的结论条、来源边界和 related guide 链接 | Prima 的截图、正文、广告布局、字体与品牌组件 |

## 首页资产映射

| 区块 | 用户任务 | 资产 ID | 实现文件/组件 | 视觉职责 |
|---|---|---|---|---|
| 首屏 | 判断这里是否解决自己的 Dungeon Settlers 早期问题 | `dungeon-settlers-hero` | `app/page.tsx` | 用官方聚落实机画面直接建立游戏身份 |
| Start here | 选择 Beginner、Clay 或 Research 入口 | `dungeon-settlers-research-loop`、`dungeon-settlers-dungeon-scene` | `app/components/game-loop-diagram.tsx` | 用官方营地和地下城画面解释“先准备 settlement，再进行 expedition”的阅读路径 |

## 公开文案边界

- 可写：Steam 官方确认的 settlement、food/shelter、四人 party、research unlock、resource gathering、crafting、real-time-with-pause combat 和 Early Access 前两个 dungeon regions。
- 可写但须标来源/日期：Prima Games 报告的 Clay 敌人来源、商人和 Region 2 观察。
- 暂不写：完整研究树、所有节点前置、永久掉落概率、最佳 build、完整配方、GSC/GA4 流量结果，以及未经 W3 核验的视频逐步操作。
- 首页不展示 raw keyword、Semrush volume、KD、SERP 竞争、抓取状态、AI 分析日志或内部阶段名。

## 资产来源

本站已从 Steam App 2798330 官方商店接口登记三张官方游戏截图，并保存为本地生产资产。原始页面、精确 CDN URL、文件、使用位置和裁切规则见 `research/素材清单.json`。第三方站点只用于观察信息层级，不复制其品牌、组件皮肤、自制图片或水印素材；原创 SVG、AI 生图与抽象占位图不得承担游戏身份。

## 截图回查说明

- `dungeon-settlers-site.png` 是 2026-09-06 使用 Edge headless + 本机显式代理对公开页面的真实渲染截图。
- `steam-header.jpg` 是早期构图观察文件；生产页面实际使用的三张官方截图及其精确来源记录在 `research/素材清单.json`。
- Steam HTML 页和 Prima HTML 页的本地截图尝试分别留下了真实连接关闭/Cloudflare 阻断画面；这些文件不作为设计绿灯，只保留在 `artifacts/visual-benchmark/` 供回查。
