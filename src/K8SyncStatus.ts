import { Syncer, Config } from "k8sync";
import { StatusBarItem } from "vscode";
import { circle, tick, circleCross } from "figures";

const events = [
  "started",
  "podSyncStart",
  "podSyncComplete",
  "podAdded",
  "podDeleted"
];

class K8SyncStatus {
  private syncing: boolean;
  private syncer: Syncer;
  private status: StatusBarItem;
  private config: Config;

  constructor(config: Config, status: StatusBarItem) {
    this.config = config;
    this.status = status;
    this.syncing = false;
    this.renderStatus();
    this.syncer = new Syncer(this.config);
    Object.keys(this.config).forEach(key => {
      console.log(`${key}: ${this.config[key]}`);
    });
  }

  public toggleSync() {
    if (this.syncing) {
      this.stop();
    } else {
      this.start();
    }
  }

  async start() {
    if (this.syncing) {
      return;
    }
    this.syncing = true;
    this.status.text = "K8: ...";
    this.status.show();
    try {
      await this.syncer.start();
      for (const event of events) {
        this.syncer.on(event, () => this.renderStatus(event));
        this.syncer.on("disconnect", () => this.stop());
      }
    } catch (e) {
      console.log(e);
    }
  }

  async stop() {
    this.syncing = false;
    await this.syncer.stop();
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
        console.log(specName);
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
    console.log(serviceCount);
    console.log(completedCount);
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
