/*
  Sincronización de esquema para SOConteo (SQL Server)
  - Idempotente: usa IF NOT EXISTS / IF COL_LENGTH
  - No elimina tablas ni columnas
  - Asegura PK/UK/FK e índices mínimos
*/

/* Usuarios */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name='usuarios' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.usuarios (
        id INT IDENTITY(1,1) PRIMARY KEY,
        rfid NVARCHAR(20) NULL,
        nombre NVARCHAR(50) NOT NULL,
        correo NVARCHAR(50) NOT NULL,
        rol NVARCHAR(20) NOT NULL,
        password_hash NVARCHAR(255) NOT NULL,
        created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 DEFAULT SYSUTCDATETIME()
    );
END
IF COL_LENGTH('dbo.empresa','id') IS NULL ALTER TABLE dbo.empresa ADD id INT IDENTITY(1,1) NOT NULL;
IF COL_LENGTH('dbo.usuarios','id') IS NULL ALTER TABLE dbo.usuarios ADD id INT IDENTITY(1,1) NOT NULL;
IF COL_LENGTH('dbo.usuarios','rfid') IS NULL ALTER TABLE dbo.usuarios ADD rfid NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.usuarios','nombre') IS NULL ALTER TABLE dbo.usuarios ADD nombre NVARCHAR(50) NOT NULL DEFAULT(N'');
IF COL_LENGTH('dbo.usuarios','correo') IS NULL ALTER TABLE dbo.usuarios ADD correo NVARCHAR(50) NOT NULL DEFAULT(N'');
IF COL_LENGTH('dbo.usuarios','rol') IS NULL ALTER TABLE dbo.usuarios ADD rol NVARCHAR(20) NOT NULL DEFAULT(N'Operador');
IF COL_LENGTH('dbo.usuarios','password_hash') IS NULL ALTER TABLE dbo.usuarios ADD password_hash NVARCHAR(255) NOT NULL DEFAULT(N'');
IF COL_LENGTH('dbo.usuarios','created_at') IS NULL ALTER TABLE dbo.usuarios ADD created_at DATETIME2 NULL;
IF COL_LENGTH('dbo.usuarios','updated_at') IS NULL ALTER TABLE dbo.usuarios ADD updated_at DATETIME2 NULL;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_usuarios_correo' AND object_id=OBJECT_ID('dbo.usuarios'))
    CREATE UNIQUE INDEX UX_usuarios_correo ON dbo.usuarios(correo);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_usuarios_rfid' AND object_id=OBJECT_ID('dbo.usuarios'))
    CREATE UNIQUE INDEX UX_usuarios_rfid ON dbo.usuarios(rfid) WHERE rfid IS NOT NULL;
-- Relajar RfId si existe como NOT NULL legado
BEGIN TRY ALTER TABLE dbo.usuarios ALTER COLUMN rfid NVARCHAR(20) NULL; END TRY BEGIN CATCH END CATCH;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_usuarios_id' AND object_id=OBJECT_ID('dbo.usuarios'))
    CREATE UNIQUE INDEX UX_usuarios_id ON dbo.usuarios(id);

/* Productos */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name='productos' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.productos (
        id INT IDENTITY(1,1) PRIMARY KEY,
        idprod NVARCHAR(20) NOT NULL,
        nombre NVARCHAR(50) NOT NULL,
        variable1 NVARCHAR(50) NULL,
        variable2 NVARCHAR(50) NULL,
        variable3 NVARCHAR(50) NULL,
        peso_por_pieza DECIMAL(10,2) NULL,
        imagen NVARCHAR(255) NULL,
        created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 DEFAULT SYSUTCDATETIME()
    );
