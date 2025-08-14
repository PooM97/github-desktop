import * as Path from 'path'
import { Repository } from '../../models/repository'
import { getBranchMergeBaseChangedFiles } from '../git/diff'
import { spawn } from 'child_process'
import { Branch } from '../../models/branch'
import { findFileInGit } from '../git/ls-file'
import { getLatestCommitSha } from '../git/rev-parse'

/**
 * Get all changed Python files between two branches (based on their merge base).
 *
 * @param repository The target Git repository.
 * @param baseBranch The base branch to compare against.
 * @param comparisonBranch The branch whose latest commit is compared to the base.
 * @returns An array of absolute paths to changed `.py` files (empty if none).
 */
export async function getPyFilesChangedBetweenBranches(
  repository: Repository,
  baseBranch: Branch,
  comparisonBranch: Branch
): Promise<string[]> {
  // latest commit of comparisonBranch
  const latestSha = await getLatestCommitSha(
    repository.path,
    comparisonBranch.name
  )

  if (latestSha === null) {
    return []
  }

  const changes = await getBranchMergeBaseChangedFiles(
    repository,
    baseBranch.name,
    comparisonBranch.name,
    latestSha
  )

  if (!changes) {
    return []
  }

  return changes.files
    .map(f => f.path)
    .filter(p => p.toLowerCase().endsWith('.py'))
    .map(p => Path.join(repository.path, p))
}

/**
 * Run Pylint on a list of files.
 *
 * @param files Absolute file paths to lint. If empty, returns a no-op result.
 * @param cwd The working directory where Pylint is executed.
 * @returns A promise resolving to the Pylint exit code and captured stdio.
 */
export async function pylint(files: string[], cwd: string) {
  return new Promise<{ code: number; stdout: string; stderr: string }>(
    async (resolve, reject) => {
      if (files.length === 0) {
        return resolve({
          code: 0,
          stdout: 'No Python files changed.',
          stderr: '',
        })
      }
      const pylintrcFiles = await findFileInGit(
        { path: cwd } as Repository,
        '.pylintrc'
      )
      const pylintrcPath = pylintrcFiles.length > 0 ? pylintrcFiles[0] : null

      const args = [
        '--disable=import-error',
        '--output=pylint_report.txt',
        ...(pylintrcPath ? ['--rcfile', pylintrcPath] : []),
      ]
      log.info(`Pylint arguments: ${args.join(' ')}`)

      const child = spawn('pylint', [...args, ...files], { cwd })
      let out = '',
        err = ''
      child.stdout.on('data', d => (out += d.toString()))
      child.stderr.on('data', d => (err += d.toString()))
      child.on('error', reject)
      child.on('close', code =>
        resolve({ code: code ?? 1, stdout: out, stderr: err })
      )
    }
  )
}

/**
 * Run Pylint on Python files changed between two branches.
 *
 * @param repository The target Git repository.
 * @param baseBranch The base branch to compare against.
 * @param comparisonBranch The branch whose changes will be linted.
 * @returns A promise resolving to the Pylint process result (exit code, stdout, stderr).
 * @throws If Git or Pylint invocation fails.
 */
export async function pylintOnDiff(
  repository: Repository,
  baseBranch: Branch,
  comparisonBranch: Branch
) {
  try {
    log.info(`Run pylint between ${baseBranch.name}...${comparisonBranch.name}`)

    const files = await getPyFilesChangedBetweenBranches(
      repository,
      baseBranch,
      comparisonBranch
    )
    if (files.length === 0) {
      throw new Error(
        `No python files changed between ${baseBranch.name}...${comparisonBranch.name}.`
      )
    }

    return await pylint(files, repository.path)
  } catch (error) {
    log.error(
      `Failed to run pylint on branch comparison ${baseBranch}...${comparisonBranch}:`,
      error
    )
    throw error
  }
}
