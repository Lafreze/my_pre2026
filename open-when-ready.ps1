param(
  [Parameter(Mandatory = $true)]
  [string]$Url
)

$ErrorActionPreference = "SilentlyContinue"

for ($attempt = 0; $attempt -lt 90; $attempt++) {
  $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
  if ($response.StatusCode -eq 200) {
    Start-Process $Url
    exit 0
  }
  Start-Sleep -Milliseconds 500
}

exit 1
