export type SyncerEvents =
  | 'starting'
  | 'syncStarted'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'error'
  | 'podAdded'
  | 'podDeleted'
  | 'syncCompleted'
  | 'syncError'

export enum ExtensionControllerState {
  Stopped,
  Starting,
  Running,
  Stopping,
}
