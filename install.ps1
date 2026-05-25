#Requires -Version 5.1
<#
.SYNOPSIS
    Deploy kwong-claude-marketplace artifacts to ~/.claude/
.DESCRIPTION
    Copies agents, commands, and skills from the marketplace repo directly into
    the Claude Code user directory (~/.claude/). Skips files already present
    and identical; backs up any files it would overwrite.
#>

$ErrorActionPreference = 'Stop'

$RepoRoot   = $PSScriptRoot
$ClaudeDir  = "$env:USERPROFILE\.claude"
$BackupDir  = "$ClaudeDir\backups\kwong-marketplace-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

$AgentsSrc1  = Join-Path $RepoRoot 'plugins\kwong-agents\agents'
$AgentsSrc2  = Join-Path $RepoRoot 'plugins\kwong-stack-agents\agents'
$CommandsSrc = Join-Path $RepoRoot 'plugins\kwong-commands\commands'
$SkillsSrc   = Join-Path $RepoRoot 'plugins\kwong-skills\skills'

$AgentsDst   = Join-Path $ClaudeDir 'agents'
$CommandsDst = Join-Path $ClaudeDir 'commands'
$SkillsDst   = Join-Path $ClaudeDir 'skills'

$stats = @{ copied = 0; skipped = 0; backed_up = 0 }

function Ensure-Dir($path) {
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
    }
}

function Copy-WithBackup($src, $dst) {
    if (Test-Path $dst) {
        $srcHash = (Get-FileHash $src -Algorithm MD5).Hash
        $dstHash = (Get-FileHash $dst -Algorithm MD5).Hash
        if ($srcHash -eq $dstHash) {
            $stats.skipped++
            return
        }
        # Back up the existing file before overwriting
        Ensure-Dir $BackupDir
        $rel = $dst.Substring($ClaudeDir.Length + 1)
        $backupPath = Join-Path $BackupDir $rel
        Ensure-Dir (Split-Path $backupPath -Parent)
        Copy-Item $dst $backupPath -Force
        $stats.backed_up++
    }
    Ensure-Dir (Split-Path $dst -Parent)
    Copy-Item $src $dst -Force
    $stats.copied++
}

Write-Host ""
Write-Host "kwong-claude-marketplace installer" -ForegroundColor Cyan
Write-Host "Deploying to: $ClaudeDir" -ForegroundColor Cyan
Write-Host ""

# --- kwong-agents ---
Write-Host "kwong-agents..." -NoNewline
Ensure-Dir $AgentsDst
Get-ChildItem $AgentsSrc1 -Filter '*.md' | ForEach-Object {
    Copy-WithBackup $_.FullName (Join-Path $AgentsDst $_.Name)
}
Write-Host " done"

# --- kwong-stack-agents ---
Write-Host "kwong-stack-agents..." -NoNewline
Ensure-Dir $AgentsDst
Get-ChildItem $AgentsSrc2 -Filter '*.md' | ForEach-Object {
    Copy-WithBackup $_.FullName (Join-Path $AgentsDst $_.Name)
}
Write-Host " done"

# --- Commands (flat copy of all .md files from all subdirectories) ---
Write-Host "Commands..." -NoNewline
Ensure-Dir $CommandsDst
Get-ChildItem $CommandsSrc -Filter '*.md' -Recurse | ForEach-Object {
    Copy-WithBackup $_.FullName (Join-Path $CommandsDst $_.Name)
}
Write-Host " done"

# --- Skills ---
Write-Host "Skills..." -NoNewline
Ensure-Dir $SkillsDst
Get-ChildItem $SkillsSrc -Directory | ForEach-Object {
    $skillName = $_.Name
    $skillDst  = Join-Path $SkillsDst $skillName
    Ensure-Dir $skillDst
    Get-ChildItem $_.FullName -File | ForEach-Object {
        Copy-WithBackup $_.FullName (Join-Path $skillDst $_.Name)
    }
}
Write-Host " done"

Write-Host ""
Write-Host "Results:" -ForegroundColor Green
Write-Host "  Copied   : $($stats.copied)"
Write-Host "  Skipped  : $($stats.skipped) (identical)"
Write-Host "  Backed up: $($stats.backed_up) (originals in $BackupDir)"
Write-Host ""

if ($stats.copied -gt 0) {
    Write-Host "Restart Claude Code (or open a new session) to pick up the new agents, commands, and skills." -ForegroundColor Yellow
} else {
    Write-Host "Everything already up to date." -ForegroundColor Green
}
