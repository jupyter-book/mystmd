---
kernelspec:
  name: python3
  display_name: Python 3
---

```{code-cell} python3
import time
import os

# Sleep to ensure that if the second notebook executes in parallel
# the file won't exist yet. This isn't foolproof -- it doesn't ensure
# that our process has fully ended before second.md starts, but that's OK.

sleep_duration_ms = int(os.environ['MYST_TEST_SLEEP_MS'])
time.sleep(sleep_duration_ms / 1e3)

with open("output-first.txt", "w") as f:
    f.write("First completed!")

```
