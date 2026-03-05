const crypto = require('crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const { getPool } = require('../db');
const DEV_FAKE = process.env.DEV_FAKE_AUTH === '1' || process.env.DEV_FAKE === 'true' || process.env.DEV_FAKE === '1';

const router = express.Router();

/* =====================================================
   WERKZEUG HASH VERIFICATION (Python compatible)
===================================================== */

function parseWerkzeugPBKDF2(hashStr) {
  if (!hashStr || !hashStr.startsWith('pbkdf2:sha256:')) return null;
  const parts = hashStr.split('$');
  if (parts.length !== 3) return null;
  const [methodPart, salt, hash] = parts;
  const iterations = parseInt(methodPart.split(':')[2], 10) || 260000;
  return { iterations, salt, hash };
}

function parseWerkzeugScrypt(hashStr) {
  if (!hashStr || !hashStr.startsWith('scrypt:')) return null;
  const parts = hashStr.split('$');
  if (parts.length !== 3) return null;
  const [methodPart, salt, hash] = parts;
  const mp = methodPart.split(':');
  if (mp.length !== 4) return null;
  return {
    N: parseInt(mp[1], 10) || 32768,
    r: parseInt(mp[2], 10) || 8,
    p: parseInt(mp[3], 10) || 1,
    salt,
    hash,
  };
}

function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function decodeB64(val) {
  let t = String(val || '');
  t = t.replace(/-/g, '+').replace(/_/g, '/');
  while (t.length % 4 !== 0) t += '=';
  return Buffer.from(t, 'base64');
}

function verifyWerkzeug(password, hashStr) {
  // scrypt
  const s = parseWerkzeugScrypt(hashStr);
  if (s) {
    try {
      const saltBytes = decodeB64(s.salt);
      const expectedLen = decodeB64(s.hash).length || 32;
      const dk = crypto.scryptSync(password, saltBytes, expectedLen, {
        N: s.N, r: s.r, p: s.p
      });
      if (safeEqual(dk.toString('base64'), s.hash)) return true;
      if (safeEqual(dk.toString('hex'), s.hash)) return true;
    } catch (_) {}
  }

  // pbkdf2
  const p = parseWerkzeugPBKDF2(hashStr);
  if (p) {
    try {
      const saltBytes = decodeB64(p.salt);
      const dk = crypto.pbkdf2Sync(password, saltBytes, p.iterations, 32, 'sha256');
      if (safeEqual(dk.toString('base64'), p.hash)) return true;
      if (safeEqual(dk.toString('hex'), p.hash)) return true;
    } catch (_) {}
  }

  return false;
}

/* =====================================================
   JWT + USER MAP
===================================================== */

function signJWT(payload) {
  const secret = process.env.SECRET_KEY || process.env.JWT_SECRET || 'change-me-secret';
  const minutes = parseInt(process.env.TOKEN_EXP_MINUTES || '120', 10);
  return jwt.sign(payload, secret, { expiresIn: `${minutes}m` });
}


function mapUserRow(r) {
  return {
    id: r.IdUsu,
    rfid: r.RfId,
    nombre: r.Nombre,
    apellido: r.Apellido,
    correo: r.Correo,
    tipo: r.Tipo,
    rol: (r.Rol || r.Tipo || '').toString().trim(),
    estatus: r.Estatus,
  };
}

/* =====================================================
   LOGIN
   - acepta correo O nombre de usuario
===================================================== */

router.post('/auth/login', async (req, res) => {
  const b = req.body || {};
  const ident = (b.usuario || b.correo || '').trim();
  const password = (b.password || '').toString();

  if (!ident || !password)
    return res.status(400).json({ error: 'Datos incompletos' });

  try {
    // DEV: autenticación simulada sin BD
    if (DEV_FAKE) {
      const isAdmin = /^admin$/i.test(ident);
      const isOper = /^operador$/i.test(ident) || /^operator$/i.test(ident);
      if (!isAdmin && !isOper) {
        return res.status(401).json({ error: 'Usuario demo inválido. Usa "admin" u "operador".' });
      }
      const user = {
        IdUsu: isAdmin ? 1 : 2,
        RfId: isAdmin ? 'RF-ADMIN' : 'RF-OPER',
        Nombre: isAdmin ? 'Admin Demo' : 'Operador Demo',
        Apellido: '',
        Correo: ident,
        Tipo: isAdmin ? 'Administrador' : 'Operador',
        Rol: isAdmin ? 'Administrador' : 'Operador',
        Estatus: 1,
      };
      const token = signJWT({ id: user.IdUsu, rol: user.Rol, nombre: user.Nombre });
      return res.json({ token, usuario: mapUserRow(user) });
    }

    const pool = await getPool();

    const r = await pool.request()
      .input('ident', ident)
      .query(`
        SELECT TOP 1 *
        FROM dbo.Usuarios
        WHERE Estatus = 1
          AND (Correo = @ident OR RfId = @ident)
      `);

    let user = (r.recordset || [])[0];
    // Robust password extraction to handle column name encoding issues (Contraseña/Contrasena)
    const __passField = user ? (
      user.Pass ||
      user.Contrasena ||
      user['Contrasena'] ||
      user['Contrase' + '\u00f1' + 'a'] ||
      user['contrase' + '\u00f1' + 'a'] ||
      user['CONTRASE' + '\u00d1' + 'A']
    ) : null;
    if (!user) {
      // Fallback a esquema alternativo: dbo.usuarios (password_hash, rol, correo/nombre)
      try {
        const r2 = await pool.request()
          .input('ident', ident)
          .query(`SELECT TOP 1 id AS IdUsu, rfid AS RfId, nombre AS Nombre, correo AS Correo, rol AS Rol, 1 AS Estatus, password_hash AS PassHash FROM dbo.usuarios WHERE (correo = @ident OR rfid = @ident)`);
        if ((r2.recordset || []).length) {
          user = r2.recordset[0];
          const passHash = user.PassHash;
          const ok3 = (password === passHash) || verifyWerkzeug(password, passHash);
          if (!ok3) return res.status(401).json({ error: 'Credenciales inválidas' });
          const token = signJWT({ id: user.IdUsu, rol: user.Rol });
          return res.json({ token, usuario: mapUserRow(user) });
        }
      } catch (_) { /* ignore */ }
    }

    if (__passField) {
      const ok2 = (password === __passField) || verifyWerkzeug(password, __passField);
      if (!ok2) return res.status(401).json({ error: 'Credenciales inválidas' });
      const token = signJWT({ id: user.IdUsu, rol: user.Rol });
      return res.json({ token, usuario: mapUserRow(user) });
    }
    if (!user || !user.Contraseña)
      return res.status(401).json({ error: 'Credenciales inválidas' });

    const ok =
      password === user.Contraseña ||
      verifyWerkzeug(password, user.Contraseña);

    if (!ok)
      return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = signJWT({ id: user.IdUsu, rol: user.Rol || user.Tipo });

    return res.json({
      token,
      usuario: mapUserRow(user),
    });
  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({ error: e.message });
  }
});

// Dev utility: whoami
const { requireAuth } = require('../auth-mw');
router.get('/auth/me', requireAuth, (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

/* =====================================================
   REGISTER
===================================================== */

function werkzeugHash(password) {
  const salt = crypto.randomBytes(16);
  const dk = crypto.scryptSync(password, salt, 32, { N: 32768, r: 8, p: 1 });
  return `scrypt:32768:8:1$${salt.toString('base64')}$${dk.toString('base64')}`;
}

router.post('/auth/register', async (req, res) => {
  const b = req.body || {};

  const nombre = (b.nombre || '').trim();
  const apellido = (b.apellido || '').trim();
  const correo = (b.correo || '').trim();
  const password = (b.password || '').toString();
  const tipo = (b.tipo || 'Operador').trim();
  const rol = (b.rol || 'Usuario').trim();
  const rfid = b.rfid || `RF-${crypto.randomBytes(6).toString('hex')}`;

  if (!nombre || !correo || !password)
    return res.status(400).json({ error: 'Datos incompletos' });

  try {
    const pool = await getPool();

    const exists = await pool.request()
      .input('correo', correo)
      .query('SELECT COUNT(*) c FROM dbo.Usuarios WHERE Correo = @correo');

    if (exists.recordset[0].c > 0)
      return res.status(400).json({ error: 'Correo ya registrado' });

    const hash = werkzeugHash(password);

    const ins = await pool.request()
      .input('RfId', rfid)
      .input('Nombre', nombre)
      .input('Apellido', apellido)
      .input('Correo', correo)
      .input('Contraseña', hash)
      .input('Tipo', tipo)
      .input('Rol', rol)
      .query(`
        INSERT INTO dbo.Usuarios
        (RfId, Nombre, Apellido, Correo, Contraseña, Tipo, Rol, Estatus)
        OUTPUT INSERTED.*
        VALUES
        (@RfId, @Nombre, @Apellido, @Correo, @Contraseña, @Tipo, @Rol, 1)
      `);

    return res.status(201).json(mapUserRow(ins.recordset[0]));
  } catch (e) {
    console.error('Register error:', e);
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;
