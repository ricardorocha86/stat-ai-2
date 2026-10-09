(() => {
  const notifySize = () => document.body && parent.postMessage({
    type: 'statai-resource-size',
    height: Math.ceil(document.body.getBoundingClientRect().height),
  }, '*');
  const wrapText = (text, max) => {
    const words = String(text || '').replace(/<br\s*\/?\s*>/g, ' ').split(/\s+/);
    const lines = []; let line = '';
    for (const word of words) {
      if ((line + ' ' + word).length > max && line) { lines.push(line); line = word; }
      else line += (line ? ' ' : '') + word;
    }
    if (line) lines.push(line);
    return lines.join('<br>');
  };
  if (window.Plotly) {
    for (const method of ['newPlot', 'react']) {
      const original = Plotly[method].bind(Plotly);
      Plotly[method] = (target, data, layout = {}, config = {}) => {
        const small = window.innerWidth < 560;
        const title = typeof layout.title === 'string' ? { text: layout.title } : layout.title || {};
        const next = {
          ...layout, autosize: true, paper_bgcolor: '#ffffff', plot_bgcolor: '#ffffff',
          separators: ',.',
          colorway: ['#2563eb', '#0d9488', '#d97706', '#7c3aed', '#dc2626'],
          font: { ...layout.font, family: 'Arial, sans-serif', size: small ? 12 : 14, color: '#334155' },
          title: { ...title, text: wrapText(title.text, small ? 32 : 75), font: { size: small ? 15 : 18, color: '#0f172a' }, x: 0.5 },
          margin: { l: 58, r: 36, b: 85, ...layout.margin, t: title.text ? (small ? 110 : 90) : (layout.margin?.t || 25) },
        };
        delete next.width;
        for (const axis of ['xaxis', 'yaxis']) {
          if (next[axis]) next[axis] = { ...next[axis], automargin: true };
          if (small) {
            const values = data.flatMap(trace => trace[axis[0]] || []).filter(value => typeof value === 'string');
            if (values.length) next[axis] = { ...next[axis], automargin: true, labelalias: {
              ...next[axis]?.labelalias, ...Object.fromEntries(values.map(value => [value, wrapText(value, 16)])),
            }};
          }
        }
        let traces = data;
        if (small && data.some(trace => trace.type === 'pie')) {
          traces = data.map(trace => trace.type === 'pie'
            ? { ...trace, textinfo: 'percent', textposition: 'inside', showlegend: true } : trace);
          next.showlegend = true;
          next.height = Math.max(next.height || 470, 650);
          next.legend = { ...next.legend, orientation: 'h', x: 0, y: -0.22, font: { size: 11 } };
          next.margin.b = 160;
        }
        // Stack the two/three comparison panels on narrow screens.
        const panels = next.xaxis3 ? 3 : next.xaxis2 ? 2 : 1;
        if (small && panels > 1 && next.xaxis?.domain?.[1] < 0.9) {
          next.height = panels * 250 + 160;
          for (let index = 0; index < panels; index++) {
            const suffix = index ? index + 1 : '';
            const top = 1 - index / panels;
            next['xaxis' + suffix] = { ...next['xaxis' + suffix], domain: [0, 1], automargin: true };
            next['yaxis' + suffix] = { ...next['yaxis' + suffix], domain: [top - 0.72 / panels, top], automargin: true };
          }
          next.annotations = (next.annotations || []).map((annotation, index) => ({
            ...annotation, x: 0.5, y: 1 - index / panels, xanchor: 'center', yanchor: 'bottom',
          }));
        }
        const element = typeof target === 'string' ? document.getElementById(target) : target;
        if (element?.classList.contains('sim-chart')) {
          element.style.height = small && next.height && next.height !== layout.height ? next.height + 'px' : '';
        }
        const result = original(target, traces, next, { ...config, responsive: true, displaylogo: false, scrollZoom: false });
        Promise.resolve(result).then(notifySize);
        return result;
      };
    }
  }
  const style = document.createElement('style');
  style.textContent = 'html,body{margin:0;max-width:100%;font-family:Arial,sans-serif;color:#334155;background:#fff}body{box-sizing:border-box;padding:12px}img,svg{max-width:100%;height:auto}.plotly-graph-div{max-width:100%;width:100%!important} @media(max-width:560px){.controls-grid{grid-template-columns:1fr!important}.ctrl-group,.control-group,.city-control,.controls-grid>*{min-width:0}select{width:100%;max-width:100%;min-width:0}.type-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.split-layout{grid-template-columns:1fr!important}.table-container{height:auto!important;overflow-x:auto!important}.tab-group,.view-group{flex-wrap:wrap}.tab-btn,.view-btn{min-width:0}.sim-header>*{min-width:0}.kpi-row{grid-template-columns:repeat(2,minmax(0,1fr))!important}.btn-group{flex-wrap:wrap}.sim-header{flex-wrap:wrap;gap:8px}}';
  document.head.appendChild(style);
  window.addEventListener('load', notifySize);
  window.addEventListener('resize', () => setTimeout(notifySize, 150));
  const observe = () => { new ResizeObserver(notifySize).observe(document.body); notifySize(); };
  if (document.body) observe();
  else document.addEventListener('DOMContentLoaded', observe, { once: true });
})();
