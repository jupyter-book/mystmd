# intersphinx

Read and write intersphinx `objects.inv` from node or the command line.

To use from the command line, use the `-g` to create a global install.

```
npm install -g intersphinx
```

## From the command line

Commands available:

`parse`: download or unpack a local file into a json or yaml file.

```bash
intersphinx parse https://docs.python.org/3.7 output.yml
```

`list`: list the contents of an objects.inv

```bash
intersphinx list https://docs.python.org/3.7 --summary
intersphinx list https://docs.python.org/3.7 --domain std
intersphinx list https://docs.python.org/3.7 --domain std:doc --includes abc
intersphinx list https://docs.python.org/3.7 --domain std:doc --includes abc --limit 5
```

## Reading an invintory in Node

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
