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
import { getAheadBehind, revSymmetricDifference } from '../../lib/git/rev-list'
import { IAheadBehind } from '../../models/branch'
import { ExecCompareBranchScript, IScriptInfo } from '../../lib/custom-script'
import { getChangedFileNames } from '../../lib/git'

interface ICompareBranchDialogProps {
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

  readonly scriptInfo: IScriptInfo
}

interface ICompareBranchDialogState {
  /**
   * The current filter text used to search branches.
   */
  readonly filterText: string
  /**
   * The branch currently selected for comparison.
   */
  readonly selectedBranch: Branch | null

  /**
   *   Changed files between current branch and selected branch (merge base)
   */
  readonly FileChangeMergeBase: ReadonlyArray<string>

  /**
   *   Changed files between current branch and selected branch (diff base)
   */
  readonly FileChangeDiffBase: ReadonlyArray<string>

  /**
   * The ahead/behind commit count for the selected branch
   */
  readonly aheadBehind: IAheadBehind | null
}

export class CompareBranchDialog extends React.Component<
  ICompareBranchDialogProps,
  ICompareBranchDialogState
> {
  public constructor(props: ICompareBranchDialogProps) {
    super(props)
    this.state = {
      filterText: '',
      selectedBranch: null,
      FileChangeMergeBase: [],
      FileChangeDiffBase: [],
      aheadBehind: null,
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
      this.setState({
        selectedBranch: null,
        FileChangeDiffBase: [],
        FileChangeMergeBase: [],
        aheadBehind: null,
      })
      return
    }

    // Calculate ahead/behind count between current branch and selected branch
    const range = revSymmetricDifference(
      currentBranch.name,
      selectedBranch.name
    )
    const aheadBehind = await getAheadBehind(repository, range)

    const FileChangeMergeBase = await getChangedFileNames(
      repository,
      selectedBranch.name,
      currentBranch.name,
      { useMergeBase: true }
    )

    const FileChangeDiffBase = await getChangedFileNames(
      repository,
      selectedBranch.name,
      currentBranch.name,
      { useMergeBase: false }
    )

    this.setState({
      selectedBranch,
      FileChangeMergeBase,
      FileChangeDiffBase,
      aheadBehind,
    })
  }

  private onSubmit = async () => {
    const { selectedBranch, FileChangeMergeBase, FileChangeDiffBase } =
      this.state
    const { dispatcher, currentBranch, scriptInfo, repository } = this.props

    if (
      selectedBranch === null ||
      this.state.aheadBehind === null ||
      (this.state.aheadBehind.ahead === 0 &&
        this.state.aheadBehind.behind === 0)
    ) {
      return
    }

    dispatcher.closePopup(PopupType.CompareBranchScript)

    // Create the child process
    const childProcess = ExecCompareBranchScript(
      scriptInfo,
      repository,
      currentBranch,
      selectedBranch,
      FileChangeDiffBase,
      FileChangeMergeBase
    )

    // Show the streaming popup
    dispatcher.startStreamingProcess(
      `${scriptInfo.name}: ${currentBranch.name} ... ${selectedBranch.name}`,
      childProcess
    )
  }

  private onItemClick = (branch: Branch, source: ClickSource) => {
    if (source.kind !== 'keyboard' || source.event.key !== 'Enter') {
      return
    }
    source.event.preventDefault()
    this.onSubmit()
  }

  private onDismissed = () => {
    this.props.dispatcher.closePopup(PopupType.CompareBranchScript)
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

  private renderComparePreview() {
    const branch = this.state.selectedBranch?.name ?? '-'
    const mergeBase = this.state.FileChangeMergeBase.length
    const diffBase = this.state.FileChangeDiffBase.length
    const ahead = this.state.aheadBehind?.ahead ?? 0
    const behind = this.state.aheadBehind?.behind ?? 0

    return (
      <div>
        <div className="git-diff-script-preview">
          Compare: <strong>{this.props.currentBranch.name}</strong> to{' '}
          <strong>{branch}</strong>
        </div>
        <div className="git-diff-script-preview-container">
          <div className="git-diff-script-preview-column">
            <div className="git-diff-script-preview">
              <span>Merge Base: </span>
              <strong>{`${mergeBase} `}</strong>
              <span>{mergeBase === 1 ? 'file' : 'files'}</span>
            </div>
            <div className="git-diff-script-preview">
              <span>Diff Base: </span>
              <strong>{`${diffBase} `}</strong>
              <span>{diffBase === 1 ? 'file' : 'files'}</span>
            </div>
          </div>
          <div className="git-diff-script-preview-column">
            <div className="git-diff-script-preview">
              <span>Ahead: </span>
              <strong>{`${ahead} `}</strong>
              <span>{ahead === 1 ? 'commit' : 'commits'}</span>
            </div>
            <div className="git-diff-script-preview">
              <span>Behind: </span>
              <strong>{`${behind} `}</strong>
              <span>{behind === 1 ? 'commit' : 'commits'}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  public render() {
    const disabledButton =
      this.state.aheadBehind === null ||
      (this.state.aheadBehind.ahead === 0 &&
        this.state.aheadBehind.behind === 0)

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
          {this.renderComparePreview()}
          <Button
            className="exec-branch-script-button"
            type="submit"
            disabled={disabledButton}
          >
            Execute {this.props.scriptInfo.name}
          </Button>
        </DialogFooter>
      </Dialog>
    )
  }
}
