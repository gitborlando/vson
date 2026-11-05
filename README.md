# VSON · Visual JSON

独立的 React 源码包 `@workbench/vson`。以 JSON 结构展示数据，键不带引号、不显示分隔逗号；字段选中后编辑，代码视图仍使用标准 JSON。包内不包含商品、SKU、账号、业务存储或接口逻辑，也不直接修改业务文档。

## 安装与独立仓库

使用 Node.js 24+ 和 pnpm 9.12.2。将两个独立仓库放在同一父目录：

```text
G:/
  workbench-ui/  # @workbench/ui
  vson/          # @workbench/vson
```

VSON 通过 `file:../workbench-ui` 引用 UI 仓库，不再依赖原 monorepo 的 `workspace:*`。在 VSON 目录执行 `pnpm install`，pnpm 会同时解析本地 UI 包及其运行依赖，不要求先在 UI 仓库安装依赖；如果要独立开发 UI，则也在 UI 仓库执行 `pnpm install`。

安装时通过 `prepare` 注册 Git pre-commit hook，提交前只格式化暂存文件。默认不运行测试、构建、类型检查或服务。

两个仓库的包名和公开 API 保持原样，均保留 `private: true` 和 TypeScript 源码入口；消费项目需要能够编译 TypeScript / TSX，当前未增加 npm 发布构建。React 和 React DOM 由消费项目提供。接入时可从 `@workbench/ui` 导入并调用一次 `installTheme()`，或由宿主提供同名主题变量。

本地 `file:` 依赖由 pnpm 管理；修改 UI 后，在 VSON 仓库执行 `pnpm update @workbench/ui` 更新依赖副本和锁文件。迁移到其他电脑时，也需要并排克隆两个仓库；后续发布包或建立远程 Git 依赖时，再替换该地址。

从 `ai-workbench/packages/vson` 提取的 18 条历史提交已保留，原提交与新提交映射见 [HISTORY.md](HISTORY.md)。`src/` 与提取时的源包一致，独立配置另作新提交。当前分支为 `main`，未设置远程地址；建立远程空仓库后可执行：

```sh
git remote add origin <新仓库地址>
git push -u origin main
```

## 接入

```tsx
import { useState } from 'react'
import { VsonEditor, type VsonSchema } from '@workbench/vson'

const schema: VsonSchema = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string', title: '名称', minLength: 1 },
    fit: { type: 'string', enum: ['cover', 'contain'], title: '适配方式' },
    image: { type: 'string', format: 'image', title: '图片' },
  },
}

function Example() {
  const [text, setText] = useState('{"name":"示例"}')
  const [mode, setMode] = useState<'structure' | 'code'>('structure')
  return (
    <VsonEditor
      value={text}
      onChange={setText}
      schema={schema}
      mode={mode}
      onModeChange={setMode}
    />
  )
}
```

父容器需要有可用高度；组件使用 flex 填充容器。样式复用 `@workbench/ui` 的主题变量和 Ark UI 控件；目前为源码包，尚未添加 npm 发布构建。

## 能力和边界

