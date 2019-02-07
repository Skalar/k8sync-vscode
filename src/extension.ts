import {commands, ExtensionContext} from 'vscode'
import ExtensionController from './ExtensionController'
import {ExtensionControllerState} from './types'

let controller: ExtensionController

export async function activate(context: ExtensionContext) {
  controller = new ExtensionController(context)

  commands.executeCommand('setContext', 'k8syncEnabled', true)
  setupCommands(context)
}

export async function deactivate() {
  commands.executeCommand('setContext', 'k8syncEnabled', false)
  controller.stopSync()
}

function setupCommands(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand('k8sync.sync-toggle', () => {
      if (controller.state === ExtensionControllerState.Running) {
        controller.stopSync()
      } else {
        controller.startSync()
      }
    })
  )
  context.subscriptions.push(
    commands.registerCommand('k8sync.sync-start', async () => {
      controller.startSync()
    })
  )
  context.subscriptions.push(
    commands.registerCommand('k8sync.sync-stop', async () => {
      controller.stopSync()
    })
  )

  context.subscriptions.push(
    commands.registerCommand('k8sync.restart-targets', () => {
      controller.restartTargets()
    })
  )
}
