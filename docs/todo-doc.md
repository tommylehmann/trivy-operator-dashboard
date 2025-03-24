# TO DO

## Frontend

MainAppInitService
- extract dark/light mode (maybe during primeng 18 upgrade)
- polly retry in initializeApp()
- remove Severities from here (hardcode it)

Trivy Table
- refactor expand rows

Generic
- replace all functions/methods from htmls with pipes
- chase all styles and replace with classes

Upgrades (in this order):
- Upgrade Primeng to 18
- Upgrade Angular to 19
- Upgrade Primeng to 19
- Upgrade PrimeFlex to 4

After upgrades, make primeng used font 12px (more data to fill in)

## Backend

Refactor Watcher - events part (maybe with a queue and a processor on the other side that will feed it to iservice[])

Rename Kubernetes to K8s all classes

Proper 200, 404 etc codes in controllers

## Both
Unify same images in SBOM. Maybe an extra-field - hasVulnerabilities

Export to CycloneDX - server side, zip file, async (signalr?)

## Not clear where and how

Advertise latest version
https://api.github.com/repos/raoulx24/trivy-operator-dashboard/releases/latest