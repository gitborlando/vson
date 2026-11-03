import { css, injectGlobal } from '@emotion/css'

export const installTheme = () => injectGlobal`
  :root {
    font-family: Inter, "PingFang SC", "Microsoft YaHei", sans-serif;
    font-size: 13px; color: #272a30; background: #f5f6f8;
    --color: #4b5fc8; --gray-bg: #f3f4f6; --gray-bg-hover: #eceef2;
    --border: #e7e8ec; --muted: #858a94; --radius: 6px;
  }
  * { box-sizing: border-box; }
  body { margin: 0; }
  button, input, textarea { font: inherit; }
  button { cursor: pointer; }
  button:disabled { cursor: not-allowed; opacity: .45; }
  input, textarea { outline: none; }
  a { color: var(--color); text-decoration: none; }
  h1,h2,h3,p { margin: 0; }
  ::selection { background: #e1e5ff; }
  :focus-visible { outline: 2px solid #a4adf0; outline-offset: 2px; }
`
export const panelClass = css`
  border: 1px solid var(--border);
  border-radius: 9px;
  background: white;
  box-shadow: 0 2px 6px #20273503;
  overflow: hidden;
`
export const rowClass = css`
  display: flex;
  align-items: center;
  gap: 8px;
`
export const mutedClass = css`
  color: var(--muted);
  font-size: 12px;
`
export const fieldClass = css`
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 15px;
  & > label {
    font-size: 12px;
    color: #606671;
  }
`
