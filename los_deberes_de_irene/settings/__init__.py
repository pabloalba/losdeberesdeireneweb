import sys

try:
    from .local import *
except ImportError:
    print("«local.py» file does not exist.")
    print("Go to settings directory, copy «local.py.example» to «local.py» and customize it.")
    sys.exit(-1)
