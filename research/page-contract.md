# 首版页面合同

## 首页 `/`

- 用户任务：判断本站能否解决当前 Early Access 的起步、Clay 或 Research 问题。
- 首要动作：进入 `First Expedition Planner`。
- 视觉重点：Steam 官方聚落、营地与地下城截图建立身份；玩法循环连接三条问题入口。
- 移动端优先级：标题、第一次远征规划器、Beginner Guide、三条问题入口、Early Access 边界和官方链接。
- 通过条件：首屏说明游戏和下一步；三条入口都是真实页面；不展示内部关键词、抓取状态或未核验事实。

## 第一次远征规划器 `/tools/first-expedition-planner`

- 用户任务：把本次远征的目的、可见准备和返回观察点整理成一条能复查的路线。
- 首要动作：Review preparation。
- 真实交互：选择目的并勾选四项准备；提交后显示空、部分或完整的准备结果；完整结果进入对应攻略，再从 planner link 返回并保留当前会话状态；每次提交还会保存到本浏览器的历史，最多比较两次状态。
- 证据边界：S001/S002 只支持宽泛循环、Early Access 和版本提醒。规划器不生成掉落率、科技前置、完整数据库或最佳顺序。
- 移动端优先级：目的选择、四项 checklist、结果标题、相关攻略按钮、返回入口。
- 通过条件：按钮有真实表单行为；空/部分/完整结果都可读；结果页和下一页都存在；返回时保留会话勾选；不依赖登录、不保存虚构数据。

## 查找与更新中心 `/library`、`/updates`

- `/library` 只索引当前三篇真实攻略，搜索/分类是导航，不把 pending 事实包装成数据库。
- `/updates` 记录站点已公开的日期和来源边界；Steam Community 的版本更新是回查入口，不伪造完整开发者 changelog。
- 两页都能回到首页和第一次远征规划器，避免把迁移样板做成单向文章堆。

## 代表页 `/guides/beginner-guide`

- 用户任务：把 settlement 准备、party、Research 和第一次 expedition 串成一个可执行起点。
- 首要动作：Follow the first expedition route。
- 允许事实：S001 官方循环、S002 版本提醒；S004/S005 只能标 unavailable，不能补视频步骤。
- 视觉重点：Quick answer 先解决任务，正文用版本和证据边界降低误导。
- 移动端优先级：Quick answer、准备清单、Clay/Research related links、Sources。
- 通过条件：正文达到机器合同深度；唯一 H1、canonical、来源和两个以上内链均可审计。

## 资源页 `/guides/how-to-get-clay`

- 用户任务：在早期敌人、商人和 Region 2 之间选择当前能承担的 Clay 路线。
- 首要动作：Compare the current Clay routes。
- 允许事实：S003 日期敏感二手观察，S001/S002 只负责系统与版本边界。
- 通过条件：数量、楼层和用途均明确标注为报告观察，不写成永久官方规则。

## 系统页 `/guides/how-to-research`

- 用户任务：使用版本锁定的 Research 表回答当前 settlement bottleneck，避免把一个构建的顺序写成永久规则。
- 首要动作：Use the safe research checklist。
- 允许事实：S001 官方 Research 与循环、S002 v0.4.17 Research-tier 显示修正和 v0.4.19 版本提醒；S008 提供 DS_B.0.4.19 的 31 条节点/前置/解锁快照，未来版本和 universal best order 仍需重验。
- 通过条件：主按钮进入 `#research-checklist`；页面补充已核验 starting conditions、具体操作和 Clay/Carapace Processing 示例，展示完整当前构建表格，机制图和文字都把可证实事实与版本边界分开。

## 版本锁定资料页 `/database`

- 用户任务：检索当前 DS_B.0.4.19 的 Research、资源、物品、单位、建筑、掉落、配方和商人表行。
- 首要动作：Browse the data reference。
- 真实交互：按类别切换、关键字过滤、分页浏览全部快照行；页面展示来源清单、提取日期、Steam build 和哈希，并回到官方更新入口与相关攻略。
- 证据边界：S008 是未修改游戏文件的 reviewed secondary extraction；它支持当前构建表行，不替代官方补丁说明，也不承诺未来值。
- 移动端优先级：版本边界、类别按钮、过滤框、行标题与字段、分页控制。

## 历史 URL 兼容

`/library/beginner-guide`、`/library/how-to-get-clay`、`/library/how-to-research` 统一 308 到对应 `/guides/...`，不进入 sitemap，也不保留错误首页 canonical。
