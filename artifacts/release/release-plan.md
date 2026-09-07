# Dungeon Settlers 第一份已上线站完整度迁移样板发布计划

## 发布链

本次发布只允许沿着以下链路推进：

`GitHub main upstream → Cloudflare Worker dungeonsettler-top → dungeonsettlers.top`

发布输入为当前仓库 `main` 分支的真实提交。本次发布是 Dungeon Settlers 的 visitor-complete 迁移收尾：包含首轮远征规划工具、首页入口、资料库/更新入口、三页任务攻略、版本锁定资料索引、真实游戏素材和旧路径兼容；未来版本行为与 universal best order 仍保持边界，不包装为已完成事实。Cloudflare 发布前必须保留 `verify:release`、页面合同、逐 URL On-page SEO、代表页桌面/移动截图、独立 fresh-context 审阅、完整度检查和阶段证据。

## 发布目标

- 主域名：`https://dungeonsettlers.top`
- Worker：`dungeonsettler-top`
- 备用主机：`https://www.dungeonsettlers.top`
- 构建目录：`dist`
- 发布命令：`npm run deploy:cloudflare`

## 本次迁移闭环

- 用户旅程：`/` → `/tools/first-expedition-planner` → 勾选四项并生成计划 → `/guides/beginner-guide` → 返回规划工具。
- 代表页：`/tools/first-expedition-planner`。
- 当前成熟度：`visitor-complete`；`npm run check:completeness` 与 `npm run check:complete-site` 都必须通过。未来版本刷新、universal best order 和无证据 P2 需求仍按缺口保留。

## 生产验收

部署后必须从公开 HTTPS 入口重新检查首页、代表页、robots.txt、sitemap.xml、404、HTTPS 响应和八个正式 URL 的 On-page SEO，并在正式域名用真实浏览器复验 Clay、Planner、Research 三条闭环以及资料库查找。生产验收只接受真实 HTTP 响应；本地截图、模板 JSON 和示例收据不能替代生产证据。

## 回滚与失败记录

若 Worker、域名、TLS、路由或生产页面验收失败，保留失败响应和命令输出，在 `artifacts/failures/` 写入责任阶段、失败类型、证据等级（L0-L4）及改变后的重试方式；不手改状态卡，也不把失败状态改写为通过。回滚目标为上一个已验收的 Cloudflare Worker 版本。