END
IF COL_LENGTH('dbo.variables','id') IS NULL ALTER TABLE dbo.variables ADD id INT IDENTITY(1,1) NOT NULL;
IF COL_LENGTH('dbo.productos','id') IS NULL ALTER TABLE dbo.productos ADD id INT IDENTITY(1,1) NOT NULL;
IF COL_LENGTH('dbo.productos','idprod') IS NULL ALTER TABLE dbo.productos ADD idprod NVARCHAR(20) NOT NULL DEFAULT(N'');
IF COL_LENGTH('dbo.productos','nombre') IS NULL ALTER TABLE dbo.productos ADD nombre NVARCHAR(50) NOT NULL DEFAULT(N'');
IF COL_LENGTH('dbo.productos','variable1') IS NULL ALTER TABLE dbo.productos ADD variable1 NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.productos','variable2') IS NULL ALTER TABLE dbo.productos ADD variable2 NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.productos','variable3') IS NULL ALTER TABLE dbo.productos ADD variable3 NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.productos','peso_por_pieza') IS NULL ALTER TABLE dbo.productos ADD peso_por_pieza DECIMAL(10,2) NULL;
IF COL_LENGTH('dbo.productos','imagen') IS NULL ALTER TABLE dbo.productos ADD imagen NVARCHAR(255) NULL;
-- Ampliar imagen si es necesario (almacena data-uri largas)
BEGIN TRY ALTER TABLE dbo.productos ALTER COLUMN imagen NVARCHAR(MAX) NULL; END TRY BEGIN CATCH END CATCH;
IF COL_LENGTH('dbo.productos','created_at') IS NULL ALTER TABLE dbo.productos ADD created_at DATETIME2 NULL;
IF COL_LENGTH('dbo.productos','updated_at') IS NULL ALTER TABLE dbo.productos ADD updated_at DATETIME2 NULL;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_productos_idprod' AND object_id=OBJECT_ID('dbo.productos'))
    CREATE UNIQUE INDEX UX_productos_idprod ON dbo.productos(idprod);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_productos_id' AND object_id=OBJECT_ID('dbo.productos'))
    CREATE UNIQUE INDEX UX_productos_id ON dbo.productos(id);
-- Relajar columnas legadas si existen como NOT NULL sin default
BEGIN TRY ALTER TABLE dbo.productos ALTER COLUMN Var1 NVARCHAR(50) NULL; END TRY BEGIN CATCH END CATCH;
BEGIN TRY ALTER TABLE dbo.productos ALTER COLUMN Var2 NVARCHAR(50) NULL; END TRY BEGIN CATCH END CATCH;
BEGIN TRY ALTER TABLE dbo.productos ALTER COLUMN Var3 NVARCHAR(50) NULL; END TRY BEGIN CATCH END CATCH;
BEGIN TRY ALTER TABLE dbo.productos ALTER COLUMN PxP DECIMAL(10,2) NULL; END TRY BEGIN CATCH END CATCH;

/* Clientes */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name='clientes' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.clientes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        idclie NVARCHAR(20) NOT NULL,
        nombre NVARCHAR(50) NOT NULL,
        observaciones NVARCHAR(50) NULL,
        calle NVARCHAR(100) NULL,
        num_interior NVARCHAR(20) NULL,
        num_exterior NVARCHAR(20) NULL,
        colonia NVARCHAR(80) NULL,
        ciudad NVARCHAR(80) NULL,
        estado NVARCHAR(80) NULL,
        cp NVARCHAR(20) NULL,
        created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 DEFAULT SYSUTCDATETIME()
    );
