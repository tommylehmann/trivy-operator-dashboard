Example package.json:

```json
"scripts": {
  "postinstall": "node ./scripts/fix-tailwindcss-primeui.js"
}
```

2.	Add a file named fix-tailwindcss-primeui.js 
```js
const fs = require('fs');
const path = require('path');

const packageJsonPath = path.resolve(
  __dirname,
  '../node_modules/tailwindcss-primeui/package.json'
);

try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.type = 'module';
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('Added "type": "module" to tailwindcss-primeui/package.json');
} catch (error) {
  console.error('Failed to update tailwindcss-primeui/package.json:', error);
}
```

```ts
export interface NarrowedResourceNameInfo {
  label: string;
  buttonLink: string;
}

export class ReportHelper {
  static getNarrowedResourceNames<T extends TrivyReportImageResourceDto>(
    dto: TrivyReportImageDto<T>
  ): NarrowedResourceNameInfo {
    const resourceNames: string[] =
      dto.resources?.map((x) => x.name ?? 'unknown') ?? [];

    const label = resourceNames.slice(0, 2).join(', ');
    const buttonLink =
      resourceNames.length > 2 ? ` [+${resourceNames.length - 2}]` : '[...]';

    return {
      label,
      buttonLink,
    };
  }
}

const result = ReportHelper.getNarrowedResourceNames(
  vulnerabilityReportImageDto as TrivyReportImageDto<VulnerabilityReportImageResourceDto>
);
```