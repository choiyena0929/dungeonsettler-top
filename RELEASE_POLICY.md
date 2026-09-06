# 发布规则

- S0-S4 证据完整且由 site-phase.mjs 推进到 S5 后才能进入发布准备。
- 发布前核对 Git remote、upstream、完整 diff、构建、测试、素材、公开文案和质量产物；audit:onpage 生成标准 seo-routes.json 后必须运行 check:onpage，部署前必须运行 verify:release，确保报告与当前交接一致。
- 只有用户目标包含部署时才上线；广告、账号后台和不可逆变更分别遵守上站总控授权边界。