END
IF COL_LENGTH('dbo.clientes','id') IS NULL ALTER TABLE dbo.clientes ADD id INT IDENTITY(1,1) NOT NULL;
IF COL_LENGTH('dbo.clientes','idclie') IS NULL ALTER TABLE dbo.clientes ADD idclie NVARCHAR(20) NOT NULL DEFAULT(N'');
IF COL_LENGTH('dbo.clientes','nombre') IS NULL ALTER TABLE dbo.clientes ADD nombre NVARCHAR(50) NOT NULL DEFAULT(N'');
IF COL_LENGTH('dbo.clientes','observaciones') IS NULL ALTER TABLE dbo.clientes ADD observaciones NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.clientes','calle') IS NULL ALTER TABLE dbo.clientes ADD calle NVARCHAR(100) NULL;
IF COL_LENGTH('dbo.clientes','num_interior') IS NULL ALTER TABLE dbo.clientes ADD num_interior NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.clientes','num_exterior') IS NULL ALTER TABLE dbo.clientes ADD num_exterior NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.clientes','colonia') IS NULL ALTER TABLE dbo.clientes ADD colonia NVARCHAR(80) NULL;
IF COL_LENGTH('dbo.clientes','ciudad') IS NULL ALTER TABLE dbo.clientes ADD ciudad NVARCHAR(80) NULL;
IF COL_LENGTH('dbo.clientes','estado') IS NULL ALTER TABLE dbo.clientes ADD estado NVARCHAR(80) NULL;
IF COL_LENGTH('dbo.clientes','cp') IS NULL ALTER TABLE dbo.clientes ADD cp NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.clientes','created_at') IS NULL ALTER TABLE dbo.clientes ADD created_at DATETIME2 NULL;
IF COL_LENGTH('dbo.clientes','updated_at') IS NULL ALTER TABLE dbo.clientes ADD updated_at DATETIME2 NULL;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_clientes_idclie' AND object_id=OBJECT_ID('dbo.clientes'))
    CREATE UNIQUE INDEX UX_clientes_idclie ON dbo.clientes(idclie);
-- Relajar columnas legadas en clientes
BEGIN TRY ALTER TABLE dbo.clientes ALTER COLUMN Imagen NVARCHAR(MAX) NULL; END TRY BEGIN CATCH END CATCH;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_clientes_id' AND object_id=OBJECT_ID('dbo.clientes'))
    CREATE UNIQUE INDEX UX_clientes_id ON dbo.clientes(id);

/* Estaciones */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name='estaciones' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.estaciones (
        id INT IDENTITY(1,1) PRIMARY KEY,
        idest NVARCHAR(20) NOT NULL,
        nombre NVARCHAR(50) NOT NULL,
        observaciones NVARCHAR(50) NULL,
        created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 DEFAULT SYSUTCDATETIME()
    );
END
IF COL_LENGTH('dbo.estaciones','id') IS NULL ALTER TABLE dbo.estaciones ADD id INT IDENTITY(1,1) NOT NULL;
IF COL_LENGTH('dbo.estaciones','idest') IS NULL ALTER TABLE dbo.estaciones ADD idest NVARCHAR(20) NOT NULL DEFAULT(N'');
IF COL_LENGTH('dbo.estaciones','nombre') IS NULL ALTER TABLE dbo.estaciones ADD nombre NVARCHAR(50) NOT NULL DEFAULT(N'');
IF COL_LENGTH('dbo.estaciones','observaciones') IS NULL ALTER TABLE dbo.estaciones ADD observaciones NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.estaciones','created_at') IS NULL ALTER TABLE dbo.estaciones ADD created_at DATETIME2 NULL;
IF COL_LENGTH('dbo.estaciones','updated_at') IS NULL ALTER TABLE dbo.estaciones ADD updated_at DATETIME2 NULL;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_estaciones_idest' AND object_id=OBJECT_ID('dbo.estaciones'))
    CREATE UNIQUE INDEX UX_estaciones_idest ON dbo.estaciones(idest);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_estaciones_id' AND object_id=OBJECT_ID('dbo.estaciones'))
    CREATE UNIQUE INDEX UX_estaciones_id ON dbo.estaciones(id);

/* Operadores */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name='operadores' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.operadores (
        id INT IDENTITY(1,1) PRIMARY KEY,
        rfid NVARCHAR(20) NULL,
        nombre NVARCHAR(50) NOT NULL,
        password_hash NVARCHAR(255) NOT NULL,
        estacion NVARCHAR(20) NULL,
        created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 DEFAULT SYSUTCDATETIME()
    );
