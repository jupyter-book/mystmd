---
kernelspec:
  name: python3
  display_name: Python 3
execute:
  cache: false
---

```{code-cell} python3
import time
import os

# Create marker for other process
with open("output-second.txt", "w") as f:
    f.write("Second completed!")
```
