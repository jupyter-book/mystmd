import os
import pathlib
import platform
import shutil
import subprocess
import sys
import re
import textwrap


NODEENV_VERSION = "18.0.0"
INSTALL_NODEENV_KEY = "MYSTMD_ALLOW_NODEENV"


class PermissionDeniedError(Exception): ...


class NodeEnvCreationError(Exception): ...


def find_installed_node():
    return shutil.which("node") or shutil.which("node.exe") or shutil.which("node.cmd")


def find_nodeenv_path():
    # The conda packaging of this package does not need to install node!
    import platformdirs
    return platformdirs.user_data_path(
        appname="myst", appauthor=False, version=NODEENV_VERSION
    )


def ask_to_install_node(path):
    if env_value := os.environ.get(INSTALL_NODEENV_KEY, "").lower():
        return env_value in {"yes", "true", "1", "y"}

    return input(f"❔ Install Node.js in '{path}'? (y/N): ").lower() == "y"


def create_nodeenv(env_path):
    command = [
        sys.executable,
        "-m",
        "nodeenv",
        "-v",
        f"--node={NODEENV_VERSION}",
        "--prebuilt",
        "--clean-src",
        env_path,
    ]
    result = subprocess.run(command, capture_output=True, encoding="utf-8")
    if result.returncode:
        shutil.rmtree(env_path)
        raise NodeEnvCreationError(result.stderr)
    else:
        return env_path


def find_any_node(binary_path):
    node_path = find_installed_node()
    if node_path is not None:
        return pathlib.Path(node_path).absolute(), binary_path

    nodeenv_path = find_nodeenv_path()
    if not nodeenv_path.exists():
        print("❗ Node.js (node) is required to run MyST, but could not be found`.")
        if ask_to_install_node(nodeenv_path):
            print(f"⚙️ Attempting to install Node.js in {nodeenv_path} ...")
            create_nodeenv(nodeenv_path)
            print(f"ℹ️ Successfully installed Node.js {NODEENV_VERSION}")
        else:
            raise PermissionDeniedError("Node.js installation was not permitted")

    new_path = os.pathsep.join(
        [*binary_path.split(os.pathsep), str(nodeenv_path / "bin")]
    )
    return nodeenv_path / "bin" / "node", new_path


def main():
    # Find NodeJS (and potential new PATH)
    binary_path = os.environ.get("PATH", os.defpath)
    try:
        node_path, os_path = find_any_node(binary_path)
    except NodeEnvCreationError as err:
        message = textwrap.indent(err.args[0], "    ")
        raise SystemExit(
            "💥 The attempt to install Node.js was unsuccessful.\n"
            f"🔍 Underlying error:\n{message}\n\n"
            "ℹ️ We recommend installing the latest LTS release, using your preferred package manager "
            "or following instructions here: https://nodejs.org/en/download\n\n"
        ) from err
    except PermissionDeniedError as err:
        raise SystemExit(
            "💥 The attempt to install Node.js failed because the user denied the request.\n"
            "ℹ️ We recommend installing the latest LTS release, using your preferred package manager "
            "or following instructions here: https://nodejs.org/en/download\n\n"
        ) from err

    # Check version
    _version = subprocess.run(
        [node_path, "-v"], capture_output=True, check=True, text=True
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
   
    # Find path to compiled JS 
    js_path = (pathlib.Path(__file__).parent / "myst.cjs").resolve()

    # Build args for Node.js process
    node_args = [js_path, *sys.argv[1:]]
    node_env = {**os.environ, "MYST_LANG": "PYTHON", "PATH": os_path}

    # Invoke appropriate binary for platform
    if platform.system() == "Windows":
        result = subprocess.run([node_path, *node_args], env=node_env)
        sys.exit(result.returncode)
    else:
        os.execve(
            node_path,
            [node_path.name, *node_args],
            node_env,
        )

if __name__ == "__main__":
    main()