END
IF COL_LENGTH('dbo.operadores','rfid') IS NULL ALTER TABLE dbo.operadores ADD rfid NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.operadores','nombre') IS NULL ALTER TABLE dbo.operadores ADD nombre NVARCHAR(50) NOT NULL DEFAULT(N'');
IF COL_LENGTH('dbo.operadores','password_hash') IS NULL ALTER TABLE dbo.operadores ADD password_hash NVARCHAR(255) NOT NULL DEFAULT(N'');
IF COL_LENGTH('dbo.operadores','estacion') IS NULL ALTER TABLE dbo.operadores ADD estacion NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.operadores','created_at') IS NULL ALTER TABLE dbo.operadores ADD created_at DATETIME2 NULL;
IF COL_LENGTH('dbo.operadores','updated_at') IS NULL ALTER TABLE dbo.operadores ADD updated_at DATETIME2 NULL;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_operadores_rfid' AND object_id=OBJECT_ID('dbo.operadores'))
    CREATE UNIQUE INDEX UX_operadores_rfid ON dbo.operadores(rfid) WHERE rfid IS NOT NULL;

/* Empresa */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name='empresa' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.empresa (
        id INT IDENTITY(1,1) PRIMARY KEY,
        rfc NVARCHAR(20) NULL,
        nombre NVARCHAR(50) NULL,
        calle NVARCHAR(50) NULL,
        colonia NVARCHAR(50) NULL,
        ciudad NVARCHAR(50) NULL,
        estado NVARCHAR(50) NULL,
        cp INT NULL,
        contacto NVARCHAR(50) NULL,
        correo NVARCHAR(50) NULL,
        telefono NVARCHAR(50) NULL,
        logotipo NVARCHAR(255) NULL,
        created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 DEFAULT SYSUTCDATETIME()
    );
END
IF COL_LENGTH('dbo.empresa','rfc') IS NULL ALTER TABLE dbo.empresa ADD rfc NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.empresa','nombre') IS NULL ALTER TABLE dbo.empresa ADD nombre NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.empresa','calle') IS NULL ALTER TABLE dbo.empresa ADD calle NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.empresa','colonia') IS NULL ALTER TABLE dbo.empresa ADD colonia NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.empresa','ciudad') IS NULL ALTER TABLE dbo.empresa ADD ciudad NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.empresa','estado') IS NULL ALTER TABLE dbo.empresa ADD estado NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.empresa','cp') IS NULL ALTER TABLE dbo.empresa ADD cp INT NULL;
IF COL_LENGTH('dbo.empresa','contacto') IS NULL ALTER TABLE dbo.empresa ADD contacto NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.empresa','correo') IS NULL ALTER TABLE dbo.empresa ADD correo NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.empresa','telefono') IS NULL ALTER TABLE dbo.empresa ADD telefono NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.empresa','logotipo') IS NULL ALTER TABLE dbo.empresa ADD logotipo NVARCHAR(255) NULL;
IF COL_LENGTH('dbo.empresa','created_at') IS NULL ALTER TABLE dbo.empresa ADD created_at DATETIME2 NULL;
IF COL_LENGTH('dbo.empresa','updated_at') IS NULL ALTER TABLE dbo.empresa ADD updated_at DATETIME2 NULL;

/* Variables */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name='variables' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.variables (
        id INT IDENTITY(1,1) PRIMARY KEY,
        variable_prov1 NVARCHAR(50) NULL,
        variable_prov2 NVARCHAR(50) NULL,
        variable_prov3 NVARCHAR(50) NULL,
        variable_clie1 NVARCHAR(50) NULL,
        variable_clie2 NVARCHAR(50) NULL,
        variable_clie3 NVARCHAR(50) NULL,
        created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 DEFAULT SYSUTCDATETIME()
    );
