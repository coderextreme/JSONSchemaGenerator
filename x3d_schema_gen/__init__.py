"""
X3D Schema Generator Package

Modular, typed, and maintainable generator converting X3D Unified Object Model (X3DUOM)
XML specifications into standard JSON Schema (Draft 2020-12).
"""

from .generator import X3DSchemaGenerator
from .models import X3DClassDef, parse_numeric
from .static_defs import STATIC_DEFS

__version__ = "1.0.0"
__all__ = ["X3DSchemaGenerator", "X3DClassDef", "parse_numeric", "STATIC_DEFS"]
