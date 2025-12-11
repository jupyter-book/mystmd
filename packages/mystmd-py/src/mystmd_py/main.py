import os
import pathlib
import platform
import subprocess
import sys
import re
import textwrap

from .nodeenv import find_any_node, PermissionDeniedError, NodeEnvCreationError


NODEENV_VERSION = "18.0.0"


def ensure_valid_version(node_path, node_env):
    # Check version
    _version = subprocess.run(
        [node_path, "-v"], capture_output=True, check=True, text=True, env=node_env
    ).stdout
    major_version_match = re.match(r"v(\d+).*", _version)

    if major_version_match is None:
        raise SystemExit(f"MyST could not determine the version of Node.js: {_version}")
    major_version = int(major_version_match[1])
    if not (major_version in {18, 20, 22} or major_version > 22):
        raise SystemExit(
            f"MyST requires node 18, 20, or 22+; you are running node {major_version}.\n\n"
            "Please update to the latest LTS release, using your preferred package manager\n"
            "or following instructions here: https://nodejs.org/en/download"
        )


def main():
    # Find NodeJS (and potential new PATH)
    binary_path = os.environ.get("PATH", os.defpath)
    try:
        node_path, os_path = find_any_node(binary_path, nodeenv_version=NODEENV_VERSION)
    except NodeEnvCreationError as err:
        message = textwrap.indent(err.args[0], "    ")
        raise SystemExit(
            "💥 The attempt to install Node.js was unsuccessful.\n"
            f"🔍  Underlying error:\n{message}\n\n"
            "ℹ️  We recommend installing the latest LTS release, using your preferred package manager "
            "or following instructions here: https://nodejs.org\n\n"
        ) from err
    except PermissionDeniedError as err:
        raise SystemExit(
            "💥 The attempt to install Node.js failed because the user denied the request.\n"
            "ℹ️  We recommend installing the latest LTS release, using your preferred package manager "
            "or following instructions here: https://nodejs.org\n\n"
        ) from err

    # Build new env dict
    node_env = {**os.environ, "PATH": os_path}

    # Ensure Node.js is compatible
    ensure_valid_version(node_path, node_env)

    # Find path to compiled JS
    js_path = (pathlib.Path(__file__).parent / "myst.cjs").resolve()

    # Build args for Node.js process
    myst_node_args = [js_path, *sys.argv[1:]]
    myst_env = {**node_env, "MYST_LANG": "PYTHON"}

    # Invoke appropriate binary for platform
    if platform.system() == "Windows":
        result = subprocess.run([node_path, *myst_node_args], env=myst_env)
        sys.exit(result.returncode)
    else:
        os.execve(
            node_path,
            [node_path.name, *myst_node_args],
            myst_env,
        )


if __name__ == "__main__":
    main()
