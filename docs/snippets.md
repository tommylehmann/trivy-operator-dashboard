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
  
6fb7024cc937ecce77685eb8f43ef100fcf9dcd1
vrd simple

ed581100dcc3002ac0bf6bb36079e3a450a4bdc6
vrd more ok

8d0ea5d64c8f60f59d28efeeb2fbc4b212295720
ag grid - vr, vrd working; piecharts; dark/light (?)

1bc82b185bb94bf56935edf0b634a1f99fcf2ed4
8/28/2024
(primeng vr, vrd), about (?)

09b1859064679f5ea99722a74f5c87fd899af421
9/11/2024 
new home (and vacation)

e6d62a402b90ab3eb7fee90d5e5561c5b40eaf85
10/5/2024 
expand rows, watcher page

c12384303d37846a65914254b77d5c5d93bf6b42
10/9/2024 
settings

10/19 - car
10/20 - crar
10/20 - esr