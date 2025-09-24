import React from 'react'
import { ChildProcess } from 'child_process'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Button } from '../lib/button'
import { Dispatcher } from '../dispatcher'
import { PopupType } from '../../models/popup'

interface IStreamProcessDialogProps {
  readonly dispatcher: Dispatcher
  readonly title: string
  readonly process: ChildProcess
  readonly onDismissed?: () => void
}

interface IStreamProcessDialogState {
  readonly output: string
  readonly isRunning: boolean
  readonly exitCode: number | null
  readonly shouldAutoScroll: boolean
  readonly copySuccess: boolean
}

export class StreamProcessDialog extends React.Component<
  IStreamProcessDialogProps,
  IStreamProcessDialogState
> {
  private outputRef = React.createRef<HTMLPreElement>()

  public constructor(props: IStreamProcessDialogProps) {
    super(props)

    this.state = {
      output: '',
      isRunning: true,
      exitCode: null,
      shouldAutoScroll: true,
      copySuccess: false,
    }

    this.setupProcessHandlers()
  }

  public componentDidMount() {
    this.scrollToBottom()
  }

  public componentDidUpdate(
    prevProps: IStreamProcessDialogProps,
    prevState: IStreamProcessDialogState
  ) {
    // Only auto-scroll if output changed and we should auto-scroll
    if (prevState.output !== this.state.output && this.state.shouldAutoScroll) {
      this.scrollToBottom()
    }
  }

  private setupProcessHandlers = () => {
    const { process } = this.props

    // Handle stdout
    if (process.stdout) {
      process.stdout.setEncoding('utf8')
      process.stdout.on('data', (chunk: string | Buffer) => {
        const text = chunk.toString()
        this.appendOutput(text, 'stdout')
      })

      process.stdout.on('error', error => {
        this.appendOutput(`stdout error: ${error.message}\n`, 'error')
      })
    }

    // Handle stderr
    if (process.stderr) {
      process.stderr.setEncoding('utf8')
      process.stderr.on('data', (chunk: string | Buffer) => {
        const text = chunk.toString()
        this.appendOutput(text, 'stderr')
      })

      process.stderr.on('error', error => {
        this.appendOutput(`stderr error: ${error.message}\n`, 'error')
      })
    }

    // Handle process events
    process.on('close', (code, signal) => {
      this.setState({
        isRunning: false,
        exitCode: code,
        shouldAutoScroll: true, // Auto-scroll to show final result
      })

      const exitMessage = signal
        ? `\nProcess terminated by signal: ${signal}\n`
        : `\nProcess exited with code: ${code}\n`

      this.appendOutput(exitMessage, code === 0 ? 'success' : 'error')
    })

    process.on('error', error => {
      this.setState({ isRunning: false })
      this.appendOutput(`\nProcess error: ${error.message}\n`, 'error')
    })
  }

  private appendOutput = (
    text: string,
    type: 'stdout' | 'stderr' | 'error' | 'success'
  ) => {
    this.setState(prevState => ({
      output: prevState.output + text,
    }))
  }

  private scrollToBottom = () => {
    if (this.outputRef.current) {
      this.outputRef.current.scrollTop = this.outputRef.current.scrollHeight
    }
  }

  private scrollToBottomAndEnable = () => {
    this.setState({ shouldAutoScroll: true })
    this.scrollToBottom()
  }

  private onScroll = () => {
    if (this.outputRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = this.outputRef.current
      // Check if user is at the bottom (within 50px threshold for smooth experience)
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50

      // Update shouldAutoScroll state
      if (isAtBottom !== this.state.shouldAutoScroll) {
        this.setState({ shouldAutoScroll: isAtBottom })
      }
    }
  }

  private copyAllOutput = () => {
    if (this.state.output) {
      navigator.clipboard
        .writeText(this.state.output)
        .then(() => {
          this.setState({ copySuccess: true })
          // Reset success state after 2 seconds
          setTimeout(() => {
            this.setState({ copySuccess: false })
          }, 2000)
        })
        .catch(error => {
          console.error('Failed to copy output to clipboard:', error)
        })
    }
  }

  private onDismissed = () => {
    this.props.onDismissed?.()
    this.props.dispatcher.closePopup(PopupType.StreamProcess)
  }

  private onClosedOrKilled = () => {
    if (this.state.isRunning) {
      this.props.process.kill()
    } else {
      this.props.onDismissed?.()
      this.props.dispatcher.closePopup(PopupType.StreamProcess)
    }
  }

  private renderStatusIndicator() {
    const { isRunning, exitCode } = this.state

    if (isRunning) {
      return (
        <div className="process-status running">
          <span className="process-indicator"></span>
          Running...
        </div>
      )
    } else {
      const statusClass = exitCode === 0 ? 'success' : 'error'
      const statusText = exitCode === 0 ? 'Completed' : `Failed`

      return (
        <div className={`process-status ${statusClass}`}>
          <span className="process-indicator"></span>
          {statusText}
        </div>
      )
    }
  }

  public render() {
    const { title } = this.props
    const { output, isRunning } = this.state

    return (
      <Dialog
        id="stream-process"
        onDismissed={this.onDismissed}
        title={title}
        className="stream-process-dialog"
      >
        <DialogContent>
          <div className="process-header">
            {this.renderStatusIndicator()}
            <div className="process-actions">
              {!this.state.shouldAutoScroll && this.state.isRunning && (
                <Button
                  onClick={this.scrollToBottomAndEnable}
                  className="scroll-to-bottom-button"
                  size="small"
                >
                  ↓ Follow output
                </Button>
              )}
              {this.state.output && (
                <Button
                  onClick={this.copyAllOutput}
                  className="copy-output-button"
                  size="small"
                >
                  {this.state.copySuccess ? 'Copied!' : 'Copy All'}
                </Button>
              )}
            </div>
          </div>

          <pre
            ref={this.outputRef}
            className="process-output"
            onScroll={this.onScroll}
          >
            {output || 'Waiting for output...'}
          </pre>
        </DialogContent>
        <DialogFooter>
          <Button onClick={this.onClosedOrKilled}>
            {isRunning ? 'Kill' : 'Close'}
          </Button>
        </DialogFooter>
      </Dialog>
    )
  }
}
