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
import { BehaviorSubject, filter, map, timeout } from 'rxjs';

class ReactiveMap<K, V> {
  // Creates a BehaviorSubject to hold the map state and allow reactive updates.
  private subject = new BehaviorSubject<Map<K, V>>(new Map());

  // Sets a key-value pair in the map and triggers an update in the BehaviorSubject.
  set(key: K, value: V): void {
    const updatedMap = new Map(this.subject.value); // Clone the existing map to maintain immutability.
    updatedMap.set(key, value); // Add or update the key-value pair.
    this.subject.next(updatedMap); // Emit the new state to subscribers.
  }

  // Retrieves a key asynchronously, waiting until it exists, and returns only the value.
  getAsync(key: K): Observable<V> {
    return this.subject.pipe(
      filter(map => map.has(key)), // Filters only when the key exists in the map.
      map(map => map.get(key)!), // Extracts only the value associated with the key.
      timeout(5000) // If the key is not found within 5 seconds, it throws an error.
    );
  }
}
```