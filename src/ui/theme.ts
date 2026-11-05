import { css, injectGlobal } from '@emotion/css'

export const installTheme = () => injectGlobal`
  :root {
    font-family: Inter, "PingFang SC", "Microsoft YaHei", sans-serif;
    font-size: 13px; color: #272a30; background: #f5f6f8;
    --hue: 280; --color: hsl(280 100% 70%); --gray-bg: #f2f3f4; --gray-bg-hover: #eceef2;
    --color-bg: hsl(280 100% 93%); --color-bg-half: hsl(280 100% 98%);
    --gray-border: rgba(138, 138, 138, .15);
    --border-radius: 6px; --border-radius-sm: 3px;
    --shadow: 0 0 0 1px #0000000d, 0 4px 10px #0000001a;
    --border: #e7e8ec; --muted: #858a94; --radius: 6px;
    --scrollbar-thumb: #c5cad3; --scrollbar-thumb-hover: #9ca5b3;
  }
  * {
    box-sizing: border-box;
    scrollbar-width: thin;
    scrollbar-color: var(--scrollbar-thumb) transparent;
  }
  @supports selector(::-webkit-scrollbar) {
    * { scrollbar-width: auto; scrollbar-color: auto; }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track, ::-webkit-scrollbar-corner { background: transparent; }
    ::-webkit-scrollbar-thumb {
      border: 2px solid transparent;
      border-radius: 999px;
      background: var(--scrollbar-thumb);
      background-clip: padding-box;
    }
    ::-webkit-scrollbar-thumb:hover { background-color: var(--scrollbar-thumb-hover); }
    ::-webkit-scrollbar-button { display: none; }
  }
  @media (forced-colors: active) {
    * { scrollbar-width: auto; scrollbar-color: auto; }
    ::-webkit-scrollbar-thumb { background: ButtonText; }
  }
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
