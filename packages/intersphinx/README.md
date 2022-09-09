# intersphinx

Read and write intersphinx `objects.inv` from node.

## Reading an invintory

```typescript
import { Inventory } from 'intersphinx';

const inv = new Inventory({ id: 'python', path: 'https://docs.python.org/3.7' });
await inv.load();

const entry = inv.getEntry({ name: 'zipapp-specifying-the-interpreter' });
// {
//   location: https://docs.python.org/3.7/library/zipapp.html#specifying-the-interpreter,
//   display: 'Specifying the Interpreter'
// }
```

## Write an invintory

```typescript
const inv = new Inventory({ project: 'Python', version: '3.7' });
inv.setEntry({
  type: 'std:label',
  name: 'zipapp-specifying-the-interpreter',
  location: 'library/zipapp.html#specifying-the-interpreter',
  display: 'Specifying the Interpreter',
});

inv.write('objects.inv');
```
