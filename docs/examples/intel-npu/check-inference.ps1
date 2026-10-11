param(
    [Parameter(Mandatory = $true)][uri]$Endpoint,
    [Parameter(Mandatory = $true)][string]$Model
)
$ErrorActionPreference = 'Stop'
if (-not $Endpoint.IsLoopback -or $Endpoint.Scheme -notin @('http', 'https') -or $Endpoint.UserInfo) {
    throw 'This template sends requests to localhost only.'
}
$requestBody = @{
    model = $Model
    messages = @(@{ role = 'user'; content = 'Reply with one short sentence.' })
    max_tokens = 64
    stream = $false
} | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri $Endpoint -Method Post -ContentType 'application/json' -Body $requestBody -TimeoutSec 120
