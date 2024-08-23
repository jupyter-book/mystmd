import os
from hatchling.builders.hooks.plugin.interface import BuildHookInterface


class CustomBuildHook(BuildHookInterface):
    PLUGIN_NAME = "custom"

    def initialize(self, version, build_data):
        if "MYST_IS_CONDA_PACKAGE" not in os.environ:
            requirements = self.config["pypi_dependencies"]
            build_data["dependencies"].extend(requirements)
