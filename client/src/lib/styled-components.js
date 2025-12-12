import React, { useEffect, useMemo } from 'react';

const combineStrings = (strings, exprs, props = {}) =>
  strings.reduce((acc, chunk, index) => {
    const expr = exprs[index];
    const value = typeof expr === 'function' ? expr(props) : expr;
    return acc + chunk + (expr !== undefined ? value ?? '' : '');
  }, '');

const styledFactory = (tag) => (strings, ...exprs) => {
  const StyledComponent = React.forwardRef((props, ref) => {
    const { className, children, ...rest } = props;
    const generatedClass = useMemo(
      () => `sc-${Math.random().toString(36).slice(2, 9)}`,
      []
    );

    const cssContent = useMemo(() => combineStrings(strings, exprs, props), [props]);

    useEffect(() => {
      const styleEl = document.createElement('style');
      styleEl.textContent = `.${generatedClass}{${cssContent}}`;
      document.head.appendChild(styleEl);
      return () => {
        if (styleEl.parentNode) {
          styleEl.parentNode.removeChild(styleEl);
        }
      };
    }, [cssContent, generatedClass]);

    const mergedClassName = [generatedClass, className].filter(Boolean).join(' ');
    return React.createElement(tag, { ...rest, ref, className: mergedClassName }, children);
  });

  StyledComponent.displayName = `styled(${tag})`;
  return StyledComponent;
};

export const createGlobalStyle = (strings, ...exprs) => {
  const globalCSS = combineStrings(strings, exprs);
  const GlobalStyle = () => {
    useEffect(() => {
      const styleEl = document.createElement('style');
      styleEl.setAttribute('data-styled-global', 'true');
      styleEl.textContent = globalCSS;
      document.head.appendChild(styleEl);
      return () => {
        if (styleEl.parentNode) {
          styleEl.parentNode.removeChild(styleEl);
        }
      };
    }, []);
    return null;
  };

  GlobalStyle.displayName = 'createGlobalStyle';
  return GlobalStyle;
};

export const styled = new Proxy(
  {},
  {
    get: (_, tag) => styledFactory(tag),
  }
);

export default styled;
