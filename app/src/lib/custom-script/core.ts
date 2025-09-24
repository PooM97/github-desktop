export interface IScript {
  CompareBranch: IScriptInfo[]
  ActiveBranch: IScriptInfo[]
}

export interface IScriptInfo {
  name: string
  path: string
}

const script: IScript = {
  CompareBranch: [
    {
      name: 'Pylint',
      path: '/Users/poom/Desktop/custom-scripts/branch/pylint-diff-merge-base.sh',
    },
  ],
  ActiveBranch: []
}

export type scriptType = 'CompareBranch' | 'ActiveBranch'

export function getScripts(type: scriptType) {
  return script[type]
}
