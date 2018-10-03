import { Config, Syncer } from 'k8sync'
import {
  commands,
  ExtensionContext,
  OutputChannel,
  StatusBarAlignment,
  window,
  workspace
} from 'vscode'
import K8SyncStatus from './K8SyncStatus'
import { Provider } from './K8Tree'

require("promise.prototype.finally").shim(); // tslint:disable-line

let k8sync: K8SyncStatus
let syncing: boolean = false
let syncer: Syncer
let output: OutputChannel

export async function activate(context: ExtensionContext) {
  output = window.createOutputChannel('k8sync')

  // Assuming a file exists
  const files = await workspace.findFiles('k8sync.yaml')

  if (files.length === 0) {
    output.appendLine('No K8sync file found')
    return
  }

  output.appendLine('K8sync file found!')

  const status = window.createStatusBarItem(StatusBarAlignment.Left, 100)

  syncer = await createSyncer(files[0].path)
  const provider = new Provider(syncer)
  status.command = 'k8sync.sync-toggle'
  setupCommands(context)

  k8sync = new K8SyncStatus(syncer, status)
  commands.executeCommand('setContext', 'k8syncEnabled', true)

  syncer.on('syncError', (error, sync) => {
    output.appendLine(sync.targetPod.podName)
    if (error.stack) {
      output.appendLine(error.stack)
    }
  })
  syncer.on('error', error => {
    if (error.stack) {
      output.appendLine(error.stack)
    }
  })
}

export function deactivate() {
  k8sync.destroy()
  commands.executeCommand('setContext', 'k8syncEnabled', this.syncing)
}

function setupCommands(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand('k8sync.sync-toggle', () => {
      if (syncing) {
        stopSyncing()
      } else {
        startSyncing()
      }
    })
  )
  context.subscriptions.push(
    commands.registerCommand('k8sync.sync-start', () => {
      startSyncing()
    })
  )
  context.subscriptions.push(
    commands.registerCommand('k8sync.sync-stop', () => {
      stopSyncing()
    })
  )
}

async function startSyncing() {
  try {
    await syncer.start()
    syncing = true
    k8sync.start()
    commands.executeCommand('setContext', 'k8sync-syncing', true)
  } catch (e) {
    console.error(e)
  }
}

async function stopSyncing() {
  try {
    await syncer.stop()
  } catch (e) {
    console.error(e)
  }
  syncing = false
  commands.executeCommand('setContext', 'k8sync-syncing', false)
}

async function createSyncer(configFile: string): Promise<Syncer> {
  const config = await Config.load(configFile)
  if (!config) {
    output.appendLine('Something wrong with config')
    return
  }

  output.appendLine('Config loaded and initiated!')
  output.appendLine('------------CONF------------')
  output.appendLine(JSON.stringify(config, undefined, 4))
  output.appendLine('----------------------------')

  return new Syncer(config)
}
