import pathlib
import shutil
import subprocess
import sys


NODE_LOCATION = (
    shutil.which("node") or
    shutil.which("node.exe") or
    shutil.which("node.cmd")
)
PATH_TO_BIN_JS = str(
    (
        pathlib.Path(__file__).parent / 'myst.cjs'
    ).resolve()
)


def main():
    if not NODE_LOCATION:
        sys.exit(
            'You must install node to run myst\n\n'
            'We recommend installing the latest LTS release, using your preferred package manager\n'
            'or following instructions here: https://nodejs.org/en/download'
        )
    node = str(pathlib.Path(NODE_LOCATION).resolve())
    p = subprocess.Popen(
        [node, PATH_TO_BIN_JS, *sys.argv[1:]],
        stdin=sys.stdin, stdout=sys.stdout
    )
    sys.exit(p.wait())


if __name__ == "__main__":
    main()
