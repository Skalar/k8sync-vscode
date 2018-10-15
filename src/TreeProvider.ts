import {Syncer} from 'k8sync'
import {
  Event,
  EventEmitter,
  TreeDataProvider,
  TreeItemCollapsibleState,
  window,
} from 'vscode'
import CustomTreeItem from './CustomTreeItem'
import ExtensionController from './ExtensionController'

export default class Provider implements TreeDataProvider<CustomTreeItem> {
  /* tslint:disable */
  _onDidChangeTreeData: EventEmitter<
    CustomTreeItem | undefined
  > = new EventEmitter<CustomTreeItem | undefined>()

  public readonly onDidChangeTreeData: Event<CustomTreeItem | undefined> = this
    ._onDidChangeTreeData.event

  /* tslint:enable */

  constructor(
    protected syncer: Syncer,
    protected controller: ExtensionController
  ) {
    window.registerTreeDataProvider('k8sync-code-service-explorer', this)
    this.refresh()
  }

  public refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  public getTreeItem(element: CustomTreeItem) {
    return element
  }

  public getChildren(element?: CustomTreeItem): Thenable<CustomTreeItem[]> {
    const children = []
    if (element) {
      const pods = this.syncer.targetPods[element.id]
      for (const pod of pods) {
        const treeItem = new CustomTreeItem(
          pod.podName,
          TreeItemCollapsibleState.None,
          this.controller,
          true
        )
        children.push(treeItem)
      }
    } else {
      for (const specName of Object.keys(this.syncer.syncSpecs)) {
        const treeItem = new CustomTreeItem(
          specName,
          this.syncer.targetPods[specName] &&
          this.syncer.targetPods[specName].size > 0
            ? TreeItemCollapsibleState.Collapsed
            : TreeItemCollapsibleState.None,
          this.controller
        )
        children.push(treeItem)
      }
    }
    return Promise.resolve(children)
  }
}
