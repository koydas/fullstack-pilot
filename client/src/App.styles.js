import styled, { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  :root {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #0f172a;
    background-color: #f8fafc;
    line-height: 1.5;
  }

  body {
    margin: 0;
    min-height: 100vh;
  }
`;

export const AppShell = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
`;

