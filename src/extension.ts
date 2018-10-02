import {
  ExtensionContext,
  workspace,
  window,
  commands,
  StatusBarAlignment
} from "vscode";
import { Config, Syncer } from "k8sync";
import K8SyncStatus from "./K8SyncStatus";
import { Provider } from "./K8Tree";

let k8sync: K8SyncStatus;
let provider: Provider;
let syncing: boolean = false;
let syncer: Syncer;

export async function activate(context: ExtensionContext) {
  console.log("K8sync file found!");

  // Assuming a file exists
  const files = await workspace.findFiles("k8sync.yaml");

  if (files.length === 0) {
    console.error("No K8sync file found");
    return;
  }

  const status = window.createStatusBarItem(StatusBarAlignment.Left, 100);

  syncer = await createSyncer(files[0].path);
  provider = new Provider(syncer);
  status.command = "extension.k8sync-sync-toggle";
  setupCommands(context);

  k8sync = new K8SyncStatus(syncer, status);
  commands.executeCommand("setContext", "k8syncEnabled", true);
}

export function deactivate() {
  k8sync.destroy();
  commands.executeCommand("setContext", "k8syncEnabled", this.syncing);
}

function setupCommands(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand("extension.k8sync-sync-toggle", () => {
      if (syncing) {
        stopSyncing();
      } else {
        startSyncing();
      }
    })
  );
  context.subscriptions.push(
    commands.registerCommand("extension.k8sync-sync-start", () => {
      startSyncing();
    })
  );
  context.subscriptions.push(
    commands.registerCommand("extension.k8sync-sync-stop", () => {
      stopSyncing();
    })
  );
}

async function startSyncing() {
  await syncer.start();
  syncing = true;
  k8sync.start();
}

async function stopSyncing() {
  await syncer.stop();
  syncing = false;
  k8sync.stop();
  provider.updateItemLabels(true);
}

async function createSyncer(configFile: string): Promise<Syncer> {
  const config = await Config.load(configFile);
  if (!config) {
    console.error("Error with config");
    return;
  }

  Object.keys(config).forEach(key => {
    console.log(`${key}:`);
    console.log(config[key]);
  });

  return new Syncer(config);
}
