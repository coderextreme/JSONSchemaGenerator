"""
Domain models and inheritance hierarchy structures for X3D nodes, statements, and fields.
"""

from __future__ import annotations

import xml.etree.ElementTree as ET
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple, Union


def parse_numeric(val: Optional[str]) -> Optional[Union[int, float]]:
    """Convert an XML string attribute to an integer or float if numeric."""
    if val is None or val == "":
        return None
    try:
        if "." in val or "e" in val.lower():
            return float(val)
        return int(val)
    except ValueError:
        try:
            return float(val)
        except ValueError:
            return None


class X3DClassDef:
    """Represents a node or statement class definition within the X3D inheritance hierarchy."""

    def __init__(
        self,
        name: str,
        element: Optional[ET.Element] = None,
        initial_parents: Optional[Dict[str, int]] = None
    ):
        self.name: str = name
        self.element: Optional[ET.Element] = element
        self.parents: Dict[str, int] = dict(initial_parents or {})
        self.children: Dict[str, str] = {}
        self.printed: bool = False

        if element is not None:
            interface_def = element.find(".//InterfaceDefinition")
            if interface_def is not None and interface_def.get("appinfo"):
                self.appinfo: str = interface_def.get("appinfo", "").replace('"', r'\"')
            else:
                self.appinfo = f"This node, {self.name}, has no InterfaceDefinition.appinfo."
        else:
            self.appinfo = f"A really abstract string thing called {self.name}"

    def get_all_parents(self, classes_map: Dict[str, X3DClassDef]) -> Dict[str, int]:
        """Recursively collect all transitive ancestors in the inheritance graph."""
        all_parents: Dict[str, int] = dict(self.parents)
        if self.element is not None:
            for tag in ("Inheritance", "AdditionalInheritance"):
                for inher in self.element.iter(tag):
                    base_type = inher.get("baseType")
                    if base_type and base_type in classes_map:
                        all_parents[base_type] = 1
                        all_parents.update(classes_map[base_type].get_all_parents(classes_map))
        return all_parents

    def get_transitive_children(
        self,
        classes_map: Dict[str, X3DClassDef],
        visited: Optional[Dict[str, bool]] = None
    ) -> Dict[str, bool]:
        """Recursively collect all transitive descendant node names."""
        if visited is None:
            visited = {}
        visited[self.name] = True
        for child_name in self.children:
            if child_name in classes_map and child_name not in visited:
                classes_map[child_name].get_transitive_children(classes_map, visited)
        return visited
