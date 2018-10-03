import { circleCross, circleDotted, play, tick, warning } from 'figures'
import { Syncer } from 'k8sync'
import {
  Event,
  EventEmitter,
  TreeDataProvider,
  TreeItemCollapsibleState,
  window
} from 'vscode'
import events from '../syncerEvents'
import SyncTarget from './SyncTarget'

export default class Provider implements TreeDataProvider<SyncTarget> {
  /* tslint:disable */
  _onDidChangeTreeData: EventEmitter<SyncTarget | undefined> = new EventEmitter<
    SyncTarget | undefined
  >();

  public readonly onDidChangeTreeData: Event<SyncTarget | undefined> = this
    ._onDidChangeTreeData.event;

  /* tslint:enable */

  private syncTargets: SyncTarget[] = []

  constructor(public syncer: Syncer) {
    for (const targetName of Object.keys(this.syncer.syncSpecs)) {
      this.syncTargets.push(
        new SyncTarget(targetName, circleCross, TreeItemCollapsibleState.None)
      )
    }

    for (const event of events) {
      this.syncer.on(event, () => this.updateItemLabels())
    }

    this.syncer.on('stopped', () => this.syncStopped())

    window.registerTreeDataProvider('k8sync-code-service-explorer', this)
    this.refresh()
  }

  public refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  public syncStopped() {
    this.syncTargets.forEach(service => {
      service.stopped = true
      service.children = []
    })
    this.refresh()
  }

  public getTreeItem(element: SyncTarget) {
    return element
  }

  public getChildren(element?: SyncTarget): Thenable<SyncTarget[]> {
    if (element instanceof SyncTarget) {
      return Promise.resolve(element.children)
    } else {
      return Promise.resolve(this.syncTargets)
    }
  }

  private updateItemLabels() {
    const syncer = this.syncer

    for (const targetName of Object.keys(syncer.syncSpecs)) {
      const pods = Array.from(this.syncer.targetPods[targetName])
      const syncTarget = this.syncTargets.find(
        target => target.name === targetName
      )

      syncTarget.children = []
      syncTarget.stopped = false

      for (const pod of pods) {
        const podItem = new SyncTarget(
          pod.podName,
          play,
          TreeItemCollapsibleState.None
        )
        if (pod.activeSync || pod.pendingSync) {
          podItem.status = play
        } else if (pod.previousSync) {
          if (pod.previousSync.error) {
            podItem.status = warning
            podItem.error = pod.previousSync.error.message
          } else {
            podItem.status = tick
          }
        } else {
          podItem.status = circleDotted
        }

        syncTarget.children.push(podItem)
      }

      if (syncTarget.children.length > 0 && syncTarget.collapsibleState === 0) {
        syncTarget.collapsibleState = 1
      }
    }

    this.refresh()
  }
}
