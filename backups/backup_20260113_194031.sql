-- Backup lógico generado por scripts/backup_sqlserver_dump.py
SET NOCOUNT ON;
GO
-- Tabla: Detalle_Formula
DELETE FROM [Detalle_Formula];
GO
INSERT INTO [Detalle_Formula] ([IdDetalle], [Cantidad], [Tolerancia], [IdIng], [IdForm]) VALUES (1, 0.2, 10, 'ING001', 'FRM001');
INSERT INTO [Detalle_Formula] ([IdDetalle], [Cantidad], [Tolerancia], [IdIng], [IdForm]) VALUES (2, 0.1, 10, 'ING003', 'FRM001');
INSERT INTO [Detalle_Formula] ([IdDetalle], [Cantidad], [Tolerancia], [IdIng], [IdForm]) VALUES (3, 1.0, 0, 'ENV001', 'FRM001');
INSERT INTO [Detalle_Formula] ([IdDetalle], [Cantidad], [Tolerancia], [IdIng], [IdForm]) VALUES (4, 2.5, 10, 'ING002', 'FRM001');
INSERT INTO [Detalle_Formula] ([IdDetalle], [Cantidad], [Tolerancia], [IdIng], [IdForm]) VALUES (5, 0.25, 5, 'ING004', 'FRM002');
INSERT INTO [Detalle_Formula] ([IdDetalle], [Cantidad], [Tolerancia], [IdIng], [IdForm]) VALUES (6, 0.1, 5, 'ING005', 'FRM002');
INSERT INTO [Detalle_Formula] ([IdDetalle], [Cantidad], [Tolerancia], [IdIng], [IdForm]) VALUES (7, 0.05, 5, 'ING006', 'FRM002');
INSERT INTO [Detalle_Formula] ([IdDetalle], [Cantidad], [Tolerancia], [IdIng], [IdForm]) VALUES (8, 1.5, 5, 'ING007', 'FRM002');
GO
-- Tabla: Detalle_Produccion
DELETE FROM [Detalle_Produccion];
GO
INSERT INTO [Detalle_Produccion] ([IdDetalleProduccion], [FolioProduccion], [IdIng], [PesIng], [PMax], [PMin], [Pesado]) VALUES (1, 1, 'ING001', 26.316, 28.947, 23.684, 0);
INSERT INTO [Detalle_Produccion] ([IdDetalleProduccion], [FolioProduccion], [IdIng], [PesIng], [PMax], [PMin], [Pesado]) VALUES (2, 1, 'ING003', 13.158, 14.474, 11.842, 0);
INSERT INTO [Detalle_Produccion] ([IdDetalleProduccion], [FolioProduccion], [IdIng], [PesIng], [PMax], [PMin], [Pesado]) VALUES (3, 1, 'ENV001', 131.579, 131.579, 131.579, 0);
INSERT INTO [Detalle_Produccion] ([IdDetalleProduccion], [FolioProduccion], [IdIng], [PesIng], [PMax], [PMin], [Pesado]) VALUES (4, 1, 'ING002', 328.947, 361.842, 296.053, 0);
INSERT INTO [Detalle_Produccion] ([IdDetalleProduccion], [FolioProduccion], [IdIng], [PesIng], [PMax], [PMin], [Pesado]) VALUES (5, 2, 'ING004', 0.658, 0.691, 0.625, 0);
INSERT INTO [Detalle_Produccion] ([IdDetalleProduccion], [FolioProduccion], [IdIng], [PesIng], [PMax], [PMin], [Pesado]) VALUES (6, 2, 'ING005', 0.263, 0.276, 0.25, 0);
INSERT INTO [Detalle_Produccion] ([IdDetalleProduccion], [FolioProduccion], [IdIng], [PesIng], [PMax], [PMin], [Pesado]) VALUES (7, 2, 'ING006', 0.132, 0.138, 0.125, 0);
INSERT INTO [Detalle_Produccion] ([IdDetalleProduccion], [FolioProduccion], [IdIng], [PesIng], [PMax], [PMin], [Pesado]) VALUES (8, 2, 'ING007', 3.947, 4.145, 3.75, 0);
GO
-- Tabla: Empresa
DELETE FROM [Empresa];
GO
INSERT INTO [Empresa] ([RFC], [Nombre], [Calle], [Colonia], [Ciudad], [Estado], [CP], [Contacto], [Correo], [Telefono], [Logotipo]) VALUES ('ISI1906285A7', 'SIAUMex', 'Sotavento 1005', 'Real Solare', 'El Marqués', 'Querétaro', '76246', 'Ventas', 'ventas@siaumex.com', '4426125001', 'logos_empresa/1768260128587-SIAUMex.jpg');
GO
-- Tabla: Estaciones
DELETE FROM [Estaciones];
GO
INSERT INTO [Estaciones] ([IdEst], [Nombre], [Obs], [activo]) VALUES ('EST001', 'Producción', 'Área de maquila', 1);
GO
-- Tabla: Formulas
DELETE FROM [Formulas];
GO
INSERT INTO [Formulas] ([IdForm], [Nombre]) VALUES ('FRM001', 'Agua de limón');
INSERT INTO [Formulas] ([IdForm], [Nombre]) VALUES ('FRM002', 'Chicharrón en salsa verde');
GO
-- Tabla: Herramientas
DELETE FROM [Herramientas];
GO
-- Tabla: Ingredientes
DELETE FROM [Ingredientes];
GO
INSERT INTO [Ingredientes] ([IdIng], [Nombre], [Presentacion], [Observaciones], [Pesado], [activo]) VALUES ('ENV001', 'Envase 250 ml', 250.0, 'Envase plástico', 0, 1);
INSERT INTO [Ingredientes] ([IdIng], [Nombre], [Presentacion], [Observaciones], [Pesado], [activo]) VALUES ('ING001', 'Azúcar morena', 25.0, 'Azúcar en saco', 1, 1);
INSERT INTO [Ingredientes] ([IdIng], [Nombre], [Presentacion], [Observaciones], [Pesado], [activo]) VALUES ('ING002', 'Limón', 100.0, 'Jugo de limón', 1, 1);
INSERT INTO [Ingredientes] ([IdIng], [Nombre], [Presentacion], [Observaciones], [Pesado], [activo]) VALUES ('ING003', 'Chía', 100.0, 'No aplican', 1, 1);
INSERT INTO [Ingredientes] ([IdIng], [Nombre], [Presentacion], [Observaciones], [Pesado], [activo]) VALUES ('ING004', 'Chicharrón', 30.0, 'Chicharrón seco', 1, 1);
INSERT INTO [Ingredientes] ([IdIng], [Nombre], [Presentacion], [Observaciones], [Pesado], [activo]) VALUES ('ING005', 'Chile verde', 0.0, 'Chile para hacer salsa', 1, 1);
INSERT INTO [Ingredientes] ([IdIng], [Nombre], [Presentacion], [Observaciones], [Pesado], [activo]) VALUES ('ING006', 'Sal', 25.0, 'Sal de mar', 1, 1);
INSERT INTO [Ingredientes] ([IdIng], [Nombre], [Presentacion], [Observaciones], [Pesado], [activo]) VALUES ('ING007', 'Agua', 30.0, 'No aplican', 1, 1);
GO
-- Tabla: Inventario
DELETE FROM [Inventario];
GO
INSERT INTO [Inventario] ([Folio], [FolioProduccion], [IdForm], [LForm], [dIng], [PObj], [PReal], [PDif], [IdUsu], [Fecha]) VALUES (1, 1, 'FRM001', 'L120126', 'ING001', 26.32, 24.52, 0.8, 4, '2026-01-12 00:00:00');
INSERT INTO [Inventario] ([Folio], [FolioProduccion], [IdForm], [LForm], [dIng], [PObj], [PReal], [PDif], [IdUsu], [Fecha]) VALUES (2, 2, 'FRM002', 'L130126', 'ING006', 0.66, 0.64, 0.02, 4, '2026-01-13 00:00:00');
GO
-- Tabla: Operadores
DELETE FROM [Operadores];
GO
INSERT INTO [Operadores] ([RFID], [Nombre], [Contraseña], [IdEst], [activo]) VALUES ('RFID001', 'Operador', 'SIAUMex*', 'EST001', 1);
GO
-- Tabla: Produccion
DELETE FROM [Produccion];
GO
INSERT INTO [Produccion] ([Folio], [OP], [IdForm], [Lote], [PesForm], [Estatus], [Fecha], [IdUsu], [IdOperador]) VALUES (1, 'OP001', 'FRM001', 'L120126', 500.0, 0, '2026-01-12 17:28:04.393000', 4, 'RFID001');
INSERT INTO [Produccion] ([Folio], [OP], [IdForm], [Lote], [PesForm], [Estatus], [Fecha], [IdUsu], [IdOperador]) VALUES (2, 'OP002', 'FRM002', 'L130126', 5.0, 1, '2026-01-13 16:06:38.827000', 4, 'RFID001');
GO
-- Tabla: Usuarios
DELETE FROM [Usuarios];
GO
INSERT INTO [Usuarios] ([id], [RFID], [Nombre], [Correo], [password], [Rol], [activo]) VALUES (4, 'RFID001', 'SIAUMex', 'ventas@siaumex.com', '$2b$10$sqCEtY7DaFJnIL1hWW.n7.8v0KnyV9ftr6mMStK2nys3Ac2mtkazy', 'administrador', 1);
INSERT INTO [Usuarios] ([id], [RFID], [Nombre], [Correo], [password], [Rol], [activo]) VALUES (6, 'RFID002', 'Operador', 'operador@siaumex.com', '$2b$10$f8VoL8uCybPBGFg.D3896.X4M9K/jMfqUIuCwBfgAvqPimIWMfgDG', 'operador', 1);
GO
