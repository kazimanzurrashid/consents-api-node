# In order to run

[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/kazimanzurrashid/consents-api-node/CI)](https://github.com/kazimanzurrashid/consents-api-node/actions)
[![CodeFactor](https://www.codefactor.io/repository/github/kazimanzurrashid/consents-api-node/badge)](https://www.codefactor.io/repository/github/kazimanzurrashid/consents-api-node)
[![codecov](https://codecov.io/gh/kazimanzurrashid/consents-api-node/branch/main/graph/badge.svg)](https://codecov.io/gh/kazimanzurrashid/consents-api-node)

## Docker Compose

1. Open terminal and run `docker compose up`
2. Import `./postman.json` in Postman.
3. Run the collection runner.

## Minikube

1. Open terminal and run `kubectl apply -k k8s/overlays/development -l app=postgres`
2. Once the `postgres-0` becomes ready then run `kubectl apply -k k8s/overlays/development -l app=api`
3. Once api pod is ready then run `minikube service api --url` to get the url
4. Import `./postman.json` in Postman.
5. Update the `Endpoint` variable from the collection variable section.
6. Run the collection runner
