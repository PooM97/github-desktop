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
  const manageScriptsMenu = {
    label: __DARWIN__ ? 'Open Config' : 'Open config',
    action: async () => {
      if (onManageScript) {
        const scriptPath = await getCustomScriptPath()
        onManageScript(scriptPath)
      }
    },
  }

  // Add Compare Branch scripts if available
  if (onExecCompareBranchScript !== undefined) {
    runScriptSubmenu.push(
      ...(await getCompareBranchScriptMenuItems(
        onExecCompareBranchScript,
        repository
      ))
    )
    items.push({ type: 'separator' })
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
