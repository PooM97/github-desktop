import React from 'react'
import { Repository } from '../../models/repository'
import { Dispatcher } from '../dispatcher'
import { Branch } from '../../models/branch'
import { ClickSource } from '../lib/list'
import { BranchList, IBranchListItem, renderDefaultBranch } from '../branches'
import { IMatches } from '../../lib/fuzzy-find'
import { getDefaultAriaLabelForBranch } from '../branches/branch-renderer'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { PopupType } from '../../models/popup'
import { Button } from '../lib/button'
import {
  getPyFilesChangedBetweenBranches,
  pylintOnDiff,
} from '../../lib/pylint/pylint-cmd'

interface IPylintDialogProps {
  readonly dispatcher: Dispatcher

  readonly repository: Repository

  /**
   * See IBranchesState.defaultBranch
   */
  readonly defaultBranch: Branch | null

  /**
   * The currently checked out branch
   */
  readonly currentBranch: Branch

  /**
   * See IBranchesState.allBranches
   */
  readonly allBranches: ReadonlyArray<Branch>

  /**
   * See IBranchesState.recentBranches
   */
  readonly recentBranches: ReadonlyArray<Branch>
}

interface IPylintDialogState {
  /**
   * The current filter text used to search branches.
   */
  readonly filterText: string
  /**
   * The branch currently selected for comparison.
   */
  readonly selectedBranch: Branch | null
  /**
   * /** Whether the 'Run Pylint' button should be disabled.
   */
  readonly disablePylint: boolean
  /**
   * The number of Python files that differ between the selected and current branch.
   */
  readonly fileDiffCount: number
}

export class PylintDialog extends React.Component<
  IPylintDialogProps,
  IPylintDialogState
> {
  public constructor(props: IPylintDialogProps) {
    super(props)
    this.state = {
      filterText: '',
      selectedBranch: null,
      disablePylint: true,
      fileDiffCount: 0,
    }
  }

  private getBranchAriaLabel = (
    item: IBranchListItem,
    authorDate: Date | undefined
  ): string => {
    return getDefaultAriaLabelForBranch(item, authorDate)
  }

  private onFilterTextChanged = (filterText: string) => {
    this.setState({ filterText })
  }

  public onSelectionChanged = async (selectedBranch: Branch | null) => {
    const { repository, currentBranch } = this.props

    if (selectedBranch === null) {
      return
    }
    const fileDiffCount = (
      await getPyFilesChangedBetweenBranches(
        repository,
        selectedBranch,
        currentBranch
      )
    ).length

    const disablePylint =
      fileDiffCount === 0 ||
      (selectedBranch !== null && selectedBranch.name === currentBranch.name)

    this.setState({ selectedBranch, disablePylint, fileDiffCount })
  }

  private onSubmit = async () => {
    const { selectedBranch, fileDiffCount } = this.state
    const { dispatcher, repository, currentBranch } = this.props

    if (
      selectedBranch === null ||
      currentBranch.name === selectedBranch.name ||
      fileDiffCount === 0
    ) {
      return
    }
    dispatcher.closePopup(PopupType.RunPylint)
    dispatcher.runPylint(repository, selectedBranch, currentBranch)
  }

  private onItemClick = (branch: Branch, source: ClickSource) => {
    if (source.kind !== 'keyboard' || source.event.key !== 'Enter') {
      return
    }
    source.event.preventDefault()
    this.onSubmit()
  }

  private onDismissed = () => {
    this.props.dispatcher.closePopup(PopupType.RunPylint)
  }

  private renderBranch = (
    item: IBranchListItem,
    matches: IMatches,
    authorDate: Date | undefined
  ) => {
    return renderDefaultBranch(
      item,
      matches,
      this.props.currentBranch,
      authorDate
    )
  }

  private renderFileDiffPreview() {
    return (
      <strong className="file-diff-preview">{`${this.state.fileDiffCount} diff files`}</strong>
    )
  }

  public render() {
    return (
      <Dialog
        id="choose-branch"
        onSubmit={this.onSubmit}
        onDismissed={this.onDismissed}
        title={`Compare with ${this.props.currentBranch.name}`}
      >
        <DialogContent>
          <BranchList
            repository={this.props.repository}
            allBranches={this.props.allBranches}
            currentBranch={this.props.currentBranch}
            defaultBranch={this.props.defaultBranch}
            recentBranches={this.props.recentBranches}
            filterText={this.state.filterText}
            onFilterTextChanged={this.onFilterTextChanged}
            selectedBranch={this.state.selectedBranch}
            onSelectionChanged={this.onSelectionChanged}
            canCreateNewBranch={false}
            renderBranch={this.renderBranch}
            getBranchAriaLabel={this.getBranchAriaLabel}
            onItemClick={this.onItemClick}
          />
        </DialogContent>
        <DialogFooter>
          {this.renderFileDiffPreview()}
          <Button
            className="pylint-button"
            type="submit"
            disabled={this.state.disablePylint}
          >
            Run Pylint
          </Button>
        </DialogFooter>
      </Dialog>
    )
  }
}
