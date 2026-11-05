# Workbench UI

独立的 React 组件库 `@workbench/ui`，基于 Ark UI 和 Emotion。包含按钮、输入、选择、弹窗、Popover、底部抽屉、Loading、图片和 JSON 编辑等组件，不依赖工作台业务模型或其他内部包。

## 安装与开发

使用 Node.js 24+ 和 pnpm 9.12.2：

```sh
pnpm install
```

安装时通过 `prepare` 注册 Git pre-commit hook，提交前只格式化暂存文件。默认不运行测试、构建、类型检查或服务。

本仓库保留源码包形式，入口为 `src/index.ts`，消费项目需能够编译 TypeScript / TSX；当前 `private: true`，未配置 npm 发布构建。React 和 React DOM 是 peer dependencies，由消费项目提供。

## 接入

例如消费项目与本仓库放在同一父目录，在消费项目执行：

```sh
pnpm add @workbench/ui@file:../workbench-ui
```

```tsx
import { Button, installTheme } from '@workbench/ui'

// 在浏览器应用入口安装一次全局主题。
installTheme()

export function Example() {
  return <Button onClick={() => console.log('clicked')}>确定</Button>
}
```

组件依赖公共 CSS 变量。`installTheme()` 会注入全局字体、颜色、滚动条和基础样式；已有主题的宿主也可以自行提供对应变量。

## Git 历史

从 `ai-workbench/packages/ui` 提取，相关的 18 条历史提交已保留；原提交与新提交的对应关系见 [HISTORY.md](HISTORY.md)。`src/` 与提取时的源包一致，独立配置另作新提交。

当前为本地独立 Git 仓库，分支为 `main`，未设置远程地址。远程空仓库建立后可执行：

```sh
git remote add origin <新仓库地址>
git push -u origin main
```
