import * as path from 'path'
import { Repository } from '../../models/repository'
import { getBranchMergeBaseChangedFiles } from '../git/diff'
import { spawn } from 'child_process'
import { Branch } from '../../models/branch'
import { findFileInGit } from '../git/ls-file'
import { getLatestCommitSha } from '../git/rev-parse'
import { withPythonEnv } from '../terminal'

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
    .map(p => path.join(repository.path, p))
}

/**
 * Helper to run a command in a child process and capture output.
 */
function _pylintSpawn(
  command: string,
  args: string[],
  options: { cwd: string; env: NodeJS.ProcessEnv }
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options)
    let stdout = ''
    let stderr = ''

    child.stdout.on('data', d => (stdout += d.toString()))
    child.stderr.on('data', d => (stderr += d.toString()))
    child.on('error', reject)
    child.on('close', code => resolve({ code: code ?? 1, stdout, stderr }))
  })
}

/**
 * Run Pylint on a list of files.
 *
 * @param files Absolute file paths to lint. If empty, returns a no-op result.
 * @param cwd The working directory where Pylint is executed.
 * @returns A promise resolving to the Pylint exit code and captured stdio.
 */
export async function pylint(files: string[], cwd: string) {
  if (files.length === 0) {
    return {
      code: 0,
      stdout: 'No Python files changed.',
      stderr: '',
    }
  }

  const pylintrcFiles = await findFileInGit(cwd, '.pylintrc')
  const pylintrcPath = pylintrcFiles.length > 0 ? pylintrcFiles[0] : null

  const args = [
    '--output=pylint_report.txt',
    ...(pylintrcPath ? ['--rcfile', pylintrcPath] : []),
    ...files,
  ]
  log.info(`Pylint arguments: ${args.join(' ')}`)

  // Ensure we execute pylint within the virtual environment by invoking Python
  return withPythonEnv(env => _pylintSpawn('pylint', args, { cwd, env }), cwd)
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
