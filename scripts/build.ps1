# Gera dist\autofill-ia-<versão>.zip pronto para a Chrome Web Store / Edge Add-ons (Windows).
$root = Split-Path -Parent $PSScriptRoot
$version = (Get-Content "$root\extension\manifest.json" -Raw | ConvertFrom-Json).version
New-Item -ItemType Directory -Force -Path "$root\dist" | Out-Null
$out = "$root\dist\autofill-ia-$version.zip"
if (Test-Path $out) { Remove-Item $out }
Compress-Archive -Path "$root\extension\*" -DestinationPath $out
Write-Host "Pacote criado: $out"
