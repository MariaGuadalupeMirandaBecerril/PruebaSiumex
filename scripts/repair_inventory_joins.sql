/*
  Reparar relaciones de Inventario con Catálogos y normalizar nombres AUTO-*

  Objetivo:
  - Completar inventario.cliente_id y inventario.producto_id a partir de claves en IdClie/IdProd u OP (procesos)
  - Reemplazar nombres 'AUTO-*' por nombres legibles basados en sus claves
  - Aumentar la cantidad de filas que cumplen el filtro del reporte (Cliente/Producto obligatorios, Estación/Usuario opcionales)

  Uso:
  - Ejecutar en la BD SOConteo (SQL Server)
  - Revisar el conteo al final y, si todo es correcto, COMMIT se ejecutará automáticamente
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRAN;

    -- Asegurar columnas FK en dbo.Inventario (si no existen)
    IF COL_LENGTH('dbo.Inventario','cliente_id') IS NULL ALTER TABLE dbo.Inventario ADD cliente_id INT NULL;
    IF COL_LENGTH('dbo.Inventario','producto_id') IS NULL ALTER TABLE dbo.Inventario ADD producto_id INT NULL;
    IF COL_LENGTH('dbo.Inventario','estacion_id') IS NULL ALTER TABLE dbo.Inventario ADD estacion_id INT NULL;
    IF COL_LENGTH('dbo.Inventario','usuario_id') IS NULL ALTER TABLE dbo.Inventario ADD usuario_id INT NULL;

    -- Asegurar FKs (idempotente)
    IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys WHERE name='FK_Inventario_Clientes' AND parent_object_id = OBJECT_ID('dbo.Inventario')
    ) ALTER TABLE dbo.Inventario ADD CONSTRAINT FK_Inventario_Clientes FOREIGN KEY (cliente_id) REFERENCES dbo.clientes(id);
    IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys WHERE name='FK_Inventario_Productos' AND parent_object_id = OBJECT_ID('dbo.Inventario')
    ) ALTER TABLE dbo.Inventario ADD CONSTRAINT FK_Inventario_Productos FOREIGN KEY (producto_id) REFERENCES dbo.productos(id);
    IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys WHERE name='FK_Inventario_Estaciones' AND parent_object_id = OBJECT_ID('dbo.Inventario')
    ) ALTER TABLE dbo.Inventario ADD CONSTRAINT FK_Inventario_Estaciones FOREIGN KEY (estacion_id) REFERENCES dbo.estaciones(id);
    IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys WHERE name='FK_Inventario_Usuarios' AND parent_object_id = OBJECT_ID('dbo.Inventario')
    ) ALTER TABLE dbo.Inventario ADD CONSTRAINT FK_Inventario_Usuarios FOREIGN KEY (usuario_id) REFERENCES dbo.usuarios(id);

    -- 1) Completar cliente_id en Inventario con base en claves y/o proceso
    ;WITH src AS (
        SELECT i.Folio,
               c_id = COALESCE(c3.id, c2.id, c1.id, pr.cliente_id)
        FROM dbo.Inventario AS i
        LEFT JOIN dbo.clientes  AS c1 ON c1.idclie = i.IdClie
        LEFT JOIN dbo.clientes  AS c2 ON c2.id     = TRY_CONVERT(int, i.IdClie)
        LEFT JOIN dbo.procesos  AS pr ON (pr.op = i.OP OR pr.id = TRY_CONVERT(int, i.OP))
        LEFT JOIN dbo.clientes  AS c3 ON c3.id     = i.cliente_id
    )
    UPDATE i SET cliente_id = s.c_id
    FROM dbo.Inventario AS i
    JOIN src AS s ON s.Folio = i.Folio
    WHERE s.c_id IS NOT NULL
      AND (i.cliente_id IS NULL OR i.cliente_id <> s.c_id);

    -- 2) Completar producto_id en Inventario con base en claves y/o proceso
    ;WITH src2 AS (
        SELECT i.Folio,
               p_id = COALESCE(p3.id, p2.id, p1.id, pr.producto_id)
        FROM dbo.Inventario AS i
        LEFT JOIN dbo.productos AS p1 ON p1.idprod = i.IdProd
        LEFT JOIN dbo.productos AS p2 ON p2.id     = TRY_CONVERT(int, i.IdProd)
        LEFT JOIN dbo.procesos  AS pr ON (pr.op = i.OP OR pr.id = TRY_CONVERT(int, i.OP))
        LEFT JOIN dbo.productos AS p3 ON p3.id     = i.producto_id
    )
    UPDATE i SET producto_id = s.p_id
    FROM dbo.Inventario AS i
    JOIN src2 AS s ON s.Folio = i.Folio
    WHERE s.p_id IS NOT NULL
      AND (i.producto_id IS NULL OR i.producto_id <> s.p_id);

    -- 2b) Completar estacion_id y usuario_id en Inventario con base en claves legadas
    ;WITH ssrc AS (
        SELECT i.Folio,
               s_id = COALESCE(s3.id, s2.id)
        FROM dbo.Inventario AS i
        LEFT JOIN dbo.estaciones AS s2 ON s2.id    = TRY_CONVERT(int, i.IdEst)
        LEFT JOIN dbo.estaciones AS s3 ON s3.idest = LTRIM(RTRIM(i.IdEst))
    )
    UPDATE i SET estacion_id = s.s_id
    FROM dbo.Inventario AS i
    JOIN ssrc AS s ON s.Folio = i.Folio
    WHERE s.s_id IS NOT NULL
      AND (i.estacion_id IS NULL OR i.estacion_id <> s.s_id);

    ;WITH usrc AS (
        SELECT i.Folio,
               u_id = COALESCE(u1.id, u2.id, u3.id)
        FROM dbo.Inventario AS i
        LEFT JOIN dbo.usuarios AS u1 ON u1.id    = TRY_CONVERT(int, i.IdUsu)
        LEFT JOIN dbo.usuarios AS u2 ON u2.correo= LTRIM(RTRIM(i.IdUsu))
        LEFT JOIN dbo.usuarios AS u3 ON u3.rfid  = LTRIM(RTRIM(i.IdUsu))
    )
    UPDATE i SET usuario_id = s.u_id
    FROM dbo.Inventario AS i
    JOIN usrc AS s ON s.Folio = i.Folio
    WHERE s.u_id IS NOT NULL
      AND (i.usuario_id IS NULL OR i.usuario_id <> s.u_id);

    -- 3) Normalizar nombres 'AUTO-*' en catálogos (hacerlos legibles)
    UPDATE c
       SET nombre = CONCAT('Cliente ', COALESCE(NULLIF(c.idclie,''), CAST(c.id AS nvarchar(20))))
     WHERE c.nombre LIKE 'AUTO-%';

    UPDATE p
       SET nombre = CONCAT('Producto ', COALESCE(NULLIF(p.idprod,''), CAST(p.id AS nvarchar(20))))
     WHERE p.nombre LIKE 'AUTO-%';

    UPDATE s
       SET nombre = CONCAT('Estación ', COALESCE(NULLIF(s.idest,''), CAST(s.id AS nvarchar(20))))
     WHERE s.nombre LIKE 'AUTO-%';

    UPDATE u
       SET nombre = COALESCE(NULLIF(u.nombre,''), NULLIF(u.correo,''), NULLIF(u.rfid,''), CONCAT('Usuario ', CAST(u.id AS nvarchar(20))))
     WHERE u.nombre LIKE 'AUTO-%' OR u.nombre IS NULL OR u.nombre = '';

    -- 4) Métricas: filas válidas para el reporte tras reparación
    DECLARE @validas INT;
    SELECT @validas = COUNT(*)
    FROM dbo.Inventario i
    LEFT JOIN dbo.clientes   c ON c.id = i.cliente_id
    LEFT JOIN dbo.productos  p ON p.id = i.producto_id
    LEFT JOIN dbo.estaciones s ON s.id = i.estacion_id
    LEFT JOIN dbo.usuarios   u ON u.id = i.usuario_id
    WHERE c.nombre IS NOT NULL AND p.nombre IS NOT NULL
      AND c.nombre NOT LIKE 'AUTO-%' AND p.nombre NOT LIKE 'AUTO-%'
      AND (s.nombre IS NULL OR s.nombre NOT LIKE 'AUTO-%')
      AND (u.nombre IS NULL OR u.nombre NOT LIKE 'AUTO-%');

    PRINT N'Filas válidas esperadas para el reporte: ' + CAST(@validas AS nvarchar(20));

    COMMIT;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK;
    THROW;
END CATCH;
