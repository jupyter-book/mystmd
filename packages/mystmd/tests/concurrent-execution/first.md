---
kernelspec:
  name: python3
  display_name: Python 3
---

```{code-cell} python3
import time
import os
import os.path

# 1. Hang until the file is created
while True:
    if os.path.exists("output-second.txt"):
        break
    time.sleep(10e-3)

# 2. Write our own marker file
with open("output-first.txt", "w") as f:
    f.write("First completed!")
```
