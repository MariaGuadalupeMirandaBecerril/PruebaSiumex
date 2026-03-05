// Premium extras: parallax, tilt, password strength, caps lock, confetti
(function(){
  function ready(fn){ if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

  function setupParallax(){
    var visual = document.querySelector('.login-visual');
    var astro = document.querySelector('.mascot .astro');
    var helmet = document.querySelector('.mascot .helmet');
    if (!visual || !astro || !helmet) return;
    visual.addEventListener('mousemove', function(ev){
      var rect = visual.getBoundingClientRect();
      var cx = rect.left + rect.width/2;
      var cy = rect.top + rect.height/2;
      var dx = (ev.clientX - cx) / rect.width;  // -0.5..0.5 aprox
      var dy = (ev.clientY - cy) / rect.height;
      astro.style.transform = 'translate(' + (-dx*20).toFixed(1) + 'px,' + (-dy*10).toFixed(1) + 'px)';
      helmet.style.transform = 'translate(' + (-dx*28).toFixed(1) + 'px,' + (-dy*16).toFixed(1) + 'px)';
    });
    visual.addEventListener('mouseleave', function(){
      astro.style.transform = '';
      helmet.style.transform = '';
    });
  }

  function setupCardTilt(){
    var card = document.querySelector('.login-card');
    if (!card) return;
    card.addEventListener('mousemove', function(e){
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width;  // 0..1
      var py = (e.clientY - r.top) / r.height;
      var rx = clamp((0.5 - py) * 6, -5, 5);
      var ry = clamp((px - 0.5) * 10, -8, 8);
      card.style.setProperty('--rx', rx + 'deg');
      card.style.setProperty('--ry', ry + 'deg');
      card.classList.add('tilt');
    });
    ['mouseleave','blur'].forEach(function(ev){ card.addEventListener(ev, function(){ card.classList.remove('tilt'); card.style.removeProperty('--rx'); card.style.removeProperty('--ry'); }); });
  }

  function scorePassword(p){
    var s = 0; if (!p) return 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[a-z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    if (p.length >= 12) s++;
    return Math.min(4, Math.floor(s/1.5));
  }

  function setupPasswordUtils(){
    var input = document.getElementById('password');
    var meter = document.getElementById('pwdMeter');
    var caps = document.getElementById('capsHint');
    var btn = document.querySelector('.login-card .btn.btn-primary');
    if (!input) return;

    function updateMeter(){
      if (!meter) return;
      var bars = meter.querySelectorAll('span');
      var w = scorePassword(input.value);
      bars.forEach(function(b, i){ b.className = i < w ? 'on w'+(w||1) : ''; });
    }
    input.addEventListener('input', updateMeter);
    updateMeter();

    input.addEventListener('keydown', function(e){
      try{ if (caps){ var on = e.getModifierState && e.getModifierState('CapsLock'); caps.hidden = !on; } }catch(_){ }
    });

    // Hover trail coords for CTA
    if (btn){ btn.addEventListener('mousemove', function(e){ var r = btn.getBoundingClientRect(); btn.style.setProperty('--mx', ((e.clientX-r.left)/r.width*100).toFixed(1)+'%'); btn.style.setProperty('--my', ((e.clientY-r.top)/r.height*100).toFixed(1)+'%'); }); }
  }

  function shootConfetti(){
    var colors = ['#60a5fa','#34d399','#fbbf24','#f472b6','#a78bfa','#22d3ee'];
    var n = 40; var w = window.innerWidth; var root = document.body;
    for (var i=0;i<n;i++){
      var d = document.createElement('div');
      d.className = 'confetto';
      d.style.left = (Math.random()*w) + 'px';
      d.style.background = colors[i % colors.length];
      d.style.animationDelay = (Math.random()*0.2)+'s';
      d.style.transform = 'translateY(' + (-20 - Math.random()*60) + 'px) rotate(0)';
      root.appendChild(d);
      (function(el){ setTimeout(function(){ try{ root.removeChild(el); }catch(_){ } }, 1800); })(d);
    }
  }

  ready(function(){
    setupParallax();
    setupCardTilt();
    setupPasswordUtils();

    // Confetti on success
    window.addEventListener('login:success', shootConfetti);

    // Prefill last user if present
    try{
      var u = localStorage.getItem('usuario');
      if (u){ var j = JSON.parse(u); if (j && j.correo){ var c = document.getElementById('correo'); if (c && !c.value) c.value = j.correo; } }
    }catch(_){ }

    // Sync hero height with card height
    (function syncHeights(){
      var card = document.querySelector('.login-card');
      if (!card) return;
      var body = document.body;
      var last = 0;
      function measure(){
        try{
          // Prefer content height to avoid locking to previous min-height
          var h = Math.max(card.scrollHeight, card.offsetHeight);
          if (Math.abs(h - last) > 2){
            body.style.setProperty('--card-h', h + 'px');
            last = h;
          }
        }catch(_){ }
      }
      // Initial measurements: after layout and after fonts
      requestAnimationFrame(function(){ measure(); requestAnimationFrame(measure); });
      window.addEventListener('load', measure);
      window.addEventListener('resize', measure);
      window.addEventListener('orientationchange', measure);
      try{
        if ('ResizeObserver' in window){
          var ro = new ResizeObserver(function(){ measure(); });
          ro.observe(card);
        }
      }catch(_){ }
      // Re-measure on login error since msg content may expand
      window.addEventListener('login:error', measure);
    })();
  });
})();
