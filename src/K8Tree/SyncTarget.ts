import { circleCross, circleDotted, tick, warning } from 'figures'
import { TreeItem, TreeItemCollapsibleState } from 'vscode'

class SyncTarget extends TreeItem {
  public children: SyncTarget[] = []
  public error: string = null
  public stopped: boolean = false

  constructor(
    public name: string,
    public status: string,
    public collapsableState: TreeItemCollapsibleState
  ) {
    super(`${status} ${name}`, collapsableState)
  }

  get label() {
    if (this.children.length > 0) {
      return `${this.statusByChildren()} ${this.name}`
    }
    return this.status ? `${this.status} ${this.name}` : this.name
  }

  set label(label) {
    this.name = label
  }

  private statusByChildren() {
    let status = circleDotted
    if (this.children.length > 0) {
      let error = false
      for (const child of this.children) {
        if (child.error) {
          error = true
        }
      }

      status = error ? warning : tick
    }

    if (this.stopped) {
      status = circleCross
    }

    return status
  }

  get tooltip() {
    return `${this.statusByChildren()} ${this.name}`
  }
}

export default SyncTarget
