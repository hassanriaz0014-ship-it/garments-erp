const LOGO_URL = `https://res.cloudinary.com/dx1us5oiy/image/upload/Screenshot_2026-06-23_103649_hgb6dl.png?v=${Date.now()}`;

const LOGO_IMG = `<img src="https://res.cloudinary.com/dx1us5oiy/image/upload/Screenshot_2026-06-23_103649_hgb6dl.png" crossorigin="anonymous" style="width:36px;height:36px;object-fit:contain;vertical-align:middle;margin-right:8px;background:#000;border-radius:4px;padding:2px;"/>`;

export function printHTML(html) {
  // Replace any logo img tags with standard one
  const fixedHtml = html.replace(
    /<img[^>]*src="[^"]*"[^>]*class="header-logo"[^>]*\/?>/gi, LOGO_IMG
  ).replace(
    /<img[^>]*class="header-logo"[^>]*src="[^"]*"[^>]*\/?>/gi, LOGO_IMG
  );

  const win = window.open('', '_blank', 'width=900,height=700,left=100,top=100');
  if (!win) {
    alert('Please allow popups for this site');
    return;
  }

  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate"/>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px 10px; border: 1px solid #ddd; font-size: 13px; }
          th { background: #f3f4f6; font-weight: 600; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
          .header-logo { width: 36px; height: 36px; object-fit: contain; vertical-align: middle; margin-right: 8px; background: #000; border-radius: 4px; padding: 2px; }
          h2 { font-size: 18px; margin: 0 0 4px 0; display: flex; align-items: center; }
          p { margin: 2px 0; font-size: 13px; color: #555; }
        </style>
      </head>
      <body>
        ${fixedHtml}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }, 500);
          };
        </script>
      </body>
    </html>
  `);
  win.document.close();
  window.focus();
}