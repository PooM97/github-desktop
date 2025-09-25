import { Branch } from '../../models/branch'
import { Repository } from '../../models/repository'
import { spawn, ChildProcess } from 'child_process'
import { IScriptInfo } from './core'


export function ExecCompareBranchScript(
  script: IScriptInfo,
  repository: Repository,
  currentBranch: Branch,
  selectedBranch: Branch,
  fileChangeDiffBase: ReadonlyArray<string>,
  fileChangeMergeBase: ReadonlyArray<string>,
): ChildProcess {
  const args = [
    script.path,
    `--currentBranch=${currentBranch.name}`,
    `--compareBranch=${selectedBranch.name}`,
    `--fileChangeDiffBase=${fileChangeDiffBase.join(',')}`,
    `--fileChangeMergeBase=${fileChangeMergeBase.join(',')}`,
  ]
  return spawn('bash', args, { cwd: repository.path, env: process.env })
}
