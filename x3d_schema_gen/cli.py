"""
Command-line interface for X3D JSON Schema generator.
"""

from __future__ import annotations

import argparse
import json
import sys
import xml.etree.ElementTree as ET

from .generator import X3DSchemaGenerator


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate JSON Schema (Draft 2020-12) from X3D Unified Object Model (X3DUOM) XML"
    )
    parser.add_argument(
        "version",
        nargs="?",
        default="4.0",
        help="X3D specification version (e.g. 3.0, 3.1, 3.2, 3.3, 4.0, 4.1). Default: 4.0"
    )
    parser.add_argument(
        "-i", "--input",
        dest="input_file",
        help="Path to X3dUnifiedObjectModel XML file (reads from stdin if omitted)"
    )
    parser.add_argument(
        "-o", "--output",
        dest="output_file",
        help="Path to write output JSON Schema (writes to stdout if omitted)"
    )
    parser.add_argument(
        "--indent",
        type=int,
        default=2,
        help="JSON indentation spaces (default: 2)"
    )

    args = parser.parse_args()

    if args.input_file:
        with open(args.input_file, "rb") as f:
            root = ET.parse(f).getroot()
    else:
        root = ET.parse(sys.stdin).getroot()

    generator = X3DSchemaGenerator(root, x3d_version=args.version)
    schema = generator.generate_schema()

    if args.output_file:
        with open(args.output_file, "w", encoding="utf-8") as f:
            json.dump(schema, f, indent=args.indent, ensure_ascii=False)
            f.write("\n")
    else:
        json.dump(schema, sys.stdout, indent=args.indent, ensure_ascii=False)
        sys.stdout.write("\n")


if __name__ == "__main__":
    main()
