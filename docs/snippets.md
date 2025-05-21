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

```c#
public interface IInterface1 { }
public interface IInterface2 { }

public class MyClass : IInterface1, IInterface2 { }

public void ConfigureServices(IServiceCollection services)
{
    services.AddSingleton<MyClass>(); // Register the class itself
    services.AddSingleton<IInterface1>(sp => sp.GetRequiredService<MyClass>());
    services.AddSingleton<IInterface2>(sp => sp.GetRequiredService<MyClass>());
}
```