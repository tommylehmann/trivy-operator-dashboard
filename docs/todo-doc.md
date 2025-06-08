# TO DO

## Frontend

MainAppInitService
- polly retry in initializeApp()
- remove Severities from here (hardcode it)

Trivy Table
- refactor expand rows

Generic
- replace all functions/methods from htmls with pipes
- chase all styles and replace with classes
- change TrivyTableColumn[] to const in trivy-table-definitions
- change where aplicable to lazy loading of components in pages (ie vr compare in vr, home pages). maybe deferred load?

Extend Settings Service (maybe cross tab communication?)

## Backend

Rearrange BuilderServicesExtensions.cs

Dedicated routes for liveness and readyness

Proper 200, 404 etc codes in controllers and proper error controll

Add CreationDate in all CRs and dtos

Github versions - Timed Hosted Service - alert if error

Repair package.lock.json on build

## Both

Export to CycloneDX - server side, zip file, async (signalr?)

## Not clear where and how

Advertise latest version
https://api.github.com/repos/raoulx24/trivy-operator-dashboard/releases/latest