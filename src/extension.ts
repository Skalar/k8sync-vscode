import {
  ExtensionContext,
  workspace,
  window,
  commands,
  StatusBarAlignment
} from "vscode";
import { Config } from "k8sync";
import K8SyncStatus from "./K8SyncStatus";
let k8sync: K8SyncStatus;

export async function activate(context: ExtensionContext) {
  console.log("K8sync file found!");
  console.log(context.workspaceState);
  // Assuming a file exists
  const files = await workspace.findFiles("k8sync.yaml");
  // window.showInformationMessage("Hello");

  if (files.length === 0) {
    console.error("No K8sync file found");
  }

  const config = await Config.load(files[0].path);

  if (!config) {
    console.error("Error with config");
    return;
  }

  const status = window.createStatusBarItem(StatusBarAlignment.Left, 100);
  status.command = "extension.k8sync-sync-toggle";
  k8sync = new K8SyncStatus(config, status);

  context.subscriptions.push(
    commands.registerCommand("extension.k8sync-sync-toggle", () => {
      k8sync.toggleSync();
    })
  );
  context.subscriptions.push(
    commands.registerCommand("extension.k8sync-sync-start", () => {
      k8sync.start();
    })
  );
  context.subscriptions.push(
    commands.registerCommand("extension.k8sync-sync-stop", () => {
      k8sync.stop();
    })
  );
}

export function deactivate() {
  k8sync.destroy();
}
