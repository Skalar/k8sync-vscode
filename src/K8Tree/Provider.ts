import * as vscode from "vscode";
import { Syncer } from "k8sync";
import events from "../syncerEvents";
import { circleCross, circleDotted, play, tick } from "figures";
import { TargetPod } from "k8sync/lib/types";

export default class Provider
  implements vscode.TreeDataProvider<ServiceItem | PodItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    ServiceItem | undefined
  > = new vscode.EventEmitter<ServiceItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<ServiceItem | undefined> = this
    ._onDidChangeTreeData.event;
  private services: ServiceItem[] = [];

  constructor(public syncer: Syncer) {
    for (const [specName] of Object.entries(this.syncer.syncSpecs)) {
      this.services.push(new ServiceItem(specName, circleCross, 0));
    }

    for (const event of events) {
      this.syncer.on(event, () => this.updateItemLabels());
    }

    vscode.window.registerTreeDataProvider(
      "k8sync-code-service-explorer",
      this
    );
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  updateItemLabels(stopped?: boolean) {
    const syncer = this.syncer;

    if (!stopped) {
      for (const [specName] of Object.entries(syncer.syncSpecs)) {
        const service = this.services.find(
          service => service.name === specName
        );
        const pods = this.syncer.targetPods[specName];
        const podNames = Array.from(pods).map(pod => pod.name);

        service.pods = podNames.map(name => new PodItem(name));

        if (pods.size === 0) {
          service.collapsibleState = vscode.TreeItemCollapsibleState.None;
          service.status = circleDotted;
        } else {
          service.collapsibleState =
            service.collapsibleState === vscode.TreeItemCollapsibleState.None
              ? vscode.TreeItemCollapsibleState.Collapsed
              : service.collapsibleState;
          if (
            podNames.find(
              podName =>
                typeof syncer.syncLocks[podName] !== "undefined" ||
                typeof syncer.syncQueue[podName] !== "undefined"
            )
          ) {
            service.status = play;
          } else {
            service.status = tick;
          }
        }
      }
    } else {
      this.services.forEach(service => {
        service.status = circleCross;
        service.pods = [];
        service.collapsibleState = vscode.TreeItemCollapsibleState.None;
      });
    }
    this.refresh();
  }

  getTreeItem(element: ServiceItem | PodItem) {
    return element;
  }

  getChildren(
    element?: ServiceItem | PodItem
  ): Thenable<ServiceItem[] | PodItem[]> {
    if (element instanceof ServiceItem) {
      return Promise.resolve(element.pods);
    } else {
      return Promise.resolve(this.services);
    }
  }
}

export class ServiceItem extends vscode.TreeItem {
  public pods: PodItem[] = [];

  constructor(
    public name: string,
    public status: string,
    public collapsibleState: vscode.TreeItemCollapsibleState,
    public command?: vscode.Command
  ) {
    super(`${status} ${name}`, collapsibleState);
  }

  get label() {
    return `${this.status} ${this.name}`;
  }

  set label(label) {
    const [name, status] = label.split(" ");
    this.name = name;
    this.status = status;
  }
}

class PodItem extends vscode.TreeItem {
  constructor(public label: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
  }
}
