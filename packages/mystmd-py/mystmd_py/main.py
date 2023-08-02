import os
import pathlib
import shutil
import subprocess
import sys


NODE_LOCATION = (
    shutil.which("node") or shutil.which("node.exe") or shutil.which("node.cmd")
)
PATH_TO_BIN_JS = str((pathlib.Path(__file__).parent / "myst.cjs").resolve())


def main():
    if not NODE_LOCATION:
        sys.exit(
            "You must install node >=16 to run MyST\n\n"
            "We recommend installing the latest LTS release, using your preferred package manager\n"
            "or following instructions here: https://nodejs.org/en/download"
        )
    node = str(pathlib.Path(NODE_LOCATION).resolve())
    version_proc = subprocess.Popen(
        [node, "-v"], stdin=subprocess.PIPE, stdout=subprocess.PIPE
    )
    version_proc.wait()
    version = version_proc.communicate()[0].decode()
    try:
        ["16", "18", "20"].index(version[1:3])
    except:
        sys.exit(
            f"MyST requires node 16, 18, or 20; you are running node {version[1:3]}.\n\n"
            "Please update to the latest LTS release, using your preferred package manager\n"
            "or following instructions here: https://nodejs.org/en/download"
        )
    myst_proc = subprocess.Popen(
        [node, PATH_TO_BIN_JS, *sys.argv[1:]],
        stdin=sys.stdin,
        stdout=sys.stdout,
        env={**os.environ, "MYST_LANG": "PYTHON"},
    )
    sys.exit(myst_proc.wait())


if __name__ == "__main__":
    main()
