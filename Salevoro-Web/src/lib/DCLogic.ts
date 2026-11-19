import React from 'react';

/**
 * Base class for every screen. A screen keeps its state + handlers in the class
 * and exposes view data from renderVals(); template() turns that data into JSX.
 */
export class DCLogic extends React.Component<any, any> {
  [key: string]: any;
  renderVals(): Record<string, any> { return {}; }
  template(_v: any): React.ReactNode { return null; }
  render() { return this.template({ ...this.props, ...this.renderVals() }); }
}

/** Accepts a CSS string or a style object and returns a React style object. */
export function cssObj(v: any): React.CSSProperties {
  if (!v) return {};
  if (typeof v === 'object') return v;
  const o: Record<string, string> = {};
  String(v).split(';').forEach(d => {
    const i = d.indexOf(':');
    if (i < 0) return;
    const k = d.slice(0, i).trim();
    o[k.startsWith('--') ? k : k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = d.slice(i + 1).trim();
  });
  return o as React.CSSProperties;
}
