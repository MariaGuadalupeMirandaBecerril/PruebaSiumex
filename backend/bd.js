const sql = require('mssql');

const config = {
  server: 'DESKTOP-AMBO3EU\\SQLEXPRESS',
  database: 'SOConteo',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

const poolPromise = sql.connect(config);

module.exports = {
  sql,
  poolPromise
};
