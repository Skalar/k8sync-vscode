import { circle, circleCross, tick } from 'figures'
import { Syncer } from 'k8sync'
import { StatusBarItem } from 'vscode'
import events from './syncerEvents'

class K8SyncStatus {
  private syncing: boolean

  constructor(private syncer: Syncer, private status: StatusBarItem) {
    this.syncing = false

    this.renderStatus()
  }

  public async start() {
    if (this.syncing) {
      return
    }
    this.syncing = true
    this.status.text = 'K8: ...'
    this.status.show()

    for (const event of events) {
      this.syncer.on(event, () => this.renderStatus(event))
      this.syncer.on('stopped', () => this.stop())
    }
  }

  public async stop() {
    this.syncing = false
    this.renderStatus()
  }

  public renderStatus(event?: string) {
    let text = 'K8: '
    let serviceCount = 0
    let completedCount = 0
    if (this.syncing) {
      const syncer = this.syncer
      for (const targetName of Object.keys(syncer.syncSpecs)) {
        serviceCount++
        const pods = this.syncer.targetPods[targetName]

        for (const pod of pods) {
          if (pod.previousSync) {
            if (!pod.previousSync.error) {
              completedCount++
            }
          }
        }
      }
    }

    if (serviceCount === 0) {
      text += circle
    } else if (completedCount !== 0) {
      text += `${completedCount}/${serviceCount} ${tick}`
    } else {
      text += circleCross
    }

    this.status.text = text
    this.status.show()
  }

  public destroy() {
    this.syncer.stop()
  }
}

export default K8SyncStatus
