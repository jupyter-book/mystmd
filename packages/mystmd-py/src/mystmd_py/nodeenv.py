import os
import pathlib
import shutil
import subprocess
import sys


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


