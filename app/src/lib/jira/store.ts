const JIRAKEY = 'jira-url'

/**
 * Retrieve the stored Jira base URL.
 *
 * @returns The Jira base URL from localStorage, or null if not set.
 */
export function getJiraUrl(): string | null {
  const url = localStorage.getItem(JIRAKEY)
  return url && url.trim() !== '' ? url : null
}

/**
 * Store the Jira base URL in localStorage.
 *
 * @param jiraUrl The Jira base URL to store.
 */
export function setJiraUrl(jiraUrl: string) {
  localStorage.setItem(JIRAKEY, jiraUrl)
}
