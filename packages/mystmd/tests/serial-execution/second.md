---
kernelspec:
  name: python3
  display_name: Python 3
---

```{code-cell} python3
import time
import os
import pathlib

# Ensure that new files are not created by a sibling process during execution
# Let's assume `first` and `second` take about the same time. We can introduce a delay before and after `B`'s core routines'. This ensures that if first and second execute concurrently, they are well overlapped, and if they execute serially, the boundary effects are negligible
# There are three possibilities, where `-` indicates sleep, `°` indicates start, and `'` indicates stop:
#
# 1. F°         F'--S°        S'--  (serial)
# 2. --S°        S'--F°         F'  (serial)
# 3. F°--S      F'--S'             (concur)
# Below, each notebook (F°→F', and S°→S') touches their start marker, does some work, and touches the stop marker. We're testing for case (3)
################

other_start_path = pathlib.Path.cwd() / "start-first"
this_start_path = pathlib.Path.cwd() / "start-second"

sleep_duration_ms = int(os.environ['MYST_TEST_SLEEP_MS'])
delay_duration_ms = int(os.environ['MYST_TEST_DELAY_MS'])

################

# ONLY FOR SECOND.md
time.sleep(sleep_duration_ms / 1e3)

# A. Touch start marker
this_start_path.touch()

# B. Assert other marker doesn't exist
# Catch case (3)
assert not other_start_path.exists()

# C. Wait for well-defined period
time.sleep(sleep_duration_ms / 1e3)

# D. Touch stop marker
this_start_path.unlink()
this_start_path.with_name(
  this_start_path.name.replace("start", "stop")
).touch()
```
