# K8Sync for VS Code

## Features

Used to easily keep track of sync status for [k8sync](https://www.npmjs.com/package/@trym-testing/k8sync)

<img src="https://github.com/Skalar/k8sync-vscode/raw/master/sync.gif" alt="Screenshot of the tool" width="100%">

## Requirements

- Configure your project as described: [k8sync](https://github.com/Skalar/k8sync#configure-k8sync-for-project)
- If `k8sync.yaml` uses environment variables, make sure VS Code is started from a terminal with those env vars loaded or set them in your settings.json file, e.g:

```JSON
{
    "k8sync.configValues": {
        "KUBE_CONTEXT": "mycontext",
        "KUBE_NAMESPACE": "mynamespace",
        "RELEASE": "myrelease"
    }
}
```

```Yaml
kubeContext: ${KUBE_CONTEXT}
namespace: ${NAMESPACE}
daemonSetNamespace: kube-system

sync:
  api:
    localPath: api
    containerPath: /src
    podSelector:
      labelSelector: 'app=${RELEASE}-api'
    excludeDirs:
      - node_modules

  webapp-poller:
    localPath: webapp
    containerPath: /src
    podSelector:
      labelSelector: 'app=${RELEASE}-webapp'
    excludeDirs:
      - node_modules
```
