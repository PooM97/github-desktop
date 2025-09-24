import { getScripts, IScriptInfo } from '../../lib/custom-script'
import { IMenuItem } from '../../lib/menu-item'
import { clipboard } from 'electron'

interface IBranchContextMenuConfig {
  name: string
  isLocal: boolean
  onRenameBranch?: (branchName: string) => void
  onViewPullRequestOnGitHub?: () => void
  onDeleteBranch?: (branchName: string) => void
  onExecCompareBranchScript?: (script: IScriptInfo) => void
}

function getCompareBranchScriptMenuItems(
  fn: (script: IScriptInfo) => void
): ReadonlyArray<IMenuItem> {
  const scripts = getScripts('CompareBranch')
  return scripts.map(script => ({
    label: script.name,
    action: () => fn(script),
  }))
}

export function generateBranchContextMenuItems(
  config: IBranchContextMenuConfig
): IMenuItem[] {
  const {
    name,
    isLocal,
    onRenameBranch,
    onViewPullRequestOnGitHub,
    onDeleteBranch,
    onExecCompareBranchScript,
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

  items.push({ type: 'separator' })

  // Prepare submenu for running scripts
  const runScriptSubmenu = new Array<IMenuItem>()

  // Add Compare Branch scripts if available
  if (onExecCompareBranchScript !== undefined) {
    runScriptSubmenu.push(
      ...getCompareBranchScriptMenuItems(onExecCompareBranchScript)
    )
  }

  if (runScriptSubmenu.length > 0) {
    items.push({
      label: __DARWIN__ ? 'Run Scripts' : 'Run scripts',
      submenu: runScriptSubmenu,
    })
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
