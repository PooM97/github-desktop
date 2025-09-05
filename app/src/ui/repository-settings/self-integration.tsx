import * as React from 'react'
import { DialogContent } from '../dialog'
import { TextBox } from '../lib/text-box'

interface ISelfIntegration {
  readonly pythonPath: string
  readonly onPythonPathChanged: (name: string) => void
}

export class SelfIntegration extends React.Component<ISelfIntegration> {
  public render() {
    return (
      <DialogContent>
        <TextBox
          placeholder="/usr/bin/python3"
          label="PYTHONPATH"
          value={this.props.pythonPath}
          onValueChanged={this.props.onPythonPathChanged}
        />
      </DialogContent>
    )
  }
}
