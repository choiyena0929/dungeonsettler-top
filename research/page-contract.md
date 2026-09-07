# 首版页面合同

## 首页 `/`

- 用户任务：判断本站能否解决当前 Early Access 的起步、Clay 或 Research 问题。
- 首要动作：进入 `First Expedition Planner`。
- 视觉重点：Steam 官方聚落、营地与地下城截图建立身份；玩法循环连接三条问题入口。
- 移动端优先级：标题、第一次远征规划器、Beginner Guide、三条问题入口、Early Access 边界和官方链接。
- 通过条件：首屏说明游戏和下一步；三条入口都是真实页面；不展示内部关键词、抓取状态或未核验事实。

## 第一次远征规划器 `/tools/first-expedition-planner`

- 用户任务：把本次远征的目的、可见准备和返回观察点整理成一条能复查的路线。
- 首要动作：Build my route。
- 真实交互：选择目的并勾选四项准备；提交后显示缺项 hold 或四步 ready 结果；结果进入对应攻略，再从 planner link 返回。
- 证据边界：S001/S002 只支持宽泛循环、Early Access 和版本提醒。规划器不生成掉落率、科技前置、完整数据库或最佳顺序。
- 移动端优先级：目的选择、四项 checklist、结果标题、相关攻略按钮、返回入口。
- 通过条件：按钮有真实表单行为；ready/hold 两种结果都可读；结果页和下一页都存在；不依赖登录、不保存虚构数据。

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

- 用户任务：使用 Research 回答当前 settlement bottleneck，避免假设完整科技树。
- 首要动作：Use the safe research checklist。
- 允许事实：S001 官方 Research 与循环、S002 版本提醒；节点、前置和最佳顺序保持未知。
- 通过条件：机制图和文字都把可证实事实与 pending 边界分开。
