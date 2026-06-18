import { createGlobalStyle } from "styled-components";

// Global reset + base body styles ported from the legacy index.html.
// 'Inter' is loaded via the font <link>s in root.tsx. Per-component scrollbar
// widths (.q-list 4px, .main 6px) live with their components; this is the base.
export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    color-scheme: dark;
  }

  body {
    font-family: 'Inter', system-ui, sans-serif;
    background: ${({ theme }) => theme.bg};
    color: ${({ theme }) => theme.text};
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.border};
    border-radius: 4px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
`;
