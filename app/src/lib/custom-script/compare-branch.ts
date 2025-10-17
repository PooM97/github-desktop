import { Branch } from '../../models/branch'
import { Repository } from '../../models/repository'
import { spawn, ChildProcess } from 'child_process'
import { IScriptInfo, convertWindowsPathForBash } from './core'

export function execCompareBranchScript(
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

  if (!scriptInfo.path) {
    throw Error('Script path is undefined')
  }

  const bashScriptPath = __WIN32__
    ? convertWindowsPathForBash(scriptInfo.path)
    : scriptInfo.path

  return spawn('bash', [bashScriptPath, ...args], {
    cwd: repository.path,
    env: process.env,
  })
}
