import os
import pathlib
import platform
import shutil
import subprocess
import sys
import re
import platformdirs


NODEENV_VERSION = "18.0.0"


def find_installed_node():
    return shutil.which("node") or shutil.which("node.exe") or shutil.which("node.cmd")


def find_nodeenv_path():
    return platformdirs.user_data_path(
        appname="myst", appauthor=False, version=NODEENV_VERSION
    )


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
    subprocess.run(command, check=True)


def find_any_node(binary_path):
    node_path = find_installed_node()
    if node_path is not None:
        return pathlib.Path(node_path).absolute(), binary_path

    nodeenv_path = find_nodeenv_path()
    if not nodeenv_path.exists():
        print(f"🔍 Couldn't find installed `node`.\n\n⚙️ Installing Node.js in {nodeenv_path}")
        create_nodeenv(nodeenv_path)

    new_path = os.pathsep.join(
        [*binary_path.split(os.pathsep), str(nodeenv_path / "bin")]
    )
    return nodeenv_path / "bin" / "node", new_path


def main():
    # Find NodeJS (and potential new PATH)
    binary_path = os.environ.get("PATH", os.defpath)
    try:
        node_path, os_path = find_any_node(binary_path)
    except Exception as err:
        import traceback

        traceback.print_exc()
        raise SystemExit(
            "You must install node >=18 to run MyST\n\n"
            "As NodeJS could not be found, an attempt to install a local node environment was made, but failed\n\n"
            "We recommend installing the latest LTS release, using your preferred package manager\n"
            "or following instructions here: https://nodejs.org/en/download"
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
