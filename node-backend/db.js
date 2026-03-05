// SQL Server connection pool using `mssql`
let sql = require('mssql');
let driverName = 'tedious';

let poolPromise;

function buildOdbcConnString(base) {
  const parts = [];
  if (base.driver) parts.push(`Driver={${base.driver}}`);
  if (base.server) {
    const serverExpr = base.instanceName ? `${base.server}\\${base.instanceName}` : base.server;
    parts.push(`Server=${serverExpr}`);
  }
  if (base.database) parts.push(`Database=${base.database}`);
  if (base.trusted) parts.push('Trusted_Connection=Yes');
  if (base.user) parts.push(`UID=${base.user}`);
  if (base.password) parts.push(`PWD=${base.password}`);
  if (typeof base.encrypt === 'boolean') parts.push(`Encrypt=${base.encrypt ? 'Yes' : 'No'}`);
  if (typeof base.trustServerCertificate === 'boolean') parts.push(`TrustServerCertificate=${base.trustServerCertificate ? 'Yes' : 'No'}`);
  if (base.timeoutMs) parts.push(`Connection Timeout=${Math.ceil(base.timeoutMs / 1000)}`);
  return parts.join(';') + ';';
}

function parseFlaskDatabaseUrl(dbUrl) {
  // Supports URLs like: mssql+pyodbc:///?odbc_connect=Driver%3DODBC+Driver+17+for+SQL+Server%3BServer%3DSERVER%5CINSTANCE%3BDatabase%3DSOConteo%3BTrusted_Connection%3DYes%3B
  try {
    const u = new URL(dbUrl);
    const params = u.searchParams;
    if (!params.has('odbc_connect')) return null;
    const odbc = decodeURIComponent(params.get('odbc_connect') || '');
    const kv = {};
    for (const part of odbc.split(';')) {
      const p = part.trim();
      if (!p) continue;
      const i = p.indexOf('=');
      if (i === -1) continue;
      const k = p.slice(0, i).trim();
      const v = p.slice(i + 1).trim();
      kv[k.toLowerCase()] = v;
    }
    const out = {};
    if (kv['server']) out.server = kv['server'];
    if (kv['database']) out.database = kv['database'];
    if (kv['uid']) out.user = kv['uid'];
    if (kv['pwd']) out.password = kv['pwd'];
    if (kv['trusted_connection']) out.trusted = /^yes|true|1$/i.test(kv['trusted_connection']);
    // Split instance if present: HOST\INSTANCE
    if (out.server && out.server.includes('\\')) {
      const [host, instanceName] = out.server.split('\\');
      out.server = host;
      out.instanceName = instanceName;
    }
    return out;
  } catch (_) {
    return null;
  }
}

function envBool(v, def) {
  if (v == null) return def;
  return /^1|true|yes$/i.test(String(v).trim());
}
function envInt(v, def) {
  const n = parseInt(String(v || '').trim(), 10);
  return Number.isFinite(n) ? n : def;
}

function buildConfigFromEnv() {
  // 1) Prefer DATABASE_URL (SQLAlchemy style with odbc_connect)
  const dbUrl = process.env.DATABASE_URL || process.env.SQLALCHEMY_DATABASE_URI;
  if (dbUrl) {
    const base = parseFlaskDatabaseUrl(dbUrl);
    if (base) {
      const encrypt = envBool(process.env.DB_ENCRYPT, true);
      const trustServerCertificate = envBool(process.env.DB_TRUST_CERT, true);
      const requestTimeout = envInt(process.env.DB_TIMEOUT, 30000);

      if (base.trusted) {
        // Trusted_Connection via ODBC (msnodesqlv8)
        driverName = 'msnodesqlv8';
        const cs = buildOdbcConnString({
          driver: process.env.ODBC_DRIVER || 'ODBC Driver 17 for SQL Server',
          server: base.server,
          instanceName: base.instanceName,
          database: base.database,
          trusted: true,
          encrypt,
          trustServerCertificate,
          timeoutMs: requestTimeout,
        });
        return { driver: 'msnodesqlv8', connectionString: cs, requestTimeout };
      }

      /** @type {import('mssql').config} */
      return {
        server: base.server,
        database: base.database,
        user: base.user,
        password: base.password,
        options: {
          encrypt,
          trustServerCertificate,
          instanceName: base.instanceName,
        },
        requestTimeout,
      };
    }
  }

  // 2) DB_* variables
  const DB_HOST = process.env.DB_HOST || process.env.DB_SERVER;
  const DB_INSTANCE = process.env.DB_INSTANCE || process.env.DB_INSTANCE_NAME;
  const DB_NAME = process.env.DB_NAME;
  const DB_USER = process.env.DB_USER;
  const DB_PASS = process.env.DB_PASS || process.env.DB_PASSWORD;
  const DB_TRUSTED = envBool(process.env.DB_TRUSTED, false);
  const encrypt = envBool(process.env.DB_ENCRYPT, false);
  const trustServerCertificate = envBool(process.env.DB_TRUST_CERT, true);
  const requestTimeout = envInt(process.env.DB_TIMEOUT, 30000);

  if (DB_HOST && DB_NAME && (DB_TRUSTED || DB_USER)) {
    if (DB_TRUSTED) {
      driverName = 'msnodesqlv8';
      const cs = buildOdbcConnString({
        driver: process.env.ODBC_DRIVER || 'ODBC Driver 17 for SQL Server',
        server: DB_HOST,
        instanceName: DB_INSTANCE,
        database: DB_NAME,
        trusted: true,
        encrypt,
        trustServerCertificate,
        timeoutMs: requestTimeout,
      });
      return { driver: 'msnodesqlv8', connectionString: cs, requestTimeout };
    }
    return {
      server: DB_HOST,
      database: DB_NAME,
      user: DB_USER,
      password: DB_PASS,
      options: {
        encrypt,
        trustServerCertificate,
        instanceName: DB_INSTANCE,
      },
      requestTimeout,
    };
  }

  // 3) Fallback: SmarterASP (hosting)
  const server = 'SQL5113.site4now.net';
  const database = 'db_aad297_conteo';
  const user = 'db_aad297_conteo_admin';
  const password = process.env.DB_PASS || process.env.DB_PASSWORD;
  console.log(`Intentando conectar a SQL Server (fallback): ${server} con usuario: ${user}`);
  return {
    server,
    database,
    user,
    password,
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
    requestTimeout: 30000,
  };
}

