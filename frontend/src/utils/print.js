export function printHTML(html) {
  const existing = document.getElementById('rs-print-container');
  if (existing) existing.remove();
  const existingStyle = document.getElementById('rs-print-style');
  if (existingStyle) existingStyle.remove();

  const container = document.createElement('div');
  container.id = 'rs-print-container';
  container.innerHTML = html;

  const style = document.createElement('style');
  style.id = 'rs-print-style';
  style.innerHTML = `
    @media print {
      body > *:not(#rs-print-container) { display: none !important; }
      #rs-print-container { display: block !important; position: fixed; top: 0; left: 0; width: 100%; z-index: 99999; background: white; }
    }
    @media screen {
      #rs-print-container { display: none !important; }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(container);

  setTimeout(() => {
    window.print();
    setTimeout(() => {
      const c = document.getElementById('rs-print-container');
      const s = document.getElementById('rs-print-style');
      if (c) c.remove();
      if (s) s.remove();
    }, 1000);
  }, 400);
}