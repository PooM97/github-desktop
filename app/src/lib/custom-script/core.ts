import * as Path from 'path'
import { getPath } from '../../ui/main-process-proxy'
import { readFileSync, writeFileSync, existsSync } from 'fs-extra'

export interface IScript {
  ActiveBranch: IScriptInfo[]
  CompareBranch: IScriptInfo[]
}

export interface IScriptInfo {
  name: string
  path: string
}

export type scriptType = 'CompareBranch' | 'ActiveBranch'

const defaultScript: IScript = {
  ActiveBranch: [],
  CompareBranch: []
}

let cachedScript: IScript | null = null;

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
    return cachedScript[type];
  }
  const script = await readCustomScript();
  return script[type];
}
