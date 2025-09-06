import * as React from 'react'
import { DialogContent } from '../dialog'
import { TextBox } from '../lib/text-box'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { Row } from '../lib/row'

interface ICustomConfig {
  readonly pythonPath: string
  readonly pyVenv: string
  readonly pylint: boolean
  readonly onPythonPathChanged: (path: string) => void
  readonly onPyVenvChanged: (path: string) => void
  readonly onPylintChanged: (isEnable: boolean) => void
}

export class CustomConfig extends React.Component<ICustomConfig> {
  private onPylintChanged = (event: React.FormEvent<HTMLInputElement>) => {
    this.props.onPylintChanged(event.currentTarget.checked)
  }

  public render() {
    return (
      <DialogContent>
        <h2 id="custom-config-heading">Custom Config</h2>
        <Row>
          <TextBox
            placeholder="/usr/bin/python3"
            label="PYTHONPATH"
            value={this.props.pythonPath}
            onValueChanged={this.props.onPythonPathChanged}
          />
        </Row>
        <Row>
          <TextBox
            placeholder={
              __DARWIN__ ? 'usr/src/venv/bin' : 'usr/src/venv/Scripts'
            }
            label="Virtual Env"
            value={this.props.pyVenv}
            onValueChanged={this.props.onPyVenvChanged}
          />
        </Row>
        <Row>
          <Checkbox
            label="Enable Pylint"
            value={this.props.pylint ? CheckboxValue.On : CheckboxValue.Off}
            onChange={this.onPylintChanged}
          />
        </Row>
      </DialogContent>
    )
  }
}
