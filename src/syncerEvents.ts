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

export default [
  'running',
  'syncStarted',
  'syncCompleted',
  'syncError',
  'podAdded',
  'podDeleted',
] as Array<
  | 'running'
  | 'syncStarted'
  | 'syncCompleted'
  | 'syncError'
  | 'podAdded'
  | 'podDeleted'
>
