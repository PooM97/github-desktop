import {
  getScript,
  getCustomScriptPath,
  IScriptInfo,
} from '../../lib/custom-script'
import { IMenuItem } from '../../lib/menu-item'
import { clipboard } from 'electron'

interface IBranchContextMenuConfig {
  name: string
  isLocal: boolean
  onRenameBranch?: (branchName: string) => void
  onViewPullRequestOnGitHub?: () => void
  onDeleteBranch?: (branchName: string) => void
  onExecCompareBranchScript?: (script: IScriptInfo) => void
  onManageScript?: (path: string) => void
}

async function getCompareBranchScriptMenuItems(
  fn: (script: IScriptInfo) => void
): Promise<ReadonlyArray<IMenuItem>> {
  const scripts = await getScript('CompareBranch')
  return scripts.map(script => ({
    label: script.name,
    action: () => fn(script),
  }))
}

export async function generateBranchContextMenuItems(
  config: IBranchContextMenuConfig
): Promise<IMenuItem[]> {
  const {
    name,
    isLocal,
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

  // Add Compare Branch scripts if available
  if (onExecCompareBranchScript !== undefined) {
    runScriptSubmenu.push(
      ...(await getCompareBranchScriptMenuItems(onExecCompareBranchScript))
    )
  }

  const manageScriptsMenu = {
    label: __DARWIN__ ? 'Manage Scripts' : 'Manage scripts',
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
      label: __DARWIN__ ? 'Run Scripts' : 'Run scripts',
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
