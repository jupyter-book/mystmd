---
kernelspec:
  name: python3
  display_name: Python 3
---

```{code-cell} python3
import time
import os

# Ensure that new files are not created by a sibling process during execution

this_name = "output-first.txt"
other_file_name = "output-second.txt"
sleep_duration_ms = int(os.environ['MYST_TEST_SLEEP_MS'])

# Assuming we're the second process, ensure that files are not created during execution
# Race conditions from interleaving should fail this test.
exists_before = os.path.exists(other_file_name)
if not exists_before:
    time.sleep(sleep_duration_ms / 1e3)
    exists_after = os.path.exists(other_file_name)
    assert exists_before == exists_after

with open(this_name, "w") as f:
    f.write("Done")
```
