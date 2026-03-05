// server.js (RAÍZ) - Express + Frontend estático + API /api/*
var path = require('path');
var express = require('express');
var cors = require('cors');
var dotenv = require('dotenv');

dotenv.config();

var app = express();
app.use(cors());
// CSP relajado para desarrollo (permite connect-src a localhost y mismo origen)
if (String(process.env.DEV_RELAXED_CSP || '').trim() === '1') {
  app.use(function (_req, res, next) {
    try {
      const csp = [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'self'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "style-src 'self' 'unsafe-inline'",
        "script-src 'self' 'unsafe-inline'",
        "connect-src 'self' http://localhost:* https://localhost:* ws://localhost:* wss://localhost:*"
      ].join('; ');
      if (!res.getHeader('Content-Security-Policy')) {
        res.setHeader('Content-Security-Policy', csp);
      }
    } catch (_) {}
    next();
  });
  console.log('DEV_RELAXED_CSP=1 => Content-Security-Policy relajado para desarrollo');
}
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ---- Debug útil ----
console.log('NODE VERSION:', process.version);
console.log('APP ROOT:', __dirname);


var MOUNTS = {};

// Health / Ping
app.get('/health', function (_req, res) { res.json({ status: 'ok' }); });
app.get('/api/health', function (_req, res) { res.json({ status: 'ok' }); });
app.get('/api/ping', function (_req, res) { res.json({ ok: true, msg: 'NODE ARRANCO BIEN' }); });
app.get('/api/_debug/mounts', function (_req, res) {
  res.json(MOUNTS);
});


// Ver versión Node
app.get('/api/node-version', function (_req, res) {
  res.json({ node: process.version });
});

// ---- Frontend estático ----
var FRONTEND_DIR = path.resolve(__dirname, 'frontend');
app.use(express.static(FRONTEND_DIR, { extensions: ['html'] }));

app.get('/favicon.ico', function (_req, res) { res.sendStatus(204); });

// ---- Uploads (si existe) ----
var UPLOAD_DIR = path.resolve(__dirname, 'node-backend', 'uploads');
app.use('/uploads', express.static(UPLOAD_DIR));
// Evidencias (para assets de diseño de alta fidelidad)
try{
  var EVID_DIR = path.resolve(__dirname, 'evidencias');
  app.use('/evidencias', express.static(EVID_DIR));
  console.log('Static mount: /evidencias ->', EVID_DIR);
}catch(_){ }

// Assets de login (regla solicitada): /src/assets/login
try{
  var LOGIN_ASSETS_DIR = path.resolve(__dirname, 'src', 'assets', 'login');
  // Fallback dinámico para PNGs requeridos si son placeholders o no existen
  app.get(/^\/assets\/login\/(astronaut|bg-space|siaumex-head)\.png$/, function(req, res){
    try{
      var fs = require('fs');
      var name = req.params[0];
      var candidate = path.join(LOGIN_ASSETS_DIR, name + '.png');
      try{
        var st = fs.statSync(candidate);
        if (st && st.size > 1024) return res.sendFile(candidate);
      }catch(_e){ /* fallthrough */ }
      // Map a fallbacks (SVG o evidencias premium)
      if (name === 'astronaut'){
        var evid = path.resolve(__dirname, 'evidencias', 'ia.png');
        if (fs.existsSync(evid)) return res.sendFile(evid);
        return res.sendFile(path.join(LOGIN_ASSETS_DIR, 'astronaut.svg'));
      }
      if (name === 'bg-space'){
        return res.sendFile(path.join(LOGIN_ASSETS_DIR, 'bg-space.svg'));
      }
      if (name === 'siaumex-head'){
        return res.sendFile(path.join(LOGIN_ASSETS_DIR, 'helmet.svg'));
      }
      res.sendStatus(404);
    }catch(e){ res.status(500).send(String(e && e.message || e)); }
  });
  // Montaje estático genérico
  app.use('/assets/login', express.static(LOGIN_ASSETS_DIR));
  console.log('Static mount: /assets/login ->', LOGIN_ASSETS_DIR);
}catch(_){ }

// ---- DB (solo require, no debe reventar) ----
try {
  require('./node-backend/db');
  console.log('DB module loaded: ./node-backend/db');
} catch (e) {
  console.log('DB module NOT loaded:', (e && e.message) ? e.message : String(e));
}

var MOUNTS = {};

function mountSafe(name) {
  var p = './node-backend/routes/' + name;
  try {
    var mod = require(p);
    app.use('/api', mod);
    console.log('Mounted:', p);
    MOUNTS[name] = { ok: true };
    return true;
  } catch (e) {
    var err = (e && (e.stack || e.message)) ? (e.stack || e.message) : String(e);
    console.log('NOT mounted:', p, '=>', err);
    MOUNTS[name] = { ok: false, err };
    return false;
  }
}



// ⚠️ Importante: monta primero lo mínimo necesario para login/UI
mountSafe('auth');
mountSafe('users');

// El resto
mountSafe('products');
mountSafe('clients');
mountSafe('providers');
mountSafe('stations');
mountSafe('operators');
mountSafe('variables');
mountSafe('processes');
mountSafe('inventory');
mountSafe('operativo');
mountSafe('company');
mountSafe('dashboard');
mountSafe('db');
mountSafe('perms');
mountSafe('export');
mountSafe('maintenance');

// reports protegido
try {
  app.use('/api', require('./node-backend/routes/reports'));
  console.log('Mounted: ./node-backend/routes/reports');
} catch (e) {
  console.log('Reports router NOT loaded:', (e && e.stack) ? e.stack : ((e && e.message) ? e.message : String(e)));
}

// Root (para debug)
app.get('/', function (_req, res) {
  res.status(200).json({
    message: 'Sistema Administrativo - Node backend (root server.js)',
    status: 'ok',
    health: '/health',
    api_health: '/api/health',
    api_ping: '/api/ping',
    api_base: '/api',
    node_version: '/api/node-version'
  });
});

// Error handler global
app.use(function (err, req, res, _next) {
  console.error('🔥 ERROR:', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    detail: err.message || String(err),
    path: req.originalUrl
  });
});

// Listen (IISNode/SmarterASP)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en puerto: ${PORT}`);
});
