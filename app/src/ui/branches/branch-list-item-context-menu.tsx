import {
  getScript,
  getCustomScriptPath,
  IScriptInfo,
} from '../../lib/custom-script'
import { IMenuItem } from '../../lib/menu-item'
import { clipboard } from 'electron'
import { Repository } from '../../models/repository'

interface IBranchContextMenuConfig {
  name: string
  isLocal: boolean
  repository: Repository
  onRenameBranch?: (branchName: string) => void
  onViewPullRequestOnGitHub?: () => void
  onDeleteBranch?: (branchName: string) => void
  onExecActiveBranchScript?: (script: IScriptInfo) => void
  onExecCompareBranchScript?: (script: IScriptInfo) => void
  onManageScript?: (path: string) => void
}

async function getCompareBranchScriptMenuItems(
  fn: (script: IScriptInfo) => void,
  repository: Repository
): Promise<ReadonlyArray<IMenuItem>> {
  const scripts = await getScript('CompareBranch')

  const items: IMenuItem[] = []
  for (const script of scripts) {
    if (script.repositories && script.repositories.includes(repository.name)) {
      items.push({
        label: script.name,
        action: () => fn(script),
      })
    }
  }
  return items
}

async function getActiveScriptMenuItems(
  fn: (script: IScriptInfo) => void,
  repository: Repository
): Promise<ReadonlyArray<IMenuItem>> {
  const scripts = await getScript('ActiveBranch')

  const items: IMenuItem[] = []
  for (const script of scripts) {
    if (script.repositories && script.repositories.includes(repository.name)) {
      items.push({
        label: script.name,
        action: () => fn(script),
      })
    }
  }
  return items
}

export async function generateBranchContextMenuItems(
  config: IBranchContextMenuConfig
): Promise<IMenuItem[]> {
  const {
    name,
    isLocal,
    repository,
    onRenameBranch,
    onViewPullRequestOnGitHub,
    onDeleteBranch,
    onExecCompareBranchScript,
    onExecActiveBranchScript,
    onManageScript,
  } = config
  const items = new Array<IMenuItem>()

  if (onRenameBranch !== undefined) {
    items.push({
      label: 'Rename…',
      action: () => onRenameBranch(name),
      enabled: isLocal,
    })
  }

  items.push({
    label: __DARWIN__ ? 'Copy Branch Name' : 'Copy branch name',
    action: () => clipboard.writeText(name),
  })

  if (onViewPullRequestOnGitHub !== undefined) {
    items.push({
      label: 'View Pull Request on GitHub',
      action: () => onViewPullRequestOnGitHub(),
    })
  }

  // Prepare submenu for running scripts
  const runScriptSubmenu = new Array<IMenuItem>()

  if (onExecActiveBranchScript !== undefined) {
    runScriptSubmenu.push(
      ...(await getActiveScriptMenuItems(onExecActiveBranchScript, repository))
    )
  }

  if (onExecCompareBranchScript !== undefined) {
    runScriptSubmenu.push(
      ...(await getCompareBranchScriptMenuItems(
        onExecCompareBranchScript,
        repository
      ))
    )
  }

  // Add the "Execute Script" submenu if there are any scripts available otherwise add the "Manage Scripts" item
  items.push({ type: 'separator' })
  const manageScriptsMenu = {
    label: __DARWIN__ ? 'Manage Script' : 'Manage script',
    action: async () => {
      if (onManageScript) {
        const scriptPath = await getCustomScriptPath()
        onManageScript(scriptPath)
      }
    },
  }

  if (runScriptSubmenu.length > 0) {
    runScriptSubmenu.push({ type: 'separator' })
    runScriptSubmenu.push(manageScriptsMenu)

    items.push({
      label: __DARWIN__ ? 'Execute Script' : 'Execute script',
      submenu: runScriptSubmenu,
    })
  } else {
    items.push(manageScriptsMenu)
  }

  items.push({ type: 'separator' })
  if (onDeleteBranch !== undefined) {
    items.push({
      label: 'Delete…',
      action: () => onDeleteBranch(name),
    })
  }

  return items
}
