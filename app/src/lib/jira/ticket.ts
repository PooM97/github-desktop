import { getJiraUrl } from './store'

/**
 * Get Jira ticket ID
 *
 * @param branchName The branch name to get ticket Id.
 */
export function getTicketID(branchName: string): string | null {
  const match = branchName.match(/\/([^/-]+-[^/-]+)/)
  const ticket = match ? match[1] : null
  return ticket
}

/**
 * Get the Jira ticket URL
 *
 * @param ticketID The ticket ID
 */
export function getJiraTicketUrl(ticketID: string) {
  const url = getJiraUrl()
  if (url === null) {
    return null
  }
  return `${url}/browse/${ticketID}`
}
