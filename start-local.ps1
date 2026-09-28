$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

$bundledNodeDirectory = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
$localVinext = Join-Path $PSScriptRoot "node_modules\.bin\vinext.cmd"
$browserHelper = Join-Path $PSScriptRoot "open-when-ready.ps1"
$vinextLock = Join-Path $PSScriptRoot ".vinext\dev\lock.json"
$preferredPort = 5173
$selectedPort = $preferredPort

function Test-HttpReady {
  param([string]$Url)

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
  } catch {
    return $false
  }
}

function Test-PortInUse {
  param([int]$Port)

  $listener = $null
  try {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
    $listener.Start()
    return $false
  } catch {
    return $true
  } finally {
    if ($listener) { $listener.Stop() }
  }
}

function Get-ProcessCommandLine {
  param([int]$ProcessId)

  try {
    return (Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction Stop).CommandLine
  } catch {
    return $null
  }
}

# Vinext uses a lock file. A Windows PID can later be reused by an unrelated
# process, so validate both the HTTP endpoint and the process command line.
if (Test-Path -LiteralPath $vinextLock) {
  try {
    $lock = Get-Content -Raw -LiteralPath $vinextLock | ConvertFrom-Json
    $lockUrl = if ($lock.appUrl) { [string]$lock.appUrl } else { "http://127.0.0.1:$($lock.port)/" }

    if (Test-HttpReady -Url $lockUrl) {
      Start-Process $lockUrl
      Write-Host "Presentation is already running: $lockUrl" -ForegroundColor Cyan
      exit 0
    }

    $commandLine = if ($lock.pid) { Get-ProcessCommandLine -ProcessId ([int]$lock.pid) } else { $null }
    $isThisVinextServer = $commandLine -and $commandLine.Contains("vinext") -and $commandLine.Contains($PSScriptRoot)

    if (-not $isThisVinextServer) {
      $resolvedLock = [System.IO.Path]::GetFullPath($vinextLock)
      $resolvedProject = [System.IO.Path]::GetFullPath($PSScriptRoot).TrimEnd('\') + '\'
      if (-not $resolvedLock.StartsWith($resolvedProject, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "The Vinext lock path is outside the project directory."
      }
      Remove-Item -LiteralPath $resolvedLock -Force
      Write-Host "Removed a stale Vinext startup record." -ForegroundColor DarkGray
    } else {
      throw "A Vinext process exists but is not responding. Close it in Task Manager and try again."
    }
  } catch {
    if ($_.Exception.Message -like "A Vinext process exists*") { throw }
    if (Test-Path -LiteralPath $vinextLock) {
      Remove-Item -LiteralPath $vinextLock -Force
      Write-Host "Removed an unreadable Vinext startup record." -ForegroundColor DarkGray
    }
  }
}

if (Test-PortInUse -Port $preferredPort) {
  $selectedPort = 5174..5190 | Where-Object { -not (Test-PortInUse -Port $_) } | Select-Object -First 1
  if (-not $selectedPort) {
    throw "No free local port was found between 5174 and 5190."
  }
  Write-Host "Port 5173 is in use. Using port $selectedPort instead." -ForegroundColor Yellow
}

$localUrl = "http://127.0.0.1:$selectedPort/"

# Prefer the bundled Node runtime so a different system Node version cannot
# break the one-click launcher.
if (Test-Path -LiteralPath $bundledNodeDirectory) {
  $env:Path = "$bundledNodeDirectory;$env:Path"
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js was not found. Open this project once in Codex, then try again."
}

if (-not (Test-Path -LiteralPath $localVinext)) {
  throw "Dependencies are missing. Run pnpm install once, then try again."
}

Write-Host "Starting the local presentation..." -ForegroundColor Cyan
Write-Host "The browser will open automatically. Close this window to stop the site." -ForegroundColor DarkGray
Write-Host $localUrl -ForegroundColor White

Start-Process -FilePath "powershell.exe" -WindowStyle Hidden -ArgumentList @(
  "-NoLogo",
  "-NoProfile",
  "-ExecutionPolicy", "Bypass",
  "-File", "`"$browserHelper`"",
  "-Url", "`"$localUrl`""
)

& $localVinext dev --host 127.0.0.1 --port $selectedPort
exit $LASTEXITCODE
