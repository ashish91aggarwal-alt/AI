# Tarot Talk Desk: install the app and put a shortcut on the Desktop.
# Run from PowerShell inside your clone of the AI repo:
#     powershell -ExecutionPolicy Bypass -File .\instagram-scouting\install-desk.ps1
# Add  -Startup  to also start the app when Windows starts.
param([switch]$Startup)
$ErrorActionPreference = 'Stop'
$proj = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Split-Path -Parent $proj

function Need($name, $hint) { if (-not (Get-Command $name -ErrorAction SilentlyContinue)) { Write-Host "MISSING: $name.  Install it with:  $hint  then close and reopen PowerShell and run this again." -ForegroundColor Yellow; exit 1 } }
Need python 'winget install Python.Python.3.12'
python -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)" 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "Python 3.10 or newer is needed (the Microsoft Store placeholder does not count). Install it with:  winget install Python.Python.3.12" -ForegroundColor Yellow; exit 1 }
Need git    'winget install Git.Git'
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) { Write-Host "ffmpeg is missing. The app will install and open, but cannot read reels until you run:  winget install Gyan.FFmpeg" -ForegroundColor Yellow }

Write-Host "Installing the tt-scout package (this takes a few minutes the first time) ..."
python -m pip install --upgrade -e "$proj"
if ($LASTEXITCODE -ne 0) { Write-Host "pip could not install the package." -ForegroundColor Red; exit 1 }

# so the app finds the project wherever it is started from
[Environment]::SetEnvironmentVariable('TT_SCOUT_HOME', $proj, 'User')

$exe = (python -c "import shutil; print(shutil.which('tt-desk') or '')").Trim()
$pyw = (python -c "import sys, os; print(os.path.join(os.path.dirname(sys.executable), 'pythonw.exe'))").Trim()
$ico = Join-Path $proj 'tt_scout\desk.ico'
function Make-Shortcut($path) {
  $w = New-Object -ComObject WScript.Shell
  $s = $w.CreateShortcut($path)
  # Always start through Python itself: Windows can block the small tt-desk.exe starter because it is unsigned.
  $s.TargetPath = $pyw; $s.Arguments = '-m tt_scout.desk'
  $s.WorkingDirectory = $proj
  $s.IconLocation = $ico
  $s.Description = 'Tarot Talk Desk: scout queue, tools and work'
  $s.Save()
}
$desktop = [Environment]::GetFolderPath('Desktop')
Make-Shortcut (Join-Path $desktop 'Tarot Talk Desk.lnk')
Write-Host "Shortcut created: $desktop\Tarot Talk Desk.lnk" -ForegroundColor Green
if ($Startup) { Make-Shortcut (Join-Path ([Environment]::GetFolderPath('Startup')) 'Tarot Talk Desk.lnk'); Write-Host "It will also start with Windows." -ForegroundColor Green }
Write-Host "Done. Double-click 'Tarot Talk Desk' on the Desktop. Everything is done from that window from now on."
