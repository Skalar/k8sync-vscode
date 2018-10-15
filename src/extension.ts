import {commands, ExtensionContext} from 'vscode'
import ExtensionController from './ExtensionController'

require('promise.prototype.finally').shim() // tslint:disable-line

let controller: ExtensionController

export async function activate(context: ExtensionContext) {
  controller = new ExtensionController(context)

  commands.executeCommand('setContext', 'k8syncEnabled', true)
  setupCommands(context)
}

export async function deactivate() {
  commands.executeCommand('setContext', 'k8syncEnabled', this.syncing)
  controller.stopSync()
}

function setupCommands(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand('k8sync.sync-toggle', () => {
      if (controller.syncing) {
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
