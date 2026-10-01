# Agent 发展介绍：取舍与来源

内容截止范围：2026-09-30。复核日：2026-10-01。用户提供的发展资料整理为日文发表内容，位于第四章架构／执行演示之后的同一电脑展示面。主线以能力和使用方式组织，不是完整产品目录，也不是成功率或性能排名。

## 发表顺序

- 2021：在开发环境中提供补全；人选择、执行与确认。
- 2022–23：对话与项目协作扩展，同时出现推理／行动循环研究。
- 2024：进入开发与电脑环境，编辑、执行并读取结果。
- 2025：委任开发任务，以变更和检查记录供人审阅；实时协作与后台任务并存。
- 2026：通过记录、计划和事件，跨对话持续跟进目标，也可以委任其他 Agent。
- 四条并行路线：编程、应用生成、通用工作、持续协作。分类可以重叠。
- 支撑技术：Tool Use、状态与 Harness、MCP、A2A、Skills、记忆与调度；企业还需要身份、权限、审批与审计。

## 一手资料

| 内容 | 已确认的依据 |
| --- | --- |
| Copilot | [GitHub 发布文章](https://github.blog/news-insights/product-news/introducing-github-copilot-ai-pair-programmer/)：2021-06-29 技术预览；在编辑器里提供行／函数建议，使用当时的 Codex 模型。 |
| ReAct | [原论文](https://arxiv.org/abs/2210.03629)：2022-10-06 提交，交替组织推理、行动和环境观测。 |
| Cursor | [0.2.0 更新记录](https://cursor.com/changelog/0-2-0)：2023-04-06 的公开版本；页面仅作为早期 AI 编辑器路线的例子，不宣称当前功能都已存在。 |
| Devin | [Cognition 发布文章](https://cognition.com/blog/introducing-devin)：2024-03-12，包含终端、编辑器和浏览器的开发环境。 |
| Replit Agent | [官方发布介绍](https://replit.com/blog/introducing-replit-agent)：当前标注 2024-09-16，正文回顾前一周发布。主图只显示 2024.09，不推断具体上线日。 |
| Computer Use | [Anthropic 发布文章](https://www.anthropic.com/news/3-5-models-and-computer-use)：2024-10-22 公开测试，通过画面与鼠标／键盘操作电脑。 |
| Claude Code | [Anthropic 发布文章](https://www.anthropic.com/news/claude-3-7-sonnet)：2025-02-24 研究预览；读写代码、执行工具和测试。 |
| Codex cloud | [OpenAI 发布文章（日文）](https://openai.com/ja-JP/index/introducing-codex/)：2025-05-16 云端软件工程 Agent，隔离环境、并行任务、成果审阅。使用历史发布文章确认时间，不将其当作当前套餐或权限说明。 |
| OpenClaw | [项目官方介绍](https://openclaw.ai/blog/introducing-openclaw)：前身始于 2025 年 11 月，2026-01-29 采用现名。 |
| Cowork | [Claude 官方发布记录](https://support.claude.com/en/articles/12138966-release-notes)：2026-01-12 研究预览，从代码扩展到文件与知识工作。采用历史记录，未使用后来重定向产品页中的更名信息。 |
| Muse | [Meta 官方发布文章](https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/)：2026-09-08，面向个人目标的持续协作与云端环境。 |
| Dots | [9 月 28 日当周更新](https://learn.chatgpt.com/docs/whats-new/september-28-october-2-2026#delegate-ongoing-work-to-your-dot)、[入门](https://learn.chatgpt.com/docs/dots/getting-started)、[控制](https://learn.chatgpt.com/docs/dots/controls)：跨会话持续跟进、保留记录、组织 Work／Codex 任务。用户材料给出 9 月 29 日；可读官方周报未单独确认当天，因此页面只标 2026.09。主动研究与后续执行的权限边界分开，常驻不等于无限行动或连续推理。 |
| 状态与运行组织 | [LangGraph 介绍](https://www.langchain.com/blog/langgraph)：有状态的循环与 Agent 构建框架。此处不是说 Harness 概念起源于 2024 年。 |
| MCP | [Anthropic 发布文章](https://www.anthropic.com/news/model-context-protocol)：2024-11-25，连接工具与数据。 |
| A2A | [Google 发布文章](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/)：2025-04-09，Agent 之间的互操作。 |
| Agent Skills | [Claude 发布文章](https://claude.com/blog/skills)：2025-10-16，按任务加载手顺、脚本和资料。 |
| 企业运行 | [Bedrock Agents 官方文档](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html)：数据、操作、编排与权限。企业一栏为设计关注点，不是这些产品都具有相同治理机制的能力承诺。 |

## 架构语义

[Writing effective tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents) 与 [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) 支持以模型调用、工具执行、结果反馈组织 Agent 的说明。

- **Model** 生成调用请求，实际执行交给 **Harness**；权限／规则决定执行、审批或阻止。
- **Agent Loop** 指整个 Context → Model → 工具执行 → 结果／观察 → Context 循环。下方单条回程线只标注结果写回上下文。
- 工具结果和环境观察可以直接进入下一轮。验证依任务需要采用测试、规则、模型或人工；工具成功不等于任务完成。
- 框是职责范围而非物理部署；协议、框架、Skills 和产品不是同一层次。

上述资料在页面相应产品／技术名称处保留直达链接。结构化内容随构建输出到 `/studio/agent-development.json`，包括截止日与复核日。
