Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy Bypass -Force -ErrorAction SilentlyContinue

$projectPath = "C:\Folders I Actually Use\Code\Visual Studio Code\UAS SWE\track-it"
$delayInSeconds = 5

Start-Process -FilePath "code" -ArgumentList "." -WorkingDirectory $projectPath

Write-Host "Waiting for $delayInSeconds seconds before launching npm dev server..." -ForegroundColor Yellow
for ($i = $delayInSeconds; $i -ge 1; $i--) {
    Write-Host -NoNewline "Launching in $i seconds...`r"
    Start-Sleep -Seconds 1
}
Write-Host "Launching npm dev server now...                                 " -ForegroundColor Green

Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "npm", "run", "dev" -WorkingDirectory $projectPath