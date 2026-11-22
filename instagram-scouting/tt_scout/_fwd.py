"""This folder moved to tarot-talk/scouting. These few files only pass an already-installed copy of the app on to the new place,
so the Desktop shortcut keeps working. Nothing else lives here."""
import importlib, importlib.util, os, pathlib, sys

NEW = pathlib.Path(__file__).resolve().parents[2] / "tarot-talk" / "scouting"


def load(name):
    if not (NEW / "tt_scout" / "__init__.py").exists():
        sys.exit("The app moved to tarot-talk/scouting, but that folder is missing here. Run git pull in the AI folder.")
    os.environ["TT_SCOUT_HOME"] = str(NEW)
    if "tt_scout_live" not in sys.modules:
        spec = importlib.util.spec_from_file_location("tt_scout_live", NEW / "tt_scout" / "__init__.py", submodule_search_locations=[str(NEW / "tt_scout")])
        pkg = importlib.util.module_from_spec(spec); sys.modules["tt_scout_live"] = pkg; spec.loader.exec_module(pkg)
    return importlib.import_module("tt_scout_live." + name)
