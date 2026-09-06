# Dungeon Settlers Agent 规则

- 只处理 dungeonsettlers.top。
- 先读 PROJECT_LOCK.md、RELEASE_POLICY.md 和 research/。
- 开始或恢复阶段工作前，先运行 AI Web 工作台 npm run site:resume -- --site-path <站点> --state <状态卡>；它只读输出当前阶段、state_revision、缺项和下一动作，不能用聊天记忆判断进度。
- 只使用已核验来源，不把关键词指标或内部研究写入公开页面。
- S2 页面合同完成后，先参考 research/research-pack-input.example.json 整理结构化交接；机器页面合同每页必须填写 primaryAction、requiredSections、sourceRefs、minWords 和 minInternalLinks，sourceRefs 必须能回查 research/source-manifest.md；research/platform-questions.md 必须留下平台问题的真实记录；not-queried 或 pending 会阻塞 research-pack，只有完成真实核验或写明理由的 not-applicable 才能继续；再用 AI Web 工作台 research-pack.mjs 生成 artifacts/research/research-pack.json；research-pack 通过后才能进入页面实现。
- 涉及首页、路由、组件或视觉系统时，必须遵守 ai-web-frontend-system，读取前端系统、设计合同和素材闭环；不能只凭构建通过放行页面。
- 先完成一个代表页的两轮截图质量闭环，再扩页。
- npm run audit:onpage -- --base-url <地址> --handoff-id <当前交接> --input-revision <当前修订> 只能生成标准 artifacts/quality/seo-routes.json；随后必须运行 npm run check:onpage，发布前再运行 npm run verify:release，缺失或重复 SEO 报告时不得部署。
- S7-S9 只能使用 artifacts/postlaunch/S7-integrations.json、S8-ads.json 和 S9-observation.json 的结构化产物；.example.json 只有字段示例，不能作为通过证据。启用广告必须有用户明确确认，移动端必须同时有截图和网络检查。S9 是持续观察循环，刷新观察证据不递增状态修订。
- 禁止直接修改状态卡的 current_phase、phase_status 或 state_revision；阶段完成或阻塞必须调用 AI Web 工作台 site-phase.mjs，并保存 artifacts/phases/ 证据。新阶段证据要带 executionContractVersion: 1 和统一 execution 回执；失败或重开必须写失败类型、L0—L4 证据等级、说明与重试变化，不能只写 error。
