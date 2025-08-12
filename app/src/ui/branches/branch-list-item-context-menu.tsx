import { IMenuItem } from '../../lib/menu-item'
import { clipboard } from 'electron'

interface IBranchContextMenuConfig {
  name: string
  isLocal: boolean
  onRenameBranch?: (branchName: string) => void
  onViewTicketOnJira?: (branchName: string) => void
  onViewPullRequestOnGitHub?: () => void
  onDeleteBranch?: (branchName: string) => void
  onRunPylint?: (branchName: string) => void
}

export function generateBranchContextMenuItems(
  config: IBranchContextMenuConfig
): IMenuItem[] {
  const {
    name,
    isLocal,
    onRenameBranch,
    onViewTicketOnJira,
    onViewPullRequestOnGitHub,
    onDeleteBranch,
    onRunPylint,
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

  if (onRunPylint !== undefined) {
    items.push({
      label: 'Run Pylint',
      action: () => onRunPylint(name),
    })
  }

  if (onViewTicketOnJira !== undefined) {
    items.push({
      label: 'View Ticket on Jira',
      action: () => onViewTicketOnJira(name),
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
