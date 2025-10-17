import * as Path from 'path'
import { getPath } from '../../ui/main-process-proxy'
import { readFileSync, writeFileSync, existsSync } from 'fs-extra'

export interface IScript {
  ActiveBranch: IScriptInfo[]
  CompareBranch: IScriptInfo[]
}

export interface IScriptInfo {
  name: string | undefined
  path: string | undefined
  repositories: string[] | undefined
}

export type scriptType = 'CompareBranch' | 'ActiveBranch'

const defaultScript: IScript = {
  ActiveBranch: [],
  CompareBranch: [],
}

let cachedScript: IScript | null = null

/**
 * Get the path to a file or directory in the user data directory.
 */
export async function getCustomScriptPath(): Promise<string> {
  const userDataPath = await getPath('userData')
  return Path.join(userDataPath, 'custom-scripts.json')
}

/**
 * Get the contents of a file from the userData directory.
 */
export async function readCustomScript(): Promise<IScript> {
  const fullPath = await getCustomScriptPath()
  if (!existsSync(fullPath)) {
    const defaultContent = JSON.stringify(defaultScript, null, 2)
    writeFileSync(fullPath, defaultContent)
    return defaultScript
  }
  cachedScript = JSON.parse(readFileSync(fullPath, 'utf-8')) as IScript
  return cachedScript
}

/**
 * Get the custom script of a specific type, reading from cache if available.
 */
export async function getScript(type: scriptType): Promise<IScriptInfo[]> {
  if (cachedScript) {
    return cachedScript[type]
  }
  const script = await readCustomScript()
  return script[type]
}

/**
 * Converts a Windows file path to a format compatible with Bash on Windows.
 * Example: C:\Users\user\file.sh -> /mnt/c/Users/user/file.sh
 */
export function convertWindowsPathForBash(windowsPath: string): string {
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
