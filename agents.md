# 仓库约定

- 默认中文沟通；使用疑问句时默认只回答，不做修改。
- 使用 TypeScript、React、pnpm、Ark UI 和 Emotion；包内使用相对导入，跨包仅使用公开导出。
- 不引入商品、商户、账号、编辑器核心或业务接口模型；不混入无关重构，不覆盖已有修改。
- 使用 kebab-case 文件名、小组件和职责明确的函数；Emotion 样式块位于组件外。
- 默认仅代码审查和 git diff --check；未经用户明确要求，不运行 test、build、类型检查、浏览器验证或服务。
- 依赖和锁文件通过 pnpm 维护；安装后注册 simple-git-hooks，提交时用 pretty-quick 格式化暂存文件。
- 每个可独立检查的阶段及时提交；提交信息使用简洁中文，不默认增加 Conventional Commit 前缀。
- 完成后说明实际修改、验证结果与尚未完成的部分。
- 历史来源与原提交映射见 HISTORY.md；历史文档不构成新增执行授权。
