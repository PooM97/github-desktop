import * as Path from 'path'
import { git } from '../git/core'

/**
 * Find files tracked by Git that match the given file name pattern.
 *
 * @param repository The target Git repository.
 * @param fileName The file name pattern to search for.
 * @returns An array of absolute paths to matching files.
 */
export async function findFileInGit(
  path: string,
  fileName: string
): Promise<string[]> {
  const result = await git(['ls-files', `*${fileName}*`], path, 'lsFiles')
  return result.stdout
    .split('\n')
    .filter(line => line.length > 0)
    .map(relativePath => Path.join(path, relativePath))
}
