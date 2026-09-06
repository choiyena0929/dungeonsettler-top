# Dungeon Settlers 正式发布计划

## 发布链

本次发布只允许沿着以下链路推进：

`GitHub main upstream → Cloudflare Worker dungeonsettler-top → dungeonsettlers.top`

发布输入为当前仓库 `main` 分支的真实提交。Cloudflare 发布前必须保留 `verify:release`、页面合同、逐 URL On-page SEO、代表页桌面/移动截图、独立 fresh-context 审阅和阶段证据。

## 发布目标

- 主域名：`https://dungeonsettlers.top`
- Worker：`dungeonsettler-top`
- 备用主机：`https://www.dungeonsettlers.top`
- 构建目录：`dist`
- 发布命令：`npm run deploy:cloudflare`

## 生产验收

部署后必须从公开 HTTPS 入口重新检查首页、代表页、robots.txt、sitemap.xml、404、HTTPS 响应和四个正式 URL 的 On-page SEO。生产验收只接受真实 HTTP 响应；本地截图、模板 JSON 和示例收据不能替代生产证据。

## 回滚与失败记录

若 Worker、域名、TLS、路由或生产页面验收失败，保留失败响应和命令输出，在 `artifacts/failures/` 写入责任阶段、失败类型、证据等级（L0-L4）及改变后的重试方式；不手改状态卡，也不把失败状态改写为通过。回滚目标为上一个已验收的 Cloudflare Worker 版本。
