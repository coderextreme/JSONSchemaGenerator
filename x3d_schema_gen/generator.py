"""
Core X3D JSON Schema generator engine.
"""

from __future__ import annotations

import datetime
import xml.etree.ElementTree as ET
from typing import Any, Dict, List, Optional, Set, Tuple, Union

from .models import X3DClassDef, parse_numeric
from .static_defs import STATIC_DEFS

# Dimension map for vector, matrix, and color field types (minItems, maxItems)
TYPE_ARRAY_DIMENSIONS: Dict[str, Tuple[int, Optional[int]]] = {
    "SFVec2f": (2, 2),
    "MFVec2f": (2, None),
    "SFVec3f": (3, 3),
    "MFVec3f": (3, None),
    "SFVec4f": (4, 4),
    "MFVec4f": (4, None),
    "SFVec2d": (2, 2),
    "MFVec2d": (2, None),
    "SFVec3d": (3, 3),
    "MFVec3d": (3, None),
    "SFVec4d": (4, 4),
    "MFVec4d": (4, None),
    "SFMatrix4f": (16, 16),
    "SFColor": (3, 3),
    "MFColor": (3, None),
    "SFColorRGBA": (4, 4),
    "MFColorRGBA": (4, None),
    "SFRotation": (4, 4),
    "MFRotation": (4, None),
}

# Primitive JSON Schema types
PRIMITIVE_TYPE_MAP: Dict[str, str] = {
    "SFBool": "boolean",
    "SFDouble": "number",
    "SFTime": "number",
    "SFFloat": "number",
    "SFInt32": "integer",
    "SFNode": "object",
    "SFString": "string",
    "MFBool": "boolean",
    "MFInt32": "integer",
    "MFNode": "object",
    "MFString": "string",
}

# Nodes wrapped in array container
ARRAY_CONTAINER_NODES: Set[str] = {
    "meta", "component", "connect", "unit", "field", "fieldValue"
}


