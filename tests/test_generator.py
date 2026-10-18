"""
Test suite for X3D JSON Schema Generator.
"""

import json
import unittest
import xml.etree.ElementTree as ET
from x3d_schema_gen import X3DSchemaGenerator, STATIC_DEFS


class TestX3DSchemaGenerator(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open("X3dUnifiedObjectModel-4.0.xml", "rb") as f:
            cls.root = ET.parse(f).getroot()
        cls.generator = X3DSchemaGenerator(cls.root, x3d_version="4.0")
        cls.schema = cls.generator.generate_schema()

    def test_schema_root_properties(self):
        """Verify standard top-level JSON Schema Draft 2020-12 metadata."""
        self.assertEqual(
            self.schema["$schema"],
            "https://json-schema.org/draft/2020-12/schema"
        )
        self.assertIn("x3d-4.0-JSONSchema.json", self.schema["$id"])
        self.assertEqual(self.schema["type"], "object")
        self.assertIn("X3D", self.schema["properties"])
        self.assertEqual(self.schema["required"], ["X3D"])
        self.assertFalse(self.schema["additionalProperties"])
        self.assertIn("$defs", self.schema)

    def test_static_definitions_present(self):
        """Ensure standard static definitions are included."""
        defs = self.schema["$defs"]
        for key in ("-childStatements", "-NamedUSEField", "-USEField", "@geoSystem"):
            self.assertIn(key, defs)

    def test_transform_node(self):
        """Test Transform node schema structure and properties."""
        defs = self.schema["$defs"]
        self.assertIn("Transform", defs)
        t_node = defs["Transform"]
        self.assertEqual(t_node["title"], "Transform")
        self.assertIn("oneOf", t_node)
        self.assertEqual(t_node["oneOf"][0]["$ref"], "#/$defs/-USEField")

        props = t_node["oneOf"][1]["properties"]
        self.assertIn("@translation", props)
        self.assertIn("@rotation", props)
        self.assertIn("@scale", props)
        self.assertIn("-children", props)

        # Check vector bounds on @translation
        trans = props["@translation"]
        self.assertEqual(trans["type"], "array")
        self.assertEqual(trans["minItems"], 3)
        self.assertEqual(trans["maxItems"], 3)
        self.assertEqual(trans["items"]["type"], "number")
        self.assertEqual(trans["items"]["default"], 0)

    def test_box_node(self):
        """Test Box node properties and dimensions."""
        defs = self.schema["$defs"]
        self.assertIn("Box", defs)
        box = defs["Box"]
        props = box["oneOf"][1]["properties"]
        self.assertIn("@size", props)
        self.assertEqual(props["@size"]["minItems"], 3)
        self.assertEqual(props["@size"]["maxItems"], 3)

    def test_def_pattern(self):
        """Ensure @DEF pattern conforms to standard XML ID naming."""
        defs = self.schema["$defs"]
        props = defs["Transform"]["oneOf"][1]["properties"]
        self.assertIn("@DEF", props)
        self.assertEqual(props["@DEF"]["pattern"], "^[a-zA-Z_][\\w.-]*$")

    def test_json_serializability(self):
        """Confirm that generated dictionary serializes cleanly without error."""
        dumped = json.dumps(self.schema)
        self.assertGreater(len(dumped), 500000)
        reloaded = json.loads(dumped)
        self.assertEqual(len(reloaded["$defs"]), len(self.schema["$defs"]))


if __name__ == "__main__":
    unittest.main()