- `value` 是唯一的文本源，两种视图共享；合法结构编辑通过 JSON 路径修改文本，保留无关字段和原排版。
- Schema 支持对象、数组、固定元组、枚举、常量、联合结构、必填项、只读注解、数值和长度范围。它是明确的 JSON Schema 子集，不是完整 JSON Schema 实现，不支持 `$ref` 等关键字。
- 结构视图仅允许编辑已定义字段；未知字段显示为保留的扩展字段，仍可查看。代码视图保留文本自由；业务方可通过 `inspect` 添加校验规则。
- 对象字段固定按当前 schema 的 `properties` 定义顺序展示，扩展字段放在末尾并保留彼此顺序；数组项目不排序。新增字段在 JSON 中插入对应位置，新对象及格式化结果递归采用同一顺序，新增定位也按展示顺序选择字段。仅查看不改写文本，代码输入不自动重排；`editJson` 可传第四参数根 schema 启用按序插入。
- 新增值优先使用 schema 的 `default`、`creationOptions` 或类型初值；`creationOptions: [{label, value}]` 可给出完整候选对象，第一项为推荐值。枚举和候选对象优先排除已有值；数组可声明 `uniqueItems` 或按直接子字段判重的 `uniqueBy`，选项耗尽后禁止继续添加，校验也检查重复。未声明唯一性的数组仍允许重复。
- `createOnly: true` 的标量在结构视图中创建后只读，可通过父级新增菜单的候选对象选定；不会被新增自动编辑选中。代码视图仍允许直接修改 JSON，此注解不用于业务权限或代码视图锁定。
- 结构视图用一个按钮切换全部展开和收起第二级及以下（根节点算第一级，仅保留根展开）；行内加减号控制多项容器。单项对象在唯一值为标量时合并一行，包括图片、枚举和布尔开关；唯一值为对象或数组时保留容器布局。每层缩进为 `2ch`，辅助线不占宽。空对象/数组显示 `{}`/`[]`，不提供展开按钮。添加后展开父级、滚动定位并进入首个可编辑字段，空容器聚焦添加入口。
- 两种视图固定 13px，输入及下拉选项沿用 JSON 的中英文字体和字号。工具栏支持显示/隐藏字段注释，此偏好保存在当前站点的 `localStorage`（`vson:appearance`），存储不可用时在当前实例内生效，不写入配置文本；旧字号偏好不再使用。
- 布尔值使用边框圆点开关，不显示 true/false，固定常量与单选值禁用修改。文字/数字输入固定 24px 外框、22px 内控件，和字段键留出间距；无勾叉按钮，失焦或 Enter 校验提交，Esc 放弃。校验失败不调用 `onChange`：Enter 时保留输入供修正，失焦时恢复原值展示并给出悬浮错误提示。枚举点击后直接打开不换行的菜单，关闭后恢复值展示。
- 结构编辑默认保留 `false`。只有字段本身声明 `omitFalse: true`，且可省略、接受 `false` 时，设为 `false` 才删除键；必填字段和数组项保留 `false`，仍先经过完整校验。新增声明该规则的布尔字段在允许 `true` 时直接启用；联合字段的规则由字段本身声明，不继承分支的删键提示。代码视图与已有文本不自动清理。
- 输入使用单层边框和真实文字测宽，进入编辑默认全选，聚焦或枚举菜单打开时使用主题色边框，不叠加公共 Input 的 focus outline；Select 触发器按当前选项自适应宽度并保留上限。行高亮仅跟随实际悬停、输入焦点或打开的菜单，展开按钮保留鼠标焦点不再维持行高亮。
- 新增结构的初始值可能尚不完整，此时仅在组件内暂存，可逐字段补全或放弃新增；整份内容通过校验后才调用 `onChange`。现有无关问题允许逐项修正，但未全部通过前只保留本地结构草稿。
- 代码视图复用 CodeMirror，提供 JSON 高亮、字段和枚举补全、说明悬浮提示、错误标记与行号。格式化不接受语法错误、重复键或非有限数字，以免静默损失内容。
- `inspectJson(text, schema, base)` 返回问题及文本位置；提供 `base` 时也检查只读字段变化。`inspect` 接口可补充业务校验，返回同一 `VsonInspection` 结构。
- `media` 注入异步 `list(signal)` 和 `upload(file, kind)`。组件只消费通用 `{id,name,url}` 数据；不内置任何业务 URL 或 OSS 路径。`unavailableReason` 可解释暂不可用原因。
- `media.previewOnly: true` 启用图片字段的就近弹窗模拟：按钮旁显示图片，空值或加载失败显示灰色矩形与居中加号，内留 12px。整个窗口可点击选图，本地文件仅作临时预览，不请求素材或上传接口，不写 JSON、历史或业务草稿；选图后标记“本地预览”，字段值改变或卸载时释放临时地址。普通图片模式保留素材选择与上传。
- 本地预览模拟选图后先显示 900ms 的 3/4 圆旋转 loading，期间禁用重复选图，结束后显示本地图片；字段变化或卸载会清理计时器。
- `onInteractionChange` 报告上传状态、尚未提交/不合法的字段输入及待补全结构；调用方应在忙碌或有输入问题时阻止应用。上传立即由适配器执行；将链接写入业务配置的时机由调用方决定。
- 可选 `history` 接管局部编辑的撤销重做快捷键；不提供时，代码视图使用 CodeMirror 自带历史。
- 可用 `expansion` / `onExpansionChange` 控制结构展开状态；不传时由组件内部管理。`onChange(text, expansion)` 同时给出此次改值后的展开状态，包括新增时自动展开的祖先。调用方可在值历史中保存修改前后视图，撤销/重做一起恢复；纯展开/收起通过 `onExpansionChange` 通知，不触发 `onChange`，无需新增历史步骤。
- 应用、草稿保存、切换提示、冲突处理和浏览器离开保护均由应用层负责。
- `toolbarActions` 可注入调用方的操作按钮，排列在内置工具按钮之前，并自动用分隔线与内置工具分组；包内不依赖调用方的历史或剪贴板服务。

本次仅代码审查、格式化及 diff check；未运行测试、构建、类型检查或浏览器验证。
