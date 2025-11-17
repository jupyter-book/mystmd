---
kernelspec:
  name: python3
  display_name: Python 3
---

```{code-cell} python3
import time
import os
import os.path

assert os.path.exists("output-first.txt")

with open("output-second.txt", "w") as f:
    f.write("Second completed!")

```
