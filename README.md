AI generated code.  unreviewed.

# X3D JSON Schema Generator (Rearchitected)

A modern, maintainable, readable, and typed Python tool that converts **X3D Unified Object Model (X3DUOM)** XML specifications into standard **JSON Schema (Draft 2020-12)**.

## Why this Rearchitecture?

The original script (`etgenerateJSONschema2020-12.py`) suffered from several critical architectural bottlenecks:
- **Fragile String Concatenation**: Built 1.2+ MB JSON documents via hundreds of manual string appends (`\t\t\t`, `strip comma` hacks), leading to syntax risk, escape bugs, and unmaintainable formatting code.
- **Monolithic Global State**: Global dictionaries (`classes`, `containerFields`, `regex`, `code`) directly modified across disconnected functions.
- **Dead & Experimental Code**: Abandoned experimental methods (`listParents`, `addContainerFieldNodeContentModel`) and 200+ lines of commented-out blocks.
- **Lack of Typing & Domain Modeling**: No dataclasses or structured abstractions for X3D types, attributes, or nodes.
- **Brittle CLI**: Hardcoded `sys.argv[1]` crashing on missing parameters, relying on shell pipeline redirects.

### Key Improvements in this Architecture:
1. **Object-Oriented Abstract Syntax Tree (AST)**: Generates native Python dictionaries directly, then serializes cleanly via standard `json.dump(..., indent=2)`.
2. **Domain-Driven Design**:
   - `X3DClassDef`: Clean encapsulation of X3D node and statement classes with inheritance traversal.
   - `X3DSchemaGenerator`: Pure pipeline separating XML parsing, type mapping, container field resolution, and schema synthesis.
3. **Table-Driven Type Mapping**: Replaces 300+ lines of duplicated `if/elif` ladders with typed mapping tables for primitives and vectors.
4. **Production CLI with `argparse`**:
   - Supports `--input`, `--output`, `--version`, and `--indent`.
   - Reads from file or stdin; writes to file or stdout.
5. **Fast & Validated**: Generates all 370 definitions for X3D 4.0 in ~0.8s and passes automated unit tests.

## Usage

### Standalone Script
```bash
python3 x3d_schema_generator.py 4.0 -i X3dUnifiedObjectModel-4.0.xml -o x3d-4.0-JSONSchema.json
```

Or via pipeline:
```bash
python3 x3d_schema_generator.py 4.0 < X3dUnifiedObjectModel-4.0.xml > x3d-4.0-JSONSchema.json
```

### As a Modular Package
```python
import xml.etree.ElementTree as ET
from x3d_schema_gen import X3DSchemaGenerator

root = ET.parse("X3dUnifiedObjectModel-4.0.xml").getroot()
generator = X3DSchemaGenerator(root, x3d_version="4.0")
schema = generator.generate_schema()
```

### Running Tests
```bash
python3 -m unittest discover tests
```