END
IF COL_LENGTH('dbo.variables','variable_prov1') IS NULL ALTER TABLE dbo.variables ADD variable_prov1 NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.variables','variable_prov2') IS NULL ALTER TABLE dbo.variables ADD variable_prov2 NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.variables','variable_prov3') IS NULL ALTER TABLE dbo.variables ADD variable_prov3 NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.variables','variable_clie1') IS NULL ALTER TABLE dbo.variables ADD variable_clie1 NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.variables','variable_clie2') IS NULL ALTER TABLE dbo.variables ADD variable_clie2 NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.variables','variable_clie3') IS NULL ALTER TABLE dbo.variables ADD variable_clie3 NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.variables','created_at') IS NULL ALTER TABLE dbo.variables ADD created_at DATETIME2 NULL;
IF COL_LENGTH('dbo.variables','updated_at') IS NULL ALTER TABLE dbo.variables ADD updated_at DATETIME2 NULL;

/* Procesos */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name='procesos' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.procesos (
        id INT IDENTITY(1,1) PRIMARY KEY,
        op NVARCHAR(20) NOT NULL,
        cliente_id INT NOT NULL,
        producto_id INT NOT NULL,
        variable1 NVARCHAR(50) NULL,
        variable2 NVARCHAR(50) NULL,
        variable3 NVARCHAR(50) NULL,
        empaques INT NULL,
        piezas FLOAT NULL,
        lote NVARCHAR(20) NULL,
        imagen NVARCHAR(255) NULL,
        created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 DEFAULT SYSUTCDATETIME()
    );
END
IF COL_LENGTH('dbo.procesos','op') IS NULL ALTER TABLE dbo.procesos ADD op NVARCHAR(20) NOT NULL DEFAULT(N'');
IF COL_LENGTH('dbo.procesos','cliente_id') IS NULL ALTER TABLE dbo.procesos ADD cliente_id INT NOT NULL DEFAULT(0);
IF COL_LENGTH('dbo.procesos','producto_id') IS NULL ALTER TABLE dbo.procesos ADD producto_id INT NOT NULL DEFAULT(0);
IF COL_LENGTH('dbo.procesos','variable1') IS NULL ALTER TABLE dbo.procesos ADD variable1 NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.procesos','variable2') IS NULL ALTER TABLE dbo.procesos ADD variable2 NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.procesos','variable3') IS NULL ALTER TABLE dbo.procesos ADD variable3 NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.procesos','empaques') IS NULL ALTER TABLE dbo.procesos ADD empaques INT NULL;
IF COL_LENGTH('dbo.procesos','piezas') IS NULL ALTER TABLE dbo.procesos ADD piezas FLOAT NULL;
BEGIN TRY ALTER TABLE dbo.procesos ALTER COLUMN piezas FLOAT NULL; END TRY BEGIN CATCH END CATCH;
IF COL_LENGTH('dbo.procesos','lote') IS NULL ALTER TABLE dbo.procesos ADD lote NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.procesos','imagen') IS NULL ALTER TABLE dbo.procesos ADD imagen NVARCHAR(255) NULL;
BEGIN TRY ALTER TABLE dbo.procesos ALTER COLUMN imagen NVARCHAR(MAX) NULL; END TRY BEGIN CATCH END CATCH;
IF COL_LENGTH('dbo.procesos','created_at') IS NULL ALTER TABLE dbo.procesos ADD created_at DATETIME2 NULL;
IF COL_LENGTH('dbo.procesos','updated_at') IS NULL ALTER TABLE dbo.procesos ADD updated_at DATETIME2 NULL;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_procesos_op' AND object_id=OBJECT_ID('dbo.procesos'))
    CREATE UNIQUE INDEX UX_procesos_op ON dbo.procesos(op);
IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys WHERE name='FK_procesos_clientes' AND parent_object_id = OBJECT_ID('dbo.procesos')
) ALTER TABLE dbo.procesos ADD CONSTRAINT FK_procesos_clientes FOREIGN KEY (cliente_id) REFERENCES dbo.clientes(id);
IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys WHERE name='FK_procesos_productos' AND parent_object_id = OBJECT_ID('dbo.procesos')
) ALTER TABLE dbo.procesos ADD CONSTRAINT FK_procesos_productos FOREIGN KEY (producto_id) REFERENCES dbo.productos(id);

