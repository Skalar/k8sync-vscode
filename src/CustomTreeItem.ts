import {TreeItem, TreeItemCollapsibleState} from 'vscode'
import ExtensionController from './ExtensionController'
import {ExtensionControllerState} from './types'

class CustomTreeItem extends TreeItem {
  constructor(
    public id: string,
    public podLabel: string,
    public collapsibleState: TreeItemCollapsibleState,
    private controller: ExtensionController,
    private isPod: boolean = false
  ) {
    super(podLabel, collapsibleState)
  }

  get iconPath() {
    if (this.controller.state === ExtensionControllerState.Stopped) {
      return {
        dark: `${this.controller.iconPrefix}/dark/stop.svg`,
        light: `${this.controller.iconPrefix}/light/stop.svg`,
      }
    }
    const isFinished = this.isPod
      ? this.controller.isPodFinishedSyncing(this.id)
      : this.controller.isTargetFinishedSyncing(this.id)

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
