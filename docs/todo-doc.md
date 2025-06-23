# TO DO

## Frontend

MainAppInitService
- polly retry in initializeApp()
- remove Severities from here (hardcode it)

Generic
- replace all functions/methods from htmls with pipes
- chase all styles and replace with classes
- change TrivyTableColumn[] to const in trivy-table-definitions
- change where aplicable to lazy loading of components in pages (ie vr compare in vr, home pages). maybe deferred load?
- change material-symbols font to svgs

Extend Settings Service (maybe cross tab communication?)

## Backend

Rearrange BuilderServicesExtensions.cs

Proper 200, 404 etc codes in controllers and proper error controll

Add CreationDate in all CRs and dtos

Github versions - Timed Hosted Service - alert if error

## Both

Export to CycloneDX - server side, zip file, async (signalr?)

## Not clear where and how

Advertise latest version
https://api.github.com/repos/raoulx24/trivy-operator-dashboard/releases/latest