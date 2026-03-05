(function () {
  'use strict';

  console.log('✅ reports_override.js cargado (EXPORT SIN DATASET)');

  function getToken() {
    return (
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      ''
    );
  }

  function buildQuery(kind) {
    const params = new URLSearchParams();
    params.set('kind', kind);

    const token = getToken();
    if (token) params.set('token', token);

    const from = document.querySelector('#filter-from')?.value;
    const to = document.querySelector('#filter-to')?.value;
    const mr = document.querySelector('#filter-mr')?.value;

    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (mr) params.set('mr', mr);

    return params.toString();
  }

  // 🔥 PONLA AQUÍ
  function forceDownload(url, filename) {
    fetch(url)
      .then(res => res.blob())
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
      });
  }

// ✅ EXPORTAR EXCEL (modo “forzado”)
window.exportExcel = function () {
  const qs = buildQuery('inventory');
  const url = `/api/export/excel?${qs}`;
  console.log('📊 Export Excel URL:', url);
  window.location.href = url; // ✅ descarga directa
};


// ✅ EXPORTAR PDF
window.exportPDF = function () {
  const qs = buildQuery('inventory');
  forceDownload(`/api/export/pdf?${qs}`, 'reporte.pdf');
};

})();
