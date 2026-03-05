param(
  [Parameter(Mandatory=$true)][string]$Server,
  [Parameter(Mandatory=$true)][string]$Database,
  [Parameter(Mandatory=$true)][string]$Output,
  [string]$User,
  [string]$Password
)

if (!(Get-Command sqlcmd -ErrorAction SilentlyContinue)) {
  Write-Error 'sqlcmd no está instalado o no está en PATH.'
  exit 1
}

$script = Join-Path $PSScriptRoot 'backup_database.sql'

if ($User -and $Password) {
  sqlcmd -S $Server -U $User -P $Password -v DBNAME=$Database BAKPATH=$Output -i $script
} else {
  sqlcmd -S $Server -E -v DBNAME=$Database BAKPATH=$Output -i $script
}

if ($LASTEXITCODE -ne 0) {
  Write-Error 'Error al ejecutar BACKUP. Revisa mensajes anteriores.'
  exit $LASTEXITCODE
}

Write-Host "Backup generado en: $Output"

