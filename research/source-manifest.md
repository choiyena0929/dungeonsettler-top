# Dungeon Settlers 来源清单

本文件沿用 data-to-decision-site-starter template 的来源字段合同；内容已替换为本站真实来源与证据状态。

状态：S1 资料已整理，公开事实按来源和版本边界使用。核验日期：2026-09-06（Asia/Shanghai）。

## 身份与官方玩法

### S001 — Steam 官方商店页

- URL：<https://store.steampowered.com/app/2798330/Dungeon_Settlers/>
- 观察：2026-09-06；页面显示 2026-09-04 发布，Early Access，开发者/发行方为 CanOpener 与 WhisperGames。
- 支持事实：游戏把 colony simulation 与 dungeon crawling 结合；玩家要建设 settlement、提供食物和住所、管理 expedition、探索 dungeon、收集资源、制作装备、研究科技，并使用 real-time-with-pause combat。官方还写明 party 最多四人、死亡不可回归、当前 Early Access 可玩前两个 dungeon regions。
- 可公开使用：是；页面使用独立站措辞并链接回官方 Steam，不暗示官方合作。
- 版本边界：Early Access 0.4 系列附近；具体数值、研究树和资源掉落不由这页单独证明。

### S002 — Steam Community Hub / 官方更新

- URL：<https://steamcommunity.com/app/2798330/>
- 观察：2026-09-06；官方更新区显示 v0.4.17（2026-09-05），包括招募肖像锁定、背景静音、保存版本提示、战斗改动、研究层级显示修正和 Inventory guide 控制补充。
- 支持事实：游戏在 Early Access 发售后仍有快速修订；版本敏感的攻略需要保留补丁日期，不能把旧 Demo 资料当作当前规则。
- 可公开使用：是；只总结更新边界和官方入口。

### S003 — Prima Games Clay 指南

- URL：<https://primagames.com/tips/how-to-get-clay-in-dungeon-settlers>
- 观察：2026-09-06；文章发表于 2026-09-05。
- 支持事实：文章报告 Acid Slogels 从 Floor 3 起出现并可能掉 2 Clay，Predatory Frogs 可掉 5 Clay；商人适合较大数量，Region 2 的 Clay 更容易获得；文章还列出 Kiln、Ceramics、Farm、Leather Workstation、Casting Workbench 等用途。
- 证据等级：reviewed / secondary；这些掉落数量和出现楼层必须写明“Prima Games 记录的当前观察”，并接受 Early Access 改动，不能写成永久官方表。
- 可公开使用：是；采用改写和来源链接，不复制截图或正文。

## 视频与玩家问题

### S004 — CanOpener 官方 Gameplay Trailer

- URL：<https://www.youtube.com/watch?v=BkGIa5V39-w>
- 观察：2026-09-07；YouTube oEmbed 返回标题 `Dungeon Settlers – Official Gameplay Trailer`、作者 `CanOpener` 与频道入口；缩略图为 `https://i.ytimg.com/vi/BkGIa5V39-w/hqdefault.jpg`。
- 用途：补充玩家对 settlement、expedition 和 dungeon loop 的理解；视频只作为补充证据，字幕/画面未核验的细节不能直接进页面。
- 公开使用：可在首页放置缩略图和官方 YouTube 外链；不把未完成的视频分析改写成攻略事实。
- W3 状态：首次运行被空白机器页面合同挡住，已记录失败收据；合同修复后已重跑，`research/video-evidence.json` 将该视频标为 `analysisStatus: unavailable`，不提供前台事实。

### S005 — 近期玩家向视频

- URL：<https://www.youtube.com/watch?v=FxqGcrey9S8>
- 观察：2026-09-06；机会流水线记录为近期 Dungeon Settlers review / first-look 视频。
- 用途：补充新玩家会问哪些入口和早期决策；不作为掉落、研究前置或数值的唯一证明。
- W3 状态：合同修复后已重跑，`research/video-evidence.json` 将该视频标为 `analysisStatus: unavailable`，不把不可分析改写成已核验或无需求。

### S006 — 机会阶段 Semrush 与 Autocomplete 证据（内部）

- 文件：`D:\Obsidian\zwk-AI1\20_项目\AI Web\AI Web 工作台\data\opportunity-runs\game-opportunity-2026-09-06-59995249c82e\semrush-magic.json` 及对应 `demand-evidence.json`。
- 观察：2026-09-06；包含 `dungeon settlers` volume 320 / KD 33、`dungeon settlers steam` volume 2,900，以及 clay、research、level up、gold、food、bone 等任务型 Autocomplete 词簇。
- 使用边界：只用于内部页面优先级和研究排序；不等同 Google Search Console 需求，不进入前台。

### S007 — 机会流水线来源覆盖收据

- 文件：`D:\Obsidian\zwk-AI1\20_项目\AI Web\AI Web 工作台\data\opportunity-pipelines\pipeline-2026-09-06-df9fc7cfb3\source-coverage.json`。
- 观察：机会阶段 Steam/itch 自动采集有失败，公开 Web 回退保留了可用证据，整体状态为 `partial`。
- 使用边界：记录资料缺口和责任阶段，不把 `partial` 改写成 `success`；需要重新核验的具体机制标为 `pending_verification`。

## 权利和素材边界

- 官方 Steam/YouTube 页面用于事实回查与官方入口链接；第三方文章截图、视频帧和带站点水印的图片不进入生产素材。
- 首页使用 Steam App 2798330 官方商店接口返回的三张游戏截图与 capsule 图，并使用 CanOpener 官方 YouTube Trailer 缩略图作为视频入口；原始 URL、本地文件、渲染位置和裁切规则逐项登记在 `research/素材清单.json`，生产页面使用本地副本。
- 游戏身份区禁止原创 SVG、AI 生图和抽象占位图。CSS 与通用图标只负责排版和交互状态。
- Prima 图片、YouTube 缩略图和社区截图不进入本站 `public/`，只保留 URL 作为研究和视觉观察依据。
