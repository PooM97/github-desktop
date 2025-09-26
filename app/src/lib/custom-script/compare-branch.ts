import { Branch } from '../../models/branch'
import { Repository } from '../../models/repository'
import { spawn, ChildProcess } from 'child_process'
import { IScriptInfo } from './core'

/**
 * Converts a Windows file path to a format compatible with Bash on Windows.
 * Example: C:\Users\user\file.sh -> /mnt/c/Users/user/file.sh
 */
function convertWindowsPathForBash(windowsPath: string): string {
  // Handle both forward and backslashes
  const normalizedPath = windowsPath.replace(/\\/g, '/')
  
  // Check if it's an absolute Windows path (starts with drive letter)
  const driveMatch = normalizedPath.match(/^([A-Za-z]):\/(.*)/)
  if (driveMatch) {
    const driveLetter = driveMatch[1].toLowerCase()
    const restOfPath = driveMatch[2]
    return `/mnt/${driveLetter}/${restOfPath}`
  }
  // If it's already a relative path or Unix-style path, return as is
  return normalizedPath
}

export function ExecCompareBranchScript(
  scriptInfo: IScriptInfo,
  repository: Repository,
  currentBranch: Branch,
  selectedBranch: Branch,
  fileChangeDiffBase: ReadonlyArray<string>,
  fileChangeMergeBase: ReadonlyArray<string>
): ChildProcess {
  const args = [
    `--currentBranch=${currentBranch.name}`,
    `--compareBranch=${selectedBranch.name}`,
    `--fileChangeDiffBase=${fileChangeDiffBase.join(',')}`,
    `--fileChangeMergeBase=${fileChangeMergeBase.join(',')}`,
  ]

  const bashScriptPath = __WIN32__
    ? convertWindowsPathForBash(scriptInfo.path)
    : scriptInfo.path

  return spawn('bash', [bashScriptPath, ...args], {
    cwd: repository.path,
    env: process.env,
  })
}