class X3DSchemaGenerator:
    """
    Parses X3DUOM XML and produces a standard JSON Schema (Draft 2020-12) object.
    """

    def __init__(self, xml_root: ET.Element, x3d_version: str = "4.0"):
        self.root = xml_root
        self.version = x3d_version
        self.regex_map: Dict[str, str] = {}
        self.classes: Dict[str, X3DClassDef] = {}
        self.container_fields: Dict[str, Dict[str, Any]] = {}
        self._initialize()

    def _initialize(self) -> None:
        """Parse types, nodes, statements, and build inheritance hierarchy."""
        # 1. Field types regex patterns
        for ft in self.root.iter("FieldType"):
            r = ft.get("regex")
            t = ft.get("type")
            if r and t:
                self.regex_map[t] = r

        # 2. Abstract Node Types
        for ant in self.root.iter("AbstractNodeType"):
            name = ant.get("name")
            if name:
                self.classes[name] = X3DClassDef(name, ant)

        # Base synthetic parent categories
        self.classes["X3DConcreteNode"] = X3DClassDef("X3DConcreteNode")
        self.classes["X3DConcreteStatement"] = X3DClassDef("X3DConcreteStatement")

        # 3. Abstract Object Types
        for aot in self.root.iter("AbstractObjectType"):
            name = aot.get("name")
            if name:
                self.classes[name] = X3DClassDef(name, aot)

        # 4. Concrete Nodes
        for cn in self.root.iter("ConcreteNode"):
            name = cn.get("name")
            if name:
                self.classes[name] = X3DClassDef(name, cn, {"X3DConcreteNode": 1})
                self.classes["X3DConcreteNode"].children[name] = name

        # 5. Statements
        special_statements = {"ExternProtoDeclare", "ProtoDeclare", "IMPORT", "EXPORT", "ROUTE"}
        for st in self.root.iter("Statement"):
            name = st.get("name")
            if not name:
                continue
            if name in special_statements:
                self.classes[name] = X3DClassDef(name, st, {"X3DConcreteStatement": 1, "X3DChildNode": 1})
                if "X3DChildNode" in self.classes:
                    self.classes["X3DChildNode"].children[name] = name
            else:
                self.classes[name] = X3DClassDef(name, st, {"X3DConcreteStatement": 1})
            self.classes["X3DConcreteStatement"].children[name] = name

        # 6. Build inheritance graph edges
        for cls_def in self.classes.values():
            if cls_def.element is not None:
                for tag in ("Inheritance", "AdditionalInheritance"):
                    for inher in cls_def.element.iter(tag):
                        base_type = inher.get("baseType")
                        if base_type and base_type in self.classes:
                            self.classes[base_type].children[cls_def.name] = cls_def.name

        # Resolve all transitive parent references
        for cls_def in self.classes.values():
            cls_def.parents.update(cls_def.get_all_parents(self.classes))

    def _extract_min_max(self, field_el: ET.Element, target_dict: Dict[str, Any]) -> None:
        """Extract and assign numeric min/max limits to schema definition."""
        mappings = [
            ("maxExclusive", "exclusiveMaximum"),
            ("maxInclusive", "maximum"),
            ("minExclusive", "exclusiveMinimum"),
            ("minInclusive", "minimum")
        ]
        for xml_attr, json_key in mappings:
            val = field_el.get(xml_attr)
            if val is not None:
                parsed = parse_numeric(val)
                if parsed is not None:
                    target_dict[json_key] = parsed

    def _get_item_type(self, field_type: str) -> str:
        """Map MF-type to the JSON Schema primitive item type."""
        if field_type == "MFBool":
            return "boolean"
        elif field_type == "MFInt32":
            return "integer"
        elif field_type == "MFNode":
            return "object"
        elif field_type == "MFString":
            return "string"
        return "number"

    def _build_field_schema(
        self,
        class_name: str,
        field_el: ET.Element,
        name_attr: str
    ) -> Optional[Tuple[str, Dict[str, Any]]]:
        """Transform an X3D XML field definition into a JSON Schema property dict."""
        access_type = field_el.get("accessType")
        if access_type in ("inputOnly", "outputOnly"):
            return None

        field_name = field_el.get(name_attr)
        if not field_name:
            return None

        prop_name = f"@{field_name}"

        # geoSystem uses common static reference
        if field_name == "geoSystem":
            return prop_name, {"$ref": "#/$defs/@geoSystem"}

        schema: Dict[str, Any] = {}
        field_type = field_el.get("type", "")

        # DEF identifier validation vs general regex
        if field_name == "DEF":
            schema["pattern"] = r"^[a-zA-Z_][\w.-]*$"
        elif field_type == "SFString" and self.regex_map.get(field_type) and field_name != "value":
            schema["pattern"] = f"^{self.regex_map[field_type]}$"

        is_vector_or_color = (
            field_name in ('attenuation', 'size', 'direction', 'frictionCoefficients', 'scale', 'particleSize', 'plane', 'dimensions')
            or field_type.startswith("MF")
            or "Color" in field_type
        )

        # Parse enumerations
        enums: List[Union[str, int]] = []
        for enum_el in field_el.iter("enumeration"):
            val = enum_el.get("value")
            if val is not None:
                if field_type.endswith("FInt32"):
                    parsed_int = parse_numeric(val)
                    enums.append(parsed_int if parsed_int is not None else val)
                else:
                    enums.append(val.strip('"'))

        additional_enums = field_el.get("additionalEnumerationValuesAllowed") == "true"

        # Scalar field constraints & default values
        if field_name != "value" or class_name not in ("field", "fieldValue"):
            if not is_vector_or_color:
                self._extract_min_max(field_el, schema)

                if enums:
                    if additional_enums:
                        schema["anyOf"] = [
                            {"enum": enums},
                            {"type": "string"}
                        ]
                    else:
                        schema["enum"] = enums

                raw_default = field_el.get("default")
                if raw_default is not None:
                    if field_type == "SFString":
                        schema["default"] = raw_default
                    elif field_type == "SFBool":
                        schema["default"] = (raw_default.upper() == "TRUE" or raw_default.lower() == "true")
                    elif field_type in ("SFDouble", "SFTime", "SFFloat", "SFInt32"):
                        parsed_num = parse_numeric(raw_default)
                        if parsed_num is not None:
                            schema["default"] = parsed_num

        # Comments and primitive types
        allow_additional_check = (
            field_el.get("additionalEnumerationValuesAllowed") == "false" or
            field_el.get("additionalEnumerationValuesAllowed") is None
        )
        if allow_additional_check:
            schema["$comment"] = f"{field_type} {access_type}"
            if field_type in PRIMITIVE_TYPE_MAP:
                schema["type"] = PRIMITIVE_TYPE_MAP[field_type]
            else:
                schema["type"] = "array"

        # Array & vector configuration
        if not field_type.startswith("SF") or field_type not in (
            "SFBool", "SFDouble", "SFTime", "SFFloat", "SFInt32", "SFNode", "SFString"
        ):
            schema["$comment"] = f"{field_type} {access_type}"
            schema["type"] = "array"

            if field_name.endswith("url") or field_name.endswith("Url") or field_name in ("ROUTE", "Scene"):
                schema["minItems"] = 1
            elif field_type in TYPE_ARRAY_DIMENSIONS:
                min_i, max_i = TYPE_ARRAY_DIMENSIONS[field_type]
                schema["minItems"] = min_i
                if max_i is not None:
                    schema["maxItems"] = max_i
            else:
                min_occ = field_el.get("minOccurs")
                if min_occ is not None:
                    parsed_occ = parse_numeric(min_occ)
                    if parsed_occ is not None:
                        schema["minItems"] = parsed_occ
                max_occ = field_el.get("maxOccurs")
                if max_occ is not None:
                    parsed_occ = parse_numeric(max_occ)
                    if parsed_occ is not None:
                        schema["maxItems"] = parsed_occ

            # Analyze defaults
            raw_default = field_el.get("default")
            all_the_same = True
            first_value: Optional[str] = None
            default_items: List[str] = []

            if raw_default:
                if field_type == "MFString":
                    stripped = raw_default[1:-1] if raw_default.startswith('"') and raw_default.endswith('"') else raw_default
                    default_items = stripped.split('" "')
                else:
                    default_items = raw_default.split(" ")

                if default_items:
                    first_value = default_items[0]
                    all_the_same = all(x == first_value for x in default_items)

            # Uniform items vs prefixItems
            if all_the_same and field_name not in ('align', 'offsetUnits', 'scaleMode', 'sizeUnits') and 'SFColor' not in field_type:
                item_schema: Dict[str, Any] = {}
                if field_name.endswith("url") or field_name.endswith("Url"):
                    item_schema["format"] = "uri-reference"

                if enums:
                    if additional_enums:
                        item_schema["anyOf"] = [
                            {"enum": enums},
                            {"type": "string"}
                        ]
                    else:
                        item_schema["enum"] = enums

                if first_value is not None:
                    if field_type == "MFString":
                        item_schema["default"] = first_value
                    else:
                        parsed_val = parse_numeric(first_value)
                        item_schema["default"] = parsed_val if parsed_val is not None else first_value

                self._extract_min_max(field_el, item_schema)
                item_schema["type"] = self._get_item_type(field_type)
                schema["items"] = item_schema

            elif field_name == "crossSection":
                schema["default"] = [1, 1, 1, -1, -1, -1, -1, 1, 1, 1]
            elif field_name in ('avatarSize', 'orientation', 'type', 'fieldOfView', 'clipBoundary', 'spine', 'inertia'):
                pass
            else:
                prefix_items: List[Dict[str, Any]] = []
                enum_objects: List[List[str]] = []
                if enums and field_type == "MFString":
                    for en in enums:
                        en_str = str(en).strip('"')
                        sections = en_str.replace("\\", "").split(" ")
                        for s, sec in enumerate(sections):
                            while len(enum_objects) <= s:
                                enum_objects.append([])
                            enum_objects[s].append(sec)

                if default_items:
                    if field_type == "MFString":
                        for item in default_items:
                            entry: Dict[str, Any] = {}
                            if field_name.endswith("url") or field_name.endswith("Url"):
                                entry["format"] = "uri-reference"
                            if enums:
                                entry["enum"] = sorted(list(set(str(e) for e in enums)))
                            entry["default"] = item
                            self._extract_min_max(field_el, entry)
                            entry["type"] = self._get_item_type(field_type)
                            prefix_items.append(entry)
                    else:
                        for item in default_items:
                            entry = {}
                            if enums:
                                entry["enum"] = enums
                            parsed_num = parse_numeric(item)
                            entry["default"] = parsed_num if parsed_num is not None else item
                            self._extract_min_max(field_el, entry)
                            entry["type"] = self._get_item_type(field_type)
                            prefix_items.append(entry)

                if prefix_items:
                    schema["prefixItems"] = prefix_items

                if field_type.startswith("SF") or field_name in ('align', 'offsetUnits', 'scaleMode', 'sizeUnits'):
                    schema["items"] = False
                    if field_name in ('align', 'offsetUnits', 'scaleMode', 'sizeUnits'):
                        schema["minItems"] = len(enum_objects)
                        schema["maxItems"] = len(enum_objects)
                elif field_type.startswith("MF"):
                    items_def: Dict[str, Any] = {}
                    self._extract_min_max(field_el, items_def)
                    items_def["type"] = self._get_item_type(field_type)
                    if all_the_same and first_value is not None:
                        if field_type == "MFString":
                            items_def["default"] = first_value
                        else:
                            parsed_val = parse_numeric(first_value)
                            items_def["default"] = parsed_val if parsed_val is not None else first_value
                    schema["items"] = items_def

        return prop_name, schema

    def _build_container_field(self, field_el: ET.Element) -> Tuple[str, Dict[str, Any]]:
        """Construct container field schema definition (-Children, -geometry, etc.)."""
        acc_node_types = field_el.get("acceptableNodeTypes", "").replace("|", "-")
        field_type = field_el.get("type", "")
        access_type = field_el.get("accessType", "")
        cf_key = f"-{acc_node_types}{field_type}"

        types_list = [t for t in acc_node_types.split("-") if t]
        types_list.append("ProtoInstance")

        descendants: Dict[str, bool] = {}
        for t in types_list:
            if t in self.classes:
                self.classes[t].get_transitive_children(self.classes, descendants)

        props: Dict[str, Any] = {}
        if field_type == "MFNode":
            props["#comment"] = {"type": "string"}

        for node_name in sorted(descendants.keys()):
            if not node_name.startswith("X3D"):
                props[node_name] = {"$ref": f"#/$defs/{node_name}"}

        if field_type == "SFNode":
            definition = {
                "title": acc_node_types,
                "$comment": f"{field_type} {access_type}",
                "type": "object",
                "properties": props,
                "additionalProperties": False
            }
        else:  # MFNode
            definition = {
                "title": acc_node_types,
                "$comment": f"{field_type} {access_type}",
                "type": "array",
                "minItems": 1,
                "items": {
                    "type": "object",
                    "properties": props,
                    "additionalProperties": False
                }
            }

        return cf_key, definition

    def _build_node_definition(self, cls_def: X3DClassDef) -> Optional[Dict[str, Any]]:
        """Generate JSON Schema definition for a concrete X3D node or statement."""
        if cls_def.name.startswith("X3D") and cls_def.name != "X3D":
            return None

        node_elem = cls_def.element
        found_use = False
        found_children = False
        has_field_decl = False

        if node_elem is not None:
            has_field_decl = node_elem.find(".//FieldDeclaration") is not None
            for f in node_elem.iter("field"):
                if f.get("name") == "USE":
                    found_use = True
                if f.get("name") == "children":
                    found_children = True

        properties: Dict[str, Any] = {}
        required_fields: List[str] = []

        # Node-specific properties
        if cls_def.name in ("Script", "ShaderProgram", "ShaderPart"):
            properties["#sourceCode"] = {
                "type": "array",
                "minItems": 1,
                "items": {"type": "string"}
            }

        if has_field_decl:
            properties["field"] = {"$ref": "#/$defs/field"}

        if cls_def.name == "X3D":
            properties["@xsd:noNamespaceSchemaLocation"] = {
                "type": "string",
                "format": "uri"
            }
            properties["JSON schema"] = {"type": "string"}
            properties["encoding"] = {
                "type": "string",
                "enum": ["UTF-8", "UTF-16", "UTF-32"]
            }

        if cls_def.name in ("ProtoInstance", "IS"):
            properties["-children"] = {
                "type": "array",
                "minItems": 1,
                "items": {
                    "type": "object",
                    "properties": {"#comment": {"type": "string"}},
                    "additionalProperties": False
                }
            }
        elif not found_children:
            properties["-children"] = {"$ref": "#/$defs/-childStatements"}

        # Fields processing
        if node_elem is not None:
            for f in node_elem.iter("field"):
                fname = f.get("name", "")
                if fname.startswith("X3D") and fname not in ("X3D", "USE"):
                    continue

                if f.get("use") == "required":
                    required_fields.append(f"@{fname}")
                elif fname == "Scene":
                    required_fields.extend(["Scene", "encoding"])

                if fname == "address" or (not fname.startswith("add") and not fname.startswith("remove")):
                    ftype = f.get("type", "")
                    syn = f.get("synonym")

                    if ftype in ("MFNode", "SFNode"):
                        if fname in self.classes and self.classes[fname] is not None and fname != "X3D":
                            properties[fname] = {"$ref": f"#/$defs/{fname}"}
                            if syn:
                                properties[syn] = {"$ref": f"#/$defs/{syn}"}
                        else:
                            acc_types = f.get("acceptableNodeTypes")
                            if acc_types:
                                cf_name = f"-{acc_types.replace('|', '-')}{ftype}"
                                properties[f"-{fname}"] = {"$ref": f"#/$defs/{cf_name}"}
                                if syn:
                                    properties[f"-{syn}"] = {"$ref": f"#/$defs/{cf_name}"}
                                # Register container field
                                cf_key, cf_val = self._build_container_field(f)
                                self.container_fields[cf_key] = cf_val
                    elif fname != "USE":
                        res = self._build_field_schema(cls_def.name, f, "name")
                        if res:
                            properties[res[0]] = res[1]
                        if syn:
                            res_syn = self._build_field_schema(cls_def.name, f, "synonym")
                            if res_syn:
                                properties[res_syn[0]] = res_syn[1]

        # Inner object schema
        obj_schema: Dict[str, Any] = {
            "type": "object",
            "properties": properties,
        }
        if required_fields:
            obj_schema["required"] = required_fields
        obj_schema["additionalProperties"] = False

        # Outer root definition
        root_schema: Dict[str, Any] = {
            "title": cls_def.name,
            "description": cls_def.appinfo
        }

        if cls_def.name in ARRAY_CONTAINER_NODES:
            root_schema["type"] = "array"
            root_schema["items"] = obj_schema
        elif found_use:
            use_ref = (
                "#/$defs/-NamedUSEField"
                if (cls_def.name == "ProtoInstance" and self.version in ("4.0", "4.1"))
                else "#/$defs/-USEField"
            )
            root_schema["oneOf"] = [
                {"$ref": use_ref},
                obj_schema
            ]
        else:
            root_schema.update(obj_schema)

        return root_schema

    def generate_schema(self) -> Dict[str, Any]:
        """Generate complete JSON Schema document."""
        now_str = datetime.datetime.now().strftime("%Y/%m/%d %H:%M:%S")
        defs: Dict[str, Any] = dict(STATIC_DEFS)

        # Definitions for concrete classes
        for name, cls_def in self.classes.items():
            node_def = self._build_node_definition(cls_def)
            if node_def is not None:
                defs[name] = node_def

        # Generated container fields
        for cf_name, cf_def in self.container_fields.items():
            defs[cf_name] = cf_def

        return {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "$id": f"https://www.web3d.org/specifications/x3d-{self.version}-JSONSchema.json",
            "title": f"X3D V{self.version} JSON Schema, generated {now_str}",
            "description": f"Experimental JSON Schema for X3D V{self.version}.  License: Web3D Consortium License: https://www.web3d.org/license",
            "type": "object",
            "properties": {
                "X3D": {
                    "$ref": "#/$defs/X3D"
                }
            },
            "required": ["X3D"],
            "additionalProperties": False,
            "$defs": defs
        }