function extractBaseFromEnv() {
  const dbUrl = process.env.DATABASE_URL || process.env.SQLALCHEMY_DATABASE_URI;
  if (dbUrl) {
    const b = parseFlaskDatabaseUrl(dbUrl);
    if (b) return b;
  }
  const DB_HOST = process.env.DB_HOST || process.env.DB_SERVER;
  const DB_INSTANCE = process.env.DB_INSTANCE || process.env.DB_INSTANCE_NAME;
  const DB_NAME = process.env.DB_NAME;
  if (DB_HOST && DB_NAME) return { server: DB_HOST, instanceName: DB_INSTANCE, database: DB_NAME };
  return null;
}

async function getPool() {
  if (!poolPromise) {
    const cfg = buildConfigFromEnv();
    const connectOnce = (config) => new sql.ConnectionPool(config).connect();
    const tryConnect = async () => {
      try {
        return await connectOnce(cfg);
      } catch (err) {
        // Si estamos en msnodesqlv8 (Trusted_Connection) y falla por ODBC, probar drivers alternativos
        const raw = String((err && (err.originalError && err.originalError.message)) || (err && err.message) || err);
        const isODBCIssue = /IM002|data source name not found|origen de datos|ODBC/i.test(raw);
        if (driverName === 'msnodesqlv8' && isODBCIssue) {
          const drivers = (process.env.ODBC_DRIVER ? [process.env.ODBC_DRIVER] : [
            'ODBC Driver 18 for SQL Server',
            'ODBC Driver 17 for SQL Server',
            'SQL Server Native Client 11.0',
            'SQL Server',
          ]);
          const b = extractBaseFromEnv();
          if (!b) throw err;
          const base = {
            server: b.server,
            instanceName: b.instanceName,
            database: b.database,
            trusted: true,
            encrypt: cfg.options?.encrypt,
            trustServerCertificate: cfg.options?.trustServerCertificate,
            timeoutMs: cfg.requestTimeout,
          };
          for (const d of drivers) {
            try {
              const cs = buildOdbcConnString({ ...base, driver: d });
              const alt = { driver: 'msnodesqlv8', connectionString: cs };
              const p = await connectOnce(alt);
              return p;
            } catch (_) {
              // intentar siguiente
            }
          }
          const hint = [
            'ODBC no disponible o controlador no encontrado',
            'Instala el "Microsoft ODBC Driver 17/18 for SQL Server"',
            'o usa autenticación SQL con DB_USER/DB_PASS y DB_TRUSTED=0 en backend/.env'
          ].join('. ');
          const wrapped = new Error(hint);
          wrapped.cause = err;
          throw wrapped;
        }
        throw err;
      }
    };
    poolPromise = tryConnect()
      .then((pool) => pool)
      .catch((e) => { poolPromise = undefined; throw e; });
  }
  return poolPromise;
}

async function ensureSOConteo() {
  const pool = await getPool();
  const result = await pool.request().query('SELECT DB_NAME() AS db');
  const dbname = (result && result.recordset && result.recordset[0] && result.recordset[0].db) || '';
  if (String(dbname).toLowerCase() !== 'soconteo') {
    throw new Error(`Base de datos activa invalida: ${dbname}. Se requiere SOConteo`);
  }
}

module.exports = {
  sql,
  getPool,
  ensureSOConteo,
};