/* Inventario */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name='inventario' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.inventario (
        id INT IDENTITY(1,1) PRIMARY KEY,
        fecha DATE NULL,
        codigo_mr NVARCHAR(30) NULL,
        descripcion NVARCHAR(100) NULL,
        cantidad FLOAT NULL,
        producto_id INT NULL,
        cliente_id INT NULL,
        created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 DEFAULT SYSUTCDATETIME()
    );
END
IF COL_LENGTH('dbo.inventario','id') IS NULL ALTER TABLE dbo.inventario ADD id INT IDENTITY(1,1) NOT NULL;
IF COL_LENGTH('dbo.inventario','fecha') IS NULL ALTER TABLE dbo.inventario ADD fecha DATE NULL;
IF COL_LENGTH('dbo.inventario','codigo_mr') IS NULL ALTER TABLE dbo.inventario ADD codigo_mr NVARCHAR(30) NULL;
IF COL_LENGTH('dbo.inventario','descripcion') IS NULL ALTER TABLE dbo.inventario ADD descripcion NVARCHAR(100) NULL;
IF COL_LENGTH('dbo.inventario','cantidad') IS NULL ALTER TABLE dbo.inventario ADD cantidad FLOAT NULL;
BEGIN TRY ALTER TABLE dbo.inventario ALTER COLUMN cantidad FLOAT NULL; END TRY BEGIN CATCH END CATCH;
IF COL_LENGTH('dbo.inventario','producto_id') IS NULL ALTER TABLE dbo.inventario ADD producto_id INT NULL;
IF COL_LENGTH('dbo.inventario','cliente_id') IS NULL ALTER TABLE dbo.inventario ADD cliente_id INT NULL;
IF COL_LENGTH('dbo.inventario','created_at') IS NULL ALTER TABLE dbo.inventario ADD created_at DATETIME2 NULL;
IF COL_LENGTH('dbo.inventario','updated_at') IS NULL ALTER TABLE dbo.inventario ADD updated_at DATETIME2 NULL;
IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys WHERE name='FK_inventario_productos' AND parent_object_id = OBJECT_ID('dbo.inventario')
) ALTER TABLE dbo.inventario ADD CONSTRAINT FK_inventario_productos FOREIGN KEY (producto_id) REFERENCES dbo.productos(id);
IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys WHERE name='FK_inventario_clientes' AND parent_object_id = OBJECT_ID('dbo.inventario')
) ALTER TABLE dbo.inventario ADD CONSTRAINT FK_inventario_clientes FOREIGN KEY (cliente_id) REFERENCES dbo.clientes(id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_inventario_bus' AND object_id=OBJECT_ID('dbo.inventario'))
    CREATE INDEX IX_inventario_bus ON dbo.inventario(fecha, codigo_mr, producto_id, cliente_id);
-- Relajar columna legada en inventario si existe como NOT NULL sin default
BEGIN TRY ALTER TABLE dbo.inventario ALTER COLUMN Folio NVARCHAR(50) NULL; END TRY BEGIN CATCH END CATCH;
BEGIN TRY ALTER TABLE dbo.inventario ALTER COLUMN Folio INT NULL; END TRY BEGIN CATCH END CATCH;

/* Proveedores */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name='proveedores' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.proveedores (
        id INT IDENTITY(1,1) PRIMARY KEY,
        idprov NVARCHAR(20) NOT NULL,
        nombre NVARCHAR(50) NOT NULL,
        observaciones NVARCHAR(50) NULL,
        created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 DEFAULT SYSUTCDATETIME()
    );
END
IF COL_LENGTH('dbo.proveedores','id') IS NULL ALTER TABLE dbo.proveedores ADD id INT IDENTITY(1,1) NOT NULL;
IF COL_LENGTH('dbo.proveedores','idprov') IS NULL ALTER TABLE dbo.proveedores ADD idprov NVARCHAR(20) NOT NULL DEFAULT(N'');
IF COL_LENGTH('dbo.proveedores','nombre') IS NULL ALTER TABLE dbo.proveedores ADD nombre NVARCHAR(50) NOT NULL DEFAULT(N'');
IF COL_LENGTH('dbo.proveedores','observaciones') IS NULL ALTER TABLE dbo.proveedores ADD observaciones NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.proveedores','created_at') IS NULL ALTER TABLE dbo.proveedores ADD created_at DATETIME2 NULL;
IF COL_LENGTH('dbo.proveedores','updated_at') IS NULL ALTER TABLE dbo.proveedores ADD updated_at DATETIME2 NULL;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_proveedores_idprov' AND object_id=OBJECT_ID('dbo.proveedores'))
    CREATE UNIQUE INDEX UX_proveedores_idprov ON dbo.proveedores(idprov);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_proveedores_id' AND object_id=OBJECT_ID('dbo.proveedores'))
    CREATE UNIQUE INDEX UX_proveedores_id ON dbo.proveedores(id);

/* Permarekel */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name='permarekel' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.permarekel (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nombre NVARCHAR(50) NOT NULL,
        config NVARCHAR(MAX) NOT NULL,
        created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 DEFAULT SYSUTCDATETIME()
    );
END
IF COL_LENGTH('dbo.permarekel','nombre') IS NULL ALTER TABLE dbo.permarekel ADD nombre NVARCHAR(50) NOT NULL DEFAULT(N'');
IF COL_LENGTH('dbo.permarekel','config') IS NULL ALTER TABLE dbo.permarekel ADD config NVARCHAR(MAX) NOT NULL DEFAULT(N'{}');
IF COL_LENGTH('dbo.permarekel','created_at') IS NULL ALTER TABLE dbo.permarekel ADD created_at DATETIME2 NULL;
IF COL_LENGTH('dbo.permarekel','updated_at') IS NULL ALTER TABLE dbo.permarekel ADD updated_at DATETIME2 NULL;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_permarekel_nombre' AND object_id=OBJECT_ID('dbo.permarekel'))
    CREATE UNIQUE INDEX UX_permarekel_nombre ON dbo.permarekel(nombre);

/* Operadores */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name='operadores' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.operadores (
        id INT IDENTITY(1,1) PRIMARY KEY,
        rfid NVARCHAR(20) NULL,
        nombre NVARCHAR(50) NOT NULL,
        password_hash NVARCHAR(255) NOT NULL,
        estacion NVARCHAR(20) NULL,
        created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 DEFAULT SYSUTCDATETIME()
    );
END
IF COL_LENGTH('dbo.operadores','id') IS NULL ALTER TABLE dbo.operadores ADD id INT IDENTITY(1,1) NOT NULL;
IF COL_LENGTH('dbo.operadores','rfid') IS NULL ALTER TABLE dbo.operadores ADD rfid NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.operadores','nombre') IS NULL ALTER TABLE dbo.operadores ADD nombre NVARCHAR(50) NOT NULL DEFAULT(N'');
IF COL_LENGTH('dbo.operadores','password_hash') IS NULL ALTER TABLE dbo.operadores ADD password_hash NVARCHAR(255) NOT NULL DEFAULT(N'');
IF COL_LENGTH('dbo.operadores','estacion') IS NULL ALTER TABLE dbo.operadores ADD estacion NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.operadores','created_at') IS NULL ALTER TABLE dbo.operadores ADD created_at DATETIME2 NULL;
IF COL_LENGTH('dbo.operadores','updated_at') IS NULL ALTER TABLE dbo.operadores ADD updated_at DATETIME2 NULL;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_operadores_rfid' AND object_id=OBJECT_ID('dbo.operadores'))
    CREATE UNIQUE INDEX UX_operadores_rfid ON dbo.operadores(rfid) WHERE rfid IS NOT NULL;

GO
