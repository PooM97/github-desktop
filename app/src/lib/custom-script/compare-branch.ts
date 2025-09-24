import { Branch } from '../../models/branch'
import { Repository } from '../../models/repository'
import { spawn } from 'child_process'
import { IScriptInfo } from './core'


export function ExecCompareBranchScript(
  script: IScriptInfo,
  repository: Repository,
  currentBranch: Branch,
  selectedBranch: Branch,
  fileChangeDiffBase: ReadonlyArray<string>,
  fileChangeMergeBase: ReadonlyArray<string>,
) {
  // Build a flat args array and execute the script via bash
  const args = [
    script.path,
    '--currentBranch',
    currentBranch.name,
    '--compareBranch',
    selectedBranch.name,
    '--fileChangeDiffBase',
    ...fileChangeDiffBase,
    '--fileChangeMergeBase',
    ...fileChangeMergeBase,
  ]

  // Use spawn with explicit command and working directory
  const child = spawn('bash', args, { cwd: repository.path, env: process.env })
  
  // Handle stdout events
  if (child.stdout) {
    child.stdout.setEncoding('utf8')
    
    child.stdout.on('data', (chunk: string | Buffer) => {
      const text = chunk.toString().trim()
      if (text.length > 0) {
        console.log(`[CompareBranchScript:${script.name}] ${text}`)
      }
    })
    
    child.stdout.on('end', () => {
      console.log(`[CompareBranchScript:${script.name}] stdout stream ended`)
    })
    
    child.stdout.on('error', (error) => {
      console.error(`[CompareBranchScript:${script.name}] stdout error:`, error)
    })
  }
  
  // Handle stderr events
  if (child.stderr) {
    child.stderr.setEncoding('utf8')
    
    child.stderr.on('data', (chunk: string | Buffer) => {
      const text = chunk.toString().trim()
      if (text.length > 0) {
        console.error(`[CompareBranchScript:${script.name}] stderr: ${text}`)
      }
    })
  }
  
  // Handle process events
  child.on('close', (code, signal) => {
    if (code === 0) {
      console.log(`[CompareBranchScript:${script.name}] completed successfully`)
    } else {
      console.error(`[CompareBranchScript:${script.name}] exited with code ${code}${signal ? ` (signal: ${signal})` : ''}`)
    }
  })
  
  child.on('error', (error) => {
    console.error(`[CompareBranchScript:${script.name}] process error:`, error)
  })
  return child
}
