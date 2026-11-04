# VSON · Visual JSON

独立的 React 工作区包 `@workbench/vson`。以 JSON 结构展示数据，键不带引号、不显示分隔逗号；字段选中后编辑，代码视图仍使用标准 JSON。包内不包含商品、SKU、账号、业务存储或接口逻辑，也不直接修改业务文档。

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

父容器需要有可用高度；组件使用 flex 填充容器。样式复用 `@workbench/ui` 的主题变量和 Ark UI 控件；目前为源码工作区包，尚未添加 npm 发布构建。

## 能力和边界

- `value` 是唯一的文本源，两种视图共享；合法结构编辑通过 JSON 路径修改文本，保留无关字段和原排版。
- Schema 支持对象、数组、固定元组、枚举、常量、联合结构、必填项、只读注解、数值和长度范围。它是明确的 JSON Schema 子集，不是完整 JSON Schema 实现，不支持 `$ref` 等关键字。
- 结构视图仅允许编辑已定义字段；未知字段显示为保留的扩展字段，仍可查看。代码视图保留文本自由；业务方可通过 `inspect` 添加校验规则。
- 结构视图提供全部展开/全部收起，并用行内加减号控制多项容器；单项对象就地显示为一行，空对象/数组显示 `{}`/`[]`，不提供展开按钮。添加字段/项目的加号与移除、排序按钮同处行内。
- 两种视图固定 13px，输入及下拉选项沿用 JSON 的中英文字体和字号。工具栏支持显示/隐藏字段注释，此偏好保存在当前站点的 `localStorage`（`vson:appearance`），存储不可用时在当前实例内生效，不写入配置文本；旧字号偏好不再使用。
- 布尔值使用开关；文字/数字输入在按 Enter、确认按钮或失焦时提交，Esc/取消按钮放弃。候选值经过 schema 与 `inspect` 校验，失败时保留原值和本地输入并展示错误，不调用 `onChange`。
- 新增结构的初始值可能尚不完整，此时仅在组件内暂存，可逐字段补全或放弃新增；整份内容通过校验后才调用 `onChange`。现有无关问题允许逐项修正，但未全部通过前只保留本地结构草稿。
- 代码视图复用 CodeMirror，提供 JSON 高亮、字段和枚举补全、说明悬浮提示、错误标记与行号。格式化不接受语法错误、重复键或非有限数字，以免静默损失内容。
- `inspectJson(text, schema, base)` 返回问题及文本位置；提供 `base` 时也检查只读字段变化。`inspect` 接口可补充业务校验，返回同一 `VsonInspection` 结构。
- `media` 注入异步 `list(signal)` 和 `upload(file, kind)`。组件只消费通用 `{id,name,url}` 数据；不内置任何业务 URL 或 OSS 路径。`unavailableReason` 可解释暂不可用原因。
- `onInteractionChange` 报告上传状态、尚未提交/不合法的字段输入及待补全结构；调用方应在忙碌或有输入问题时阻止应用。上传立即由适配器执行；将链接写入业务配置的时机由调用方决定。
- 可选 `history` 接管局部编辑的撤销重做快捷键；不提供时，代码视图使用 CodeMirror 自带历史。
- 应用、草稿保存、切换提示、冲突处理和浏览器离开保护均由应用层负责。

本次仅代码审查、格式化及 diff check；未运行测试、构建、类型检查或浏览器验证。
