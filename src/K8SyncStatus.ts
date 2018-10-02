import { Syncer } from "k8sync";
import { StatusBarItem } from "vscode";
import { circle, tick, circleCross } from "figures";
import events from "./syncerEvents";

class K8SyncStatus {
  private syncing: boolean;

  constructor(private syncer: Syncer, private status: StatusBarItem) {
    this.syncing = false;

    this.renderStatus();
  }

  async start() {
    if (this.syncing) {
      return;
    }
    this.syncing = true;
    this.status.text = "K8: ...";
    this.status.show();

    for (const event of events) {
      this.syncer.on(event, () => this.renderStatus(event));
      this.syncer.on("disconnect", () => this.stop());
    }
  }

  async stop() {
    this.syncing = false;
    this.renderStatus();
  }

  renderStatus(event?: string) {
    console.log(`${event} triggered render`);
    let text = "K8: ";
    let serviceCount = 0;
    let completedCount = 0;
    if (this.syncing) {
      const syncer = this.syncer;
      for (const [specName] of Object.entries(syncer.syncSpecs)) {
        serviceCount++;
        const pods = this.syncer.targetPods[specName];
        const podNames = Array.from(pods).map(pod => pod.name);

        if (pods.size === 0) {
          // text += ` ${specName}: ${circleDotted}`;
        } else {
          if (
            podNames.find(
              podName =>
                typeof syncer.syncLocks[podName] !== "undefined" ||
                typeof syncer.syncQueue[podName] !== "undefined"
            )
          ) {
            // nothing now
          } else {
            completedCount++;
          }
        }
      }
    }

    if (serviceCount === 0) {
      text += circle;
    } else if (completedCount !== 0) {
      text += `${completedCount}/${serviceCount} ${tick}`;
    } else {
      text += circleCross;
    }

    this.status.text = text;
    this.status.show();
  }

  public destroy() {
    this.syncer.stop();
  }
}

export default K8SyncStatus;
