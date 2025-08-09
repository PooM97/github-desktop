import * as React from 'react'
import { DialogContent } from '../dialog'
import { Row } from '../lib/row'
import { TextBox } from '../lib/text-box'

interface ISelfIntegrationsPreferencesProps {
  readonly jiraUrl: string
  readonly onJiraUrlChanged: (editor: string) => void
}

interface ISelfIntegrationsPreferencesState {
  readonly JiraUrl: string
}

export class SelfIntegrations extends React.Component<
  ISelfIntegrationsPreferencesProps,
  ISelfIntegrationsPreferencesState
> {
  public constructor(props: ISelfIntegrationsPreferencesProps) {
    super(props)

    this.state = {
      JiraUrl: this.props.jiraUrl,
    }
  }
  public componentDidUpdate(
    prevProps: ISelfIntegrationsPreferencesProps,
    prevState: ISelfIntegrationsPreferencesState
  ) {
    if (prevState.JiraUrl !== this.props.jiraUrl) {
      this.setState({ JiraUrl: this.props.jiraUrl })
    }
  }

  private renderJiraURL() {
    const { JiraUrl } = this.state
    return (
      <TextBox
        label="Jira Url"
        value={JiraUrl}
        disabled={false}
        onValueChanged={this.props.onJiraUrlChanged}
      />
    )
  }

  public render() {
    return (
      <DialogContent>
        <fieldset>
          <Row>{this.renderJiraURL()}</Row>
        </fieldset>
      </DialogContent>
    )
  }
}
