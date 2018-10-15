import * as elegantSpinner from 'elegant-spinner'
import {Config, Syncer} from 'k8sync'
import {
  commands,
  ExtensionContext,
  OutputChannel,
  ProgressLocation,
  StatusBarAlignment,
  StatusBarItem,
  window,
  workspace,
} from 'vscode'
import syncerEvents, {SyncerEvents} from './syncerEvents'
import TreeProvider from './TreeProvider'

const frame = elegantSpinner()

class ExtensionController {
  public syncer: Syncer
  public syncing: boolean = false
  public iconPrefix: string

  protected output: OutputChannel = window.createOutputChannel('k8sync')
  protected config: Config
  protected statusItem: StatusBarItem
  protected treeProvider: TreeProvider
  protected loadingInterval: NodeJS.Timer

  constructor(protected context: ExtensionContext) {
    this.iconPrefix = `${context.extensionPath}/resources`
    this.setup()
  }

  public async startSync(showInfo: boolean = true) {
    if (this.syncing) {
      return
    }
    this.log('Starting sync')
    this.syncing = true
    try {
      await this.syncer.start()
      commands.executeCommand('setContext', 'k8sync-syncing', true)
      if (showInfo) {
        this.log('K8: Started sync', 'info')
      }
    } catch (e) {
      this.log('Error in starting sync:')
      this.log(e)
      this.log(e, 'error')
      this.syncing = false
    }
    this.syncing = true
    commands.executeCommand('setContext', 'k8sync-syncing', true)
  }

  public async stopSync(showInfo: boolean = true) {
    if (!this.syncing) {
      return
    }
    this.log('Stopping sync')
    this.syncing = true
    try {
      await this.syncer.stop()
      commands.executeCommand('setContext', 'k8sync-syncing', true)
      if (showInfo) {
        this.log('K8: Stopped sync', 'info')
      }
    } catch (e) {
      this.log('Error in stopping sync:')
      this.log(e)
      this.log(e, 'error')
      this.syncing = true
    }
    this.syncing = false
    this.setStatus('dash')
    this.treeProvider.refresh()
    commands.executeCommand('setContext', 'k8sync-syncing', false)
  }

  public async restartTargets() {
    if (!this.syncing) {
      this.log('Sync needs to be active to restart targets', 'warning')
      return
    }

    this.log('Restarting targets')

    try {
      window.withProgress(
        {
          title: 'K8: Restarting targets',
          location: ProgressLocation.Notification,
          cancellable: false,
        },
        () => {
          return this.syncer.restartSyncTargets()
        }
      )

      this.log('K8: Restarting complete')
      this.log('K8: Restarting complete', 'info')
    } catch (e) {
      this.log(
        e && e.message
          ? `K8: ${e.message}`
          : 'K8: Something went wrong when restarting',
        'error'
      )
    }
  }

  public isPodFinishedSyncing(name) {
    let finished = true
    const pod = [...Object.values(this.syncer.targetPods)]
      .reduce((sum, next) => sum.concat(Array.from(next)), [])
      .find(p => p.podName === name)

    if (!pod.hasBeenSynced || pod.activeSync) {
      finished = false
    }
    return finished
  }

  public isTargetFinishedSyncing(name) {
    let finished = true

    for (const pod of this.syncer.targetPods[name]) {
      if (!pod.hasBeenSynced || pod.activeSync) {
        finished = false
        break
      }
    }

    return finished
  }

  protected async setup() {
    await this.setupConfig()
    await this.setupSyncer()
    await this.setupStatus()
    await this.setupProvider()

    const autoStart = workspace.getConfiguration('k8sync').get('autoStart')
    if (autoStart) {
      await this.startSync()
    }
  }

  protected log(message, notification?: 'warning' | 'error' | 'info') {
    switch (notification) {
      case 'error':
        window.showErrorMessage(message)
        break
      case 'warning':
        window.showWarningMessage(message)
        break
      case 'info':
        window.showInformationMessage(message)
        break
      default:
        this.output.appendLine(message)
        break
    }
  }

  protected setupProvider() {
    this.treeProvider = new TreeProvider(this.syncer, this)
  }

  protected setupStatus() {
    this.statusItem = window.createStatusBarItem(StatusBarAlignment.Left, 100)
    this.statusItem.command = 'k8sync.sync-toggle'
    this.statusItem.text = '$(dash)'
    this.statusItem.show()
  }

  protected async setupSyncer() {
    if (!this.config) {
      return
    }
    this.syncer = new Syncer(this.config)

    syncerEvents.forEach(event =>
      this.syncer.on(event, data => this.syncerEvent(event, data))
    )
  }

  protected syncerEvent(event: SyncerEvents, eventData) {
    switch (event) {
      case 'starting':
      case 'podAdded':
      case 'syncStarted':
      case 'stopping':
        this.loadingState()
        this.treeProvider.refresh()
        break
      case 'error':
        this.syncerError(eventData)
        break
      case 'running':
        this.targetPodCount()
        break
      case 'syncCompleted':
        this.podSyncCompleted()
        this.treeProvider.refresh()
        break
      case 'syncError':
        //
        this.treeProvider.refresh()
        break
    }
  }

  protected podSyncCompleted() {
    const finished = !Object.keys(this.syncer.syncSpecs).find(
      specName => !this.isTargetFinishedSyncing(specName)
    )

    if (finished) {
      this.finishLoading()
    }
  }

  protected targetPodCount() {
    const hasSize = Object.values(this.syncer.targetPods).find(
      set => set.size > 0
    )

    this.setStatus(hasSize ? 'thumbsup' : 'dash')
  }

  protected finishLoading() {
    this.clearLoadingInterval()
    this.setStatus('thumbsup')
  }

  protected clearLoadingInterval() {
    if (this.loadingInterval) {
      clearInterval(this.loadingInterval)
      this.loadingInterval = null
    }
  }

  protected loadingState() {
    this.clearLoadingInterval()
    this.setStatus(frame(), {icon: false})
    this.loadingInterval = setInterval(() => {
      this.setStatus(frame(), {icon: false})
    }, 100)
  }

  protected syncerError(error: Error) {
    this.log(error.message)
    this.log(error.message, 'error')
    this.syncing = false
    this.setStatus('flame', {color: 'red'})
    setTimeout(() => this.setStatus('primitive-square'), 1000)
  }

  protected setStatus(
    text: string,
    {icon, color}: {icon?: boolean; color?: string} = {
      icon: true,
      color: 'white',
    }
  ) {
    this.statusItem.text = icon ? `$(${text})` : text
    this.statusItem.color = color
  }

  protected async setupConfig() {
    const [{path}] = await workspace.findFiles('k8sync.yaml')
    const overrides = workspace.getConfiguration('k8sync').get('configValues')
    const configValues = Object.assign({}, overrides, process.env)
    this.log('Configuration overrides:')
    this.log(JSON.stringify(overrides, undefined, 4))

    const config = await Config.load(path, configValues)
    if (!config) {
      this.log('Something wrong with config', 'error')
      return
    }

    this.log('Config loaded and initiated!')
    this.log('------------CONF------------')
    this.log(JSON.stringify(config, undefined, 4))
    this.log('----------------------------')

    this.config = config
  }
}

export default ExtensionController
