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
      path: '/Users/poom/Documents/github-desktop/fake.sh',
    },
  ],
  ActiveBranch: []
}

export type scriptType = 'CompareBranch' | 'ActiveBranch'

export function getScripts(type: scriptType) {
  return script[type]
}
