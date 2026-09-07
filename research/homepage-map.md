# 首页内容映射

| 区域 | 内容 | 页面动作 | 资产/证据 |
|---|---|---|---|
| Hero | Dungeon Settlers beginner guide + Early Access 边界 | Build a first expedition plan | `dungeon-settlers-hero`；S001 |
| First expedition slice | 目的、准备、结果和相关攻略的真实闭环入口 | Open the first expedition planner | `dungeon-settlers-research-loop`、6 个官方截图裁切实体标识；S001/S002 |
| Start here | Beginner、Clay、Research 三条问题入口 | 进入对应攻略页 | `dungeon-settlers-research-loop`；S001/S003 |
| Mental model | Settlement → Research → Expedition → Resources | 继续阅读 Research | `dungeon-settlers-research-loop`；S001 |
| Confirmed right now | 官方循环、版本敏感更新、研究树未知边界 | 识别事实等级 | S001/S002/S003 |
| Source path | 官方 Steam、更新入口和更新记录 | 回查来源或查看更新 | S001/S002；W3 不可分析状态不转成事实 |
| Guide library | 按问题和分类查找已有攻略 | Search the guide library | 页面合同 `/library`；S001/S002/S003 |
| Data reference | 按版本和类别检索 Research、资源、实体、掉落和配方表行 | Browse the data reference | `/database`；S001/S002/S008 |

首页公开边界：不展示 Semrush、Autocomplete、KD、SERP、内部阶段、抓取结果或未核验视频信息。

迁移样板的返回路径：规划器空、部分、完整结果均有文字差异；完整结果进入对应攻略，攻略页的 Next run 模块返回 planner 并保留当前会话状态；提交结果还会进入本地历史，可加载并比较两次状态。Clay 搜索和 Research 主按钮分别进入 canonical 攻略与 checklist。planner、library、updates、database 互相有真实入口，历史 library 详情 URL 只做 308 兼容；数据库页使用版本锁定的二级解析快照，不把未来版本值写死。
