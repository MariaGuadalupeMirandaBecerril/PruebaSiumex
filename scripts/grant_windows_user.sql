-- Otorgar acceso a un usuario/grupo de Windows a la base SOConteo
-- Uso en SSMS:
-- 1) Ajusta las variables entre [] a tu usuario/grupo de Windows
--    por ejemplo: [DESKTOP-AMBO3EU\Admin]
-- 2) Ejecuta este script conectado como SYSADMIN sobre el servidor
-- 3) Se crea el LOGIN si no existe, usuario en SOConteo y rol db_owner

USE [master];
GO

DECLARE @win_principal sysname = N'DESKTOP-AMBO3EU\\Admin';
DECLARE @db sysname = N'SOConteo';

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = @win_principal)
BEGIN
    DECLARE @sql1 nvarchar(max) = N'CREATE LOGIN [' + @win_principal + N'] FROM WINDOWS;';
    EXEC sp_executesql @sql1;
END

DECLARE @sql2 nvarchar(max) = N'USE [' + @db + N']; IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N''' + @win_principal + N''')
BEGIN CREATE USER [' + @win_principal + N'] FOR LOGIN [' + @win_principal + N']; END;';
EXEC sp_executesql @sql2;

DECLARE @sql3 nvarchar(max) = N'USE [' + @db + N']; ALTER ROLE [db_owner] ADD MEMBER [' + @win_principal + N'];';
EXEC sp_executesql @sql3;

PRINT 'Permisos otorgados a ' + @win_principal + ' en ' + @db + '.';

