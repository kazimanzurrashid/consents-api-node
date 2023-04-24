# In order to run

[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/kazimanzurrashid/consents-api-node/ci.yml)](https://github.com/kazimanzurrashid/consents-api-node/actions)
[![CodeFactor](https://www.codefactor.io/repository/github/kazimanzurrashid/consents-api-node/badge)](https://www.codefactor.io/repository/github/kazimanzurrashid/consents-api-node)
[![codecov](https://codecov.io/gh/kazimanzurrashid/consents-api-node/branch/main/graph/badge.svg)](https://codecov.io/gh/kazimanzurrashid/consents-api-node)

## Docker Compose

1. Open terminal and run `docker compose up`
2. Import `./postman.json` in Postman.
3. Run the collection runner.

## Minikube

1. Open terminal and run `helm dependencies build ./helm`
2. Once build then run `helm install <your release name> ./helm`
3. Once the pods are ready then run `minikube service <your release name> --url` to get the url
4. Import `./postman.json` in Postman.
5. Update the `ENDPOINT` variable from the collection variable section.
6. Run the collection runner
