import * as Path from 'path'
import { readdir } from 'fs/promises'
import { directoryExists } from './directory-exists'

/**
 * Recursively searches for folders with specified names starting from the given directory.
 *
 * @param cwd - The path of the directory to start searching from.
 * @param folderNames - An array of folder names to look for.
 * @returns A promise that resolves to an array of absolute paths for all matching folders found.
 */
export async function findFolder(
  cwd: string,
  folderNames: string[]
): Promise<string[]> {
  const results: string[] = []

  async function searchDir(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = Path.join(dir, entry.name)
      if (await directoryExists(fullPath)) {
        if (folderNames.includes(entry.name)) {
          results.push(fullPath)
        }
        await searchDir(fullPath)
      }
    }
  }

  await searchDir(cwd)
  return results
}

/**
 * Runs the given async function with environment variables configured for a Python
 * virtual environment, if one is found in the given path.
 *
 * @param fn        The async function to run with the configured environment variables.
 * @param path      Path to the directory to search for `venv` or `.venv`.
 * @param customEnv Optional extra environment variables to merge in.
 * @returns         The result of the executed function.
 */
export async function withPythonEnv<T>(
  fn: (env: NodeJS.ProcessEnv) => Promise<T>,
  path: string,
  customEnv?: Record<string, string | undefined>
): Promise<T> {
  // Locate the venv folder (supports 'venv' or '.venv' directly under path)
  let venvFolder: string | undefined
  for (const name of ['venv', '.venv']) {
    const p = Path.join(path, name)
    if (await directoryExists(p)) {
      venvFolder = p
      break
    }
  }

  // Global environment
  const pythonEnv = {
    ...process.env,
    ...(customEnv ?? {}),
  }
  if (venvFolder) {
    // Determine activate paths
    const binDir = __DARWIN__
      ? Path.join(venvFolder, 'bin')
      : Path.join(venvFolder, 'Scripts')

    // Prepare the environment variables for Python venv
    pythonEnv['PATH'] = `${binDir}${Path.delimiter}${process.env.PATH ?? ''}`
    pythonEnv['VIRTUAL_ENV'] = venvFolder
  }

  return await fn(pythonEnv)
}
