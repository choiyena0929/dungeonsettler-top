# Data-to-Decision Site Starter

一个可放进私有仓库、用于快速搭建垂直内容站与决策工具站的模板。它适合游戏攻略、软件选型、产品数据库、工具目录和高意图知识站；多语言可按同一份数据合同继续扩展。

## 模板已经带什么

- 结构化内容数据：分类、标签、更新时间、证据等级与正文统一放在 `app/content.ts`。
- 内容目录与站内搜索：搜索和分类筛选直接读取同一份内容数据。
- 可静态生成的详情页：每个条目都有独立 URL、标题和描述。
- SEO 基线：`sitemap.xml`、`robots.txt`、`WebSite/SearchAction`、`ItemList` JSON-LD。
- 更新合同：将内容更新、受影响路由和复核说明公开化。
- 前端系统：提供多游戏站通用的前端执行规则，以及每个站独立填写的设计合同模板。
- Cloudflare Worker 构建与发布脚本：发布前会先执行完整检查。
- GitHub Actions：每次推送自动检查模板是否可构建。

## 从热词到第一版网站

1. 复制此仓库，修改 `app/site-config.ts`：站名、域名、导航和语言。
2. 修改 `app/content.ts`：先填 10–30 条真实问题、答案、分类和标签。
3. 需要选择器时，在 `app/components/` 新建针对该领域的筛选/比较组件；不要把业务规则塞进页面文案。
4. 复制 `前端系统.md` 和 `设计合同模板.md`，先填写站点原型、首要动作、Token 和页面合同；同步完成 `research/page-contracts.json`。每页都要写清 `primaryAction`、`requiredSections`、`sourceRefs`、`minWords` 和 `minInternalLinks`，并确保来源 ID 能回查 `research/source-manifest.md`，再做首个真实页面。
5. 执行 `npm run verify`。通过后用 `npm run dev` 查看桌面与移动端，并运行 `npm run audit:onpage -- --base-url http://127.0.0.1:<端口> --handoff-id <交接ID> --input-revision <输入修订>`。
6. 在 Cloudflare 创建 Worker 与域名绑定；初始化交接会生成 `artifacts/release/deployment-contract.json`，发布脚本从合同读取 Worker 名称，执行 `npm run deploy:cloudflare`。
7. 发布后访问正式域名，确认首页、代表页、404、`/sitemap.xml` 与 `robots.txt` 正常；再把同一份 On-page 审计跑到正式 HTTPS 域名，保存为生产证据。

## 素材闭环（新站与首页重做必做）

内容来源和视觉素材分开维护。先完成 research/素材清单.json，再填写视觉基准和设计合同：

1. 每个首页登记至少两个不同角色的游戏视觉锚点：一个建立游戏身份，一个连接核心玩法。
2. 每个资产写明来源、权利依据、本地路径、渲染路由、实现文件、裁切规则和 alt。
3. 把资产 ID 同时写进 research/visual-benchmark.md 与 设计合同.md，不能只写“放一张有游戏感的图”。
4. 保存首页桌面与移动截图到 artifacts/visual/，再运行 npm run check:assets。

CSS 纹理、通用图标和生成的氛围图只能辅助排版。它们不能替代没有获确认来源的游戏视觉资产，也不能让页面通过视觉验收。

正式站点必须把素材清单的 phase 从 template 改为 ready；模板目录本身保留 template 是正常的。

## 需要替换的文件

| 文件 | 作用 |
| --- | --- |
| `app/site-config.ts` | 品牌、域名、导航 |
| `app/content.ts` | 内容条目、证据等级、更新记录 |
| `app/components/library-search.tsx` | 搜索与筛选交互 |
| `app/globals.css` | 视觉系统 |
| `app/updates/page.tsx` | 更新与复核展示方式 |
| `前端系统.md` | 前端执行规则与验收门 |
| `设计合同.md` | 当前站点的颜色、字体、页面和动效合同 |
| `research/素材清单.json` | 游戏视觉资产的权利、路径、页面绑定和截图证据 |
| `research/page-contracts.json` | S2 与逐 URL SEO 验收共用的机器页面合同，锁定主动作、章节、来源、内容深度和内链下限 |
| `scripts/检查素材使用.mjs` | 素材是否真正进入页面的本地审计 |
| `scripts/检查发布目标.mjs` | 拒绝 Sites 托管残留，只允许 Cloudflare Worker 正式链路 |
| `scripts/审计页面SEO.mjs` | 按机器页面合同检查本地与生产页面的 On-page SEO |

## 验证与发布

```bash
npm run verify
npm run dev
npm run audit:onpage -- --base-url http://127.0.0.1:3000 --handoff-id <交接ID> --input-revision <输入修订>
npm run deploy:cloudflare
```

不要提交 `.env`、Cloudflare Token、真实数据库 ID、用户数据或受版权限制的第三方素材。

## 前端参考资源的使用顺序

默认先用项目自己的 CSS 和语义 Token，再按页面需要参考 [shadcn/ui](https://ui.shadcn.com/)。只有页面确实需要复杂数据交互时，才参考 [ReUI](https://reui.io/components/)；动效最后参考 [Transitions.dev](https://transitions.dev/) 或 [beUI](https://beui.dev/)。[Beautiful UI](https://www.beautifului.dev/) 只留给未来的 AI 界面，[Rare UI](https://www.rareui.com/) 一个站最多选一个记忆点。

不要把这些网址全部变成默认依赖，也不要把参考页面的品牌、文案、图片或成品布局直接复制进站点。

## 页面质量采集

代表页完成后，用同一个确定性入口采集桌面端和移动端全页截图：

```powershell
npm run capture:quality -- --base-url http://127.0.0.1:3000 --route / --round-id representative-first --handoff-id <handoff-id> --input-revision <input-revision> --implementer-id <implementer-id>
```

命令会把真实 viewport、页面尺寸、横向溢出、DOM SHA-256 和 PNG SHA-256 写进 `artifacts/quality/quality-run.json`。同一轮次重跑会替换旧记录；采集完成仍是 `in-progress`，不能代替独立视觉审阅，也不会自动写成 `passed`。

截图采集完成后，生成给实现者之外的审阅者使用的交接包：

```powershell
npm run prepare:review
```

它会校验最近一轮 PNG 与哈希，并写入 `artifacts/quality/independent-review-packet.json`。审阅者必须在 fresh context 中填写 `artifacts/quality/quality-review.json`，把 `reviewedRoundId` 填为交接包的 `latestRound.id`，身份不能与 `quality-run.json` 的 `implementerId` 相同。截图轮次变化后必须重新生成交接包并重新审阅。

本机存在 Codex CLI 时，可以让独立审阅自动运行在一次临时、只读的 fresh context 中：

```powershell
npm run review:run
```

该命令只把桌面/移动真实截图作为图片输入，读取交接包列出的合同，校验模型返回的五项标准后才写入 `quality-review.json`，并同步 `quality-run.json` 与 `independent-review-run.json`。它不会修改代码、部署或调用外部后台；Codex CLI 不存在、超时或返回不合格 JSON 时，审阅保持失败，不会伪造通过。需要指定 CLI 路径时使用 `-- --codex-path <codex.exe>`；可用 `-- --dry-run` 只检查交接和派发参数。
