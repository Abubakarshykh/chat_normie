$normiesPath = 'd:/Normie AI/server/data/normies.json'

# Load existing data
$normiesJson = Get-Content -Path $normiesPath -Raw | ConvertFrom-Json

# Mapping of character IDs to new token IDs
$tokenMap = @{
    'n001' = 88
    'n002' = 256
    'n003' = 7
    'n004' = 0
    'n005' = 21
    'n006' = 999
    'n007' = 42
    'n008' = 100
    'n009' = 369
    'n010' = 1337
}

foreach ($char in $normiesJson) {
    $id = $char.id
    if ($tokenMap.ContainsKey($id)) {
        $newToken = $tokenMap[$id]
        $char.tokenId = $newToken
        $char.nftName = "Normie #$newToken"
        $char.imageUrl = "https://api.normies.art/normie/$newToken/image.png"

        # Fetch traits
        $traitsUrl = "https://api.normies.art/normie/$newToken/traits"
        $traitsResponse = Invoke-RestMethod -Uri $traitsUrl -Method Get -Headers @{'Accept'='application/json'}
        if ($traitsResponse -and $traitsResponse.attributes) {
            $char.nftTraits = $traitsResponse.attributes
        }

        # Fetch persona preview
        $personaUrl = "https://api.normies.art/agents/persona-preview/$newToken"
        $personaResponse = Invoke-RestMethod -Uri $personaUrl -Method Get -Headers @{'Accept'='application/json'}
        if ($personaResponse) {
            $char.agentPersona = $personaResponse
        }
    }
}

# Write back with proper indentation
$normiesJson | ConvertTo-Json -Depth 10 | Set-Content -Path $normiesPath -Encoding UTF8

Write-Host "normies.json updated successfully."
