import {TreeItem, TreeItemCollapsibleState} from 'vscode'
import ExtensionController from './ExtensionController'

class CustomTreeItem extends TreeItem {
  constructor(
    public label: string,
    public collapsibleState: TreeItemCollapsibleState,
    private controller: ExtensionController,
    private isPod: boolean = false
  ) {
    super(label, collapsibleState)
  }

  get id() {
    return this.label
  }

  get iconPath() {
    if (!this.controller.syncing) {
      return {
        dark: `${this.controller.iconPrefix}/dark/stop.svg`,
        light: `${this.controller.iconPrefix}/light/stop.svg`,
      }
    }
    const isFinished = this.isPod
      ? this.controller.isPodFinishedSyncing(this.label)
      : this.controller.isTargetFinishedSyncing(this.label)

    if (isFinished) {
      return {
        dark: `${this.controller.iconPrefix}/dark/done.svg`,
        light: `${this.controller.iconPrefix}/light/done.svg`,
      }
    } else {
      return {
        dark: `${this.controller.iconPrefix}/dark/loop.svg`,
        light: `${this.controller.iconPrefix}/light/loop.svg`,
      }
    }
  }
}

export default CustomTreeItem
