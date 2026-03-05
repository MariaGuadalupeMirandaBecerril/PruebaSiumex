$ErrorActionPreference = 'Stop'

param(
  [int]$Port = 5055
)

Write-Host "Launching Node backend on port $Port for smoke tests..."

$out = Join-Path 'tmp' 'node_server.out.log'
$err = Join-Path 'tmp' 'node_server.err.log'
if (Test-Path $out) { Remove-Item $out -Force }
if (Test-Path $err) { Remove-Item $err -Force }
New-Item -ItemType Directory -Force -Path 'tmp' | Out-Null

$env:PORT = $Port
$env:VERIFY_DB_ON_START = 0

$p = Start-Process -FilePath 'node' -ArgumentList 'node-backend/server.js' -PassThru -RedirectStandardOutput $out -RedirectStandardError $err

try {
  $ready = $false
  for ($i=0; $i -lt 80; $i++) {
    Start-Sleep -Milliseconds 250
    if (Test-Path $out) {
      $t = Get-Content $out -Raw
      if ($t -match 'listening on') { $ready = $true; break }
    }
    if (Test-Path $err) {
      $e = Get-Content $err -Raw
      if ($e -match 'Error' -or $e -match 'Exception') { break }
    }
  }
  if (-not $ready) {
    $tailOut = (Test-Path $out) ? ((Get-Content $out | Select-Object -Last 20) -join "`n") : ''
    $tailErr = (Test-Path $err) ? ((Get-Content $err | Select-Object -Last 20) -join "`n") : ''
    throw "Servidor no inició. OUT:`n$tailOut`nERR:`n$tailErr"
  }

  $health = Invoke-WebRequest -Uri ("http://127.0.0.1:{0}/health" -f $Port) -UseBasicParsing -TimeoutSec 5
  $root = Invoke-WebRequest -Uri ("http://127.0.0.1:{0}/" -f $Port) -UseBasicParsing -TimeoutSec 5
  $ui = Invoke-WebRequest -Uri ("http://127.0.0.1:{0}/" -f $Port) -UseBasicParsing -TimeoutSec 5

  Write-Host "Health: $($health.StatusCode)"
  Write-Host "Root:   $($root.StatusCode)"
  Write-Host "UI:     $($ui.StatusCode)"

  if ($health.StatusCode -ne 200 -or $root.StatusCode -ne 200 -or $ui.StatusCode -ne 200) {
    throw "Alguna verificación falló"
  }
  exit 0
}
catch {
  Write-Error $_
  exit 1
}
finally {
  if ($p -and -not $p.HasExited) {
    Stop-Process -Id $p.Id -Force | Out-Null
  }
}
