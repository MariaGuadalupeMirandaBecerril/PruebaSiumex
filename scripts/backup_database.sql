-- Uso con sqlcmd (Windows):
-- Autenticación integrada (Trusted_Connection):
--   sqlcmd -S . -E -v DBNAME="SOConteo" BAKPATH="C:\\backups\\SOConteo_$(ESCAPE_SQUOTE(ENVIRON_USER))_$(DATE)_$(TIME).bak" -i scripts\backup_database.sql
-- SQL Login:
--   sqlcmd -S localhost -U sa -P "YourStrong!Passw0rd" -v DBNAME="SOConteo" BAKPATH="C:\\backups\\SOConteo.bak" -i scripts\backup_database.sql

:setvar DBNAME "SOConteo"
:setvar BAKPATH "C:\\SOConteo.bak"

-- Crea carpeta si no existe cuando se usa xp_cmdshell (opcional, deshabilitada por defecto)
-- EXEC sp_configure 'show advanced options', 1; RECONFIGURE;
-- EXEC sp_configure 'xp_cmdshell', 1; RECONFIGURE;
-- EXEC ('IF NOT EXIST "$(BAKPATH)" (echo.)');

PRINT 'Iniciando BACKUP de ' + '$(DBNAME)' + ' a ' + '$(BAKPATH)';
BACKUP DATABASE [$(DBNAME)]
TO DISK = N'$(BAKPATH)'
WITH INIT, COPY_ONLY, COMPRESSION, STATS = 10;
GO

