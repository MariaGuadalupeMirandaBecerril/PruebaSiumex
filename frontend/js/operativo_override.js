// Ajustes visuales puntuales para alinear Operativo con evidencias/img1.png
(function(){
  const ready = (fn) => (document.readyState === 'loading') ? document.addEventListener('DOMContentLoaded', fn) : fn();

  function enhanceAfterRender(){
    try {
      // Reemplazar icono del avatar por uno consistente
      const av = document.querySelector('.user-chip .avatar');
      if (av) av.textContent = '👤';
    } catch(_){}

    // Corregir etiquetas con acentos según UI de la evidencia
    const setLabelTextForInput = (inputId, text) => {
      try {
        const el = document.getElementById(inputId);
        if (!el) return;
        const label = el.closest('label');
        if (!label) return;
        // Primer nodo suele ser texto antes del <input>
        if (label.firstChild && label.firstChild.nodeType === Node.TEXT_NODE) {
          label.firstChild.nodeValue = text;
        } else {
          // Fallback: insertar un nodo de texto al principio
          label.insertBefore(document.createTextNode(text), label.firstChild);
        }
      } catch(_){}
    };
    setLabelTextForInput('f_categoria', 'Categoría');
    setLabelTextForInput('f_tamano', 'Tamaño');

    try {
      const pend = document.querySelector('.pend-wrap label');
      if (pend) {
        // Conservar el select, sólo cambiar el texto visible
        // Normalmente hay un texto + espacio antes del <select>
        if (pend.firstChild && pend.firstChild.nodeType === Node.TEXT_NODE) {
          pend.firstChild.nodeValue = 'Órdenes pendientes ';
        } else {
          pend.insertBefore(document.createTextNode('Órdenes pendientes '), pend.firstChild);
        }
      }
    } catch(_){}
  }

  // Envolver la carga original para aplicar los retoques tras renderizar
  ready(() => {
    const original = window.loadOperativo;
    if (typeof original === 'function'){
      window.loadOperativo = async function(){
        const res = await original.apply(this, arguments);
        // Ejecutar tras el paint inmediato
        setTimeout(enhanceAfterRender, 0);
        return res;
      };
    }
  });
})();

