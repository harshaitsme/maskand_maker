param (
  [Parameter(Mandatory=$false)]
  [string]$Username = "harshaitsme",

  [Parameter(Mandatory=$false)]
  [string]$Tag = "latest"
)

Write-Host "🐳 =====================================================" -ForegroundColor Cyan
Write-Host "🚀 Mask & Maker - Local Docker Hub Push Utility" -ForegroundColor Cyan
Write-Host "📦 Target Docker Hub Username: $Username" -ForegroundColor Yellow
Write-Host "🏷️  Target Tag: $Tag" -ForegroundColor Yellow
Write-Host "========================================================`n" -ForegroundColor Cyan

$services = @(
  @{ Local = "mask-and-maker-catalog-service:latest"; Remote = "maskandmaker-catalog-service" },
  @{ Local = "mask-and-maker-artisan-service:latest"; Remote = "maskandmaker-artisan-service" },
  @{ Local = "mask-and-maker-content-service:latest"; Remote = "maskandmaker-content-service" },
  @{ Local = "mask-and-maker-verify-service:latest"; Remote = "maskandmaker-verify-service" },
  @{ Local = "mask-and-maker-order-service:latest"; Remote = "maskandmaker-order-service" },
  @{ Local = "mask-and-maker-search-service:latest"; Remote = "maskandmaker-search-service" },
  @{ Local = "mask-and-maker-identity-service:latest"; Remote = "maskandmaker-identity-service" },
  @{ Local = "mask-and-maker-portal-service:latest"; Remote = "maskandmaker-portal-service" },
  @{ Local = "mask-and-maker-media-service:latest"; Remote = "maskandmaker-media-service" },
  @{ Local = "mask-and-maker-settlement-service:latest"; Remote = "maskandmaker-settlement-service" },
  @{ Local = "mask-and-maker-notification-service:latest"; Remote = "maskandmaker-notification-service" },
  @{ Local = "mask-and-maker-api-gateway:latest"; Remote = "maskandmaker-api-gateway" },
  @{ Local = "image_to_glb:1.0v"; Remote = "maskandmaker-3d-ai-service" }
)

foreach ($s in $services) {
  $targetImage = "$Username/$($s.Remote):$Tag"
  Write-Host "🔄 Tagging $($s.Local) -> $targetImage..." -ForegroundColor Gray
  docker tag $s.Local $targetImage

  Write-Host "⬆️  Pushing $targetImage to Docker Hub..." -ForegroundColor Green
  docker push $targetImage

  if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully pushed $targetImage`n" -ForegroundColor Green
  } else {
    Write-Host "⚠️  Failed to push $targetImage. Please run 'docker login' first if not authenticated.`n" -ForegroundColor Red
  }
}

Write-Host "🎉 Finished processing all microservice images!" -ForegroundColor Cyan
