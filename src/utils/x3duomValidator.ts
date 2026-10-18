/**
 * X3DUOM-Native Semantic Validator for X3D JSON (TypeScript / Client-side Engine)
 *
 * Implements deep semantic validation referencing the X3D Unified Object Model:
 * 1. DEF/USE Symbol Table & Graph Integrity (detects non-existent DEFs, type mismatches)
 * 2. ROUTE Semantic Integrity (fromNode, toNode, readable/writable fields, data type matching)
 * 3. Container Field Type Hierarchy (-geometry -> X3DGeometryNode, -appearance -> X3DAppearanceNode)
 * 4. AccessType rules (blocks setting outputOnly events in scene files)
 * 5. Vector bounds and exact dimensions
 * 6. Fuzzy typo correction
 */

export interface ValidationDiagnostic {
  severity: 'ERROR' | 'WARNING' | 'INFO';
  rule: string;
  path: string;
  message: string;
  expected?: string;
  actual?: string;
  suggestion?: string;
  schemaComparison?: string; // Shows what generic JSON Schema would have unhelpfully said
}

export interface SymbolTableEntry {
  defName: string;
  nodeType: string;
  path: string;
}

// X3D Vector & Matrix Dimensions
const VECTOR_DIMS: Record<string, number> = {
  SFVec2f: 2, SFVec2d: 2, MFVec2f: 2, MFVec2d: 2,
  SFVec3f: 3, SFVec3d: 3, MFVec3f: 3, MFVec3d: 3,
  SFColor: 3, MFColor: 3,
  SFVec4f: 4, SFVec4d: 4, MFVec4f: 4, MFVec4d: 4,
  SFRotation: 4, MFRotation: 4, SFColorRGBA: 4, MFColorRGBA: 4,
  SFMatrix4f: 16, SFMatrix4d: 16
};

// Abstract Types to Concrete Descendants Hierarchy
const ABSTRACT_DESCENDANTS: Record<string, string[]> = {
  X3DGeometryNode: [
    'Box', 'Sphere', 'Cone', 'Cylinder', 'IndexedFaceSet', 'IndexedLineSet',
    'PointSet', 'ElevationGrid', 'Extrusion', 'Text', 'Arc2D', 'ArcClose2D',
    'Circle2D', 'Disk2D', 'Polyline2D', 'Polypoint2D', 'Rectangle2D',
    'TriangleSet', 'TriangleFanSet', 'TriangleStripSet', 'QuadSet'
  ],
  X3DAppearanceNode: ['Appearance'],
  X3DMaterialNode: ['Material', 'PhysicalMaterial', 'TwoSidedMaterial', 'UnlitMaterial'],
  X3DTextureNode: ['ImageTexture', 'MovieTexture', 'PixelTexture', 'GeneratedCubeMapTexture'],
  X3DTextureTransformNode: ['TextureTransform', 'TextureTransform3D', 'TextureTransformMatrix3D'],
  X3DChildNode: [
    'Shape', 'Transform', 'Group', 'StaticGroup', 'Switch', 'Billboard',
    'Collision', 'LOD', 'Anchor', 'Viewpoint', 'NavigationInfo', 'Background',
    'DirectionalLight', 'PointLight', 'SpotLight', 'Sound', 'TimeSensor',
    'PositionInterpolator', 'OrientationInterpolator', 'ColorInterpolator',
    'ScalarInterpolator', 'CoordinateInterpolator', 'NormalInterpolator',
    'Script', 'Inline', 'WorldInfo', 'ProximitySensor', 'TouchSensor',
    'PlaneSensor', 'CylinderSensor', 'SphereSensor'
  ],
  X3DMetadataObject: [
    'MetadataBoolean', 'MetadataDouble', 'MetadataFloat', 'MetadataInteger',
    'MetadataSet', 'MetadataString'
  ]
};

// Node specifications with fields and access types
interface FieldSpec {
  type: string;
  accessType: 'initializeOnly' | 'inputOutput' | 'inputOnly' | 'outputOnly';
  acceptableNodeTypes?: string[];
  enums?: string[];
}

const COMMON_FIELDS: Record<string, FieldSpec> = {
  DEF: { type: 'SFString', accessType: 'inputOutput' },
  USE: { type: 'SFString', accessType: 'inputOutput' },
  class: { type: 'SFString', accessType: 'inputOutput' },
  id: { type: 'SFString', accessType: 'inputOutput' },
  style: { type: 'SFString', accessType: 'inputOutput' },
  metadata: { type: 'SFNode', accessType: 'inputOutput', acceptableNodeTypes: ['X3DMetadataObject'] }
};

const NODE_SPECS: Record<string, Record<string, FieldSpec>> = {
  Transform: {
    ...COMMON_FIELDS,
    translation: { type: 'SFVec3f', accessType: 'inputOutput' },
    rotation: { type: 'SFRotation', accessType: 'inputOutput' },
    scale: { type: 'SFVec3f', accessType: 'inputOutput' },
    scaleOrientation: { type: 'SFRotation', accessType: 'inputOutput' },
    center: { type: 'SFVec3f', accessType: 'inputOutput' },
    bboxCenter: { type: 'SFVec3f', accessType: 'initializeOnly' },
    bboxSize: { type: 'SFVec3f', accessType: 'initializeOnly' },
    children: { type: 'MFNode', accessType: 'inputOutput', acceptableNodeTypes: ['X3DChildNode'] }
  },
  Shape: {
    ...COMMON_FIELDS,
    geometry: { type: 'SFNode', accessType: 'inputOutput', acceptableNodeTypes: ['X3DGeometryNode'] },
    appearance: { type: 'SFNode', accessType: 'inputOutput', acceptableNodeTypes: ['X3DAppearanceNode'] },
    castShadow: { type: 'SFBool', accessType: 'inputOutput' }
  },
  Box: {
    ...COMMON_FIELDS,
    size: { type: 'SFVec3f', accessType: 'initializeOnly' },
    solid: { type: 'SFBool', accessType: 'initializeOnly' }
  },
  Sphere: {
    ...COMMON_FIELDS,
    radius: { type: 'SFFloat', accessType: 'initializeOnly' },
    solid: { type: 'SFBool', accessType: 'initializeOnly' }
  },
  Cone: {
    ...COMMON_FIELDS,
    bottomRadius: { type: 'SFFloat', accessType: 'initializeOnly' },
    height: { type: 'SFFloat', accessType: 'initializeOnly' },
    bottom: { type: 'SFBool', accessType: 'initializeOnly' },
    side: { type: 'SFBool', accessType: 'initializeOnly' },
    solid: { type: 'SFBool', accessType: 'initializeOnly' }
  },
  Appearance: {
    ...COMMON_FIELDS,
    material: { type: 'SFNode', accessType: 'inputOutput', acceptableNodeTypes: ['X3DMaterialNode'] },
    texture: { type: 'SFNode', accessType: 'inputOutput', acceptableNodeTypes: ['X3DTextureNode'] },
    textureTransform: { type: 'SFNode', accessType: 'inputOutput', acceptableNodeTypes: ['X3DTextureTransformNode'] }
  },
  Material: {
    ...COMMON_FIELDS,
    diffuseColor: { type: 'SFColor', accessType: 'inputOutput' },
    emissiveColor: { type: 'SFColor', accessType: 'inputOutput' },
    specularColor: { type: 'SFColor', accessType: 'inputOutput' },
    ambientIntensity: { type: 'SFFloat', accessType: 'inputOutput' },
    shininess: { type: 'SFFloat', accessType: 'inputOutput' },
    transparency: { type: 'SFFloat', accessType: 'inputOutput' }
  },
  TimeSensor: {
    ...COMMON_FIELDS,
    cycleInterval: { type: 'SFTime', accessType: 'inputOutput' },
    enabled: { type: 'SFBool', accessType: 'inputOutput' },
    loop: { type: 'SFBool', accessType: 'inputOutput' },
    startTime: { type: 'SFTime', accessType: 'inputOutput' },
    stopTime: { type: 'SFTime', accessType: 'inputOutput' },
    fraction_changed: { type: 'SFFloat', accessType: 'outputOnly' },
    time: { type: 'SFTime', accessType: 'outputOnly' },
    cycleTime: { type: 'SFTime', accessType: 'outputOnly' },
    isActive: { type: 'SFBool', accessType: 'outputOnly' },
    isPaused: { type: 'SFBool', accessType: 'outputOnly' }
  },
  PositionInterpolator: {
    ...COMMON_FIELDS,
    key: { type: 'MFFloat', accessType: 'inputOutput' },
    keyValue: { type: 'MFVec3f', accessType: 'inputOutput' },
    set_fraction: { type: 'SFFloat', accessType: 'inputOnly' },
    value_changed: { type: 'SFVec3f', accessType: 'outputOnly' }
  },
  OrientationInterpolator: {
    ...COMMON_FIELDS,
    key: { type: 'MFFloat', accessType: 'inputOutput' },
    keyValue: { type: 'MFRotation', accessType: 'inputOutput' },
    set_fraction: { type: 'SFFloat', accessType: 'inputOnly' },
    value_changed: { type: 'SFRotation', accessType: 'outputOnly' }
  },
  ColorInterpolator: {
    ...COMMON_FIELDS,
    key: { type: 'MFFloat', accessType: 'inputOutput' },
    keyValue: { type: 'MFColor', accessType: 'inputOutput' },
    set_fraction: { type: 'SFFloat', accessType: 'inputOnly' },
    value_changed: { type: 'SFColor', accessType: 'outputOnly' }
  },
  ROUTE: {
    fromNode: { type: 'SFString', accessType: 'inputOutput' },
    fromField: { type: 'SFString', accessType: 'inputOutput' },
    toNode: { type: 'SFString', accessType: 'inputOutput' },
    toField: { type: 'SFString', accessType: 'inputOutput' }
  }
};

// Levenshtein distance for fuzzy typo correction
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function findClosest(target: string, candidates: string[]): string | undefined {
  let closest: string | undefined;
  let minDistance = 3; // Max tolerance
  candidates.forEach(c => {
    const dist = levenshtein(target.toLowerCase(), c.toLowerCase());
    if (dist < minDistance) {
      minDistance = dist;
      closest = c;
    }
  });
  return closest;
}

export class X3DUOMSemanticValidator {
  private diagnostics: ValidationDiagnostic[] = [];
  private symbolTable: Map<string, SymbolTableEntry> = new Map();

  public validate(jsonString: string): {
    valid: boolean;
    errorCount: number;
    warningCount: number;
    diagnostics: ValidationDiagnostic[];
    symbolTable: SymbolTableEntry[];
  } {
    this.diagnostics = [];
    this.symbolTable.clear();

    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e: any) {
      return {
        valid: false,
        errorCount: 1,
        warningCount: 0,
        diagnostics: [{
          severity: 'ERROR',
          rule: 'JSON_SYNTAX_ERROR',
          path: '$',
          message: `JSON Syntax Error: ${e.message}`,
          suggestion: 'Check for unclosed braces, missing quotes, or trailing commas.'
        }],
        symbolTable: []
      };
    }

    if (!parsed || typeof parsed !== 'object') {
      this.diagnostics.push({
        severity: 'ERROR',
        rule: 'ROOT_NOT_OBJECT',
        path: '$',
        message: 'X3D JSON document must be an object at the root.',
        expected: 'JSON Object { "X3D": { ... } }'
      });
      return this.getResult();
    }

    // Pass 1: Build DEF Symbol Table
    this.collectSymbols(parsed, '$');

    // Pass 2: Semantic Graph & Relationship Validation
    this.validateNode(parsed, '$', null, null);

    return this.getResult();
  }

  private collectSymbols(obj: any, path: string): void {
    if (obj && typeof obj === 'object') {
      if (Array.isArray(obj)) {
        obj.forEach((item, idx) => this.collectSymbols(item, `${path}[${idx}]`));
      } else {
        Object.entries(obj).forEach(([key, val]) => {
          const curPath = `${path}.${key}`;
          if (val && typeof val === 'object' && !Array.isArray(val)) {
            const defVal = (val as any)['@DEF'];
            if (defVal) {
              if (typeof defVal !== 'string' || !/^[a-zA-Z_][\w.-]*$/.test(defVal)) {
                this.diagnostics.push({
                  severity: 'ERROR',
                  rule: 'DEF_INVALID_IDENTIFIER',
                  path: `${curPath}.@DEF`,
                  message: `@DEF identifier '${defVal}' is invalid. Must match pattern ^[a-zA-Z_][\\w.-]*$`,
                  expected: '^[a-zA-Z_][\\w.-]*$',
                  actual: String(defVal),
                  suggestion: 'Start with a letter or underscore, avoiding special characters.',
                  schemaComparison: 'JSON Schema only checks regex pattern without verifying cross-node reference integrity.'
                });
              } else if (this.symbolTable.has(defVal)) {
                const prev = this.symbolTable.get(defVal)!;
                this.diagnostics.push({
                  severity: 'WARNING',
                  rule: 'DEF_DUPLICATE',
                  path: `${curPath}.@DEF`,
                  message: `Duplicate @DEF '${defVal}' detected. Previously declared as '${prev.nodeType}' at ${prev.path}.`,
                  suggestion: 'Use unique DEF names across the scene to prevent ambiguous ROUTE or USE bindings.',
                  schemaComparison: 'JSON Schema CANNOT detect duplicate DEF names because it cannot maintain a document symbol table.'
                });
              } else {
                this.symbolTable.set(defVal, {
                  defName: defVal,
                  nodeType: key,
                  path: curPath
                });
              }
            }
          }
          this.collectSymbols(val, curPath);
        });
      }
    }
  }

  private validateNode(obj: any, path: string, parentNode: string | null, parentContainer: string | null): void {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      obj.forEach((item, idx) => this.validateNode(item, `${path}[${idx}]`, parentNode, parentContainer));
      return;
    }

    Object.entries(obj).forEach(([nodeName, nodeBody]: [string, any]) => {
      const curPath = `${path}.${nodeName}`;

      if (nodeName === '#comment') return;

      // Handle Container Fields (-geometry, -appearance, -material, -children, etc.)
      if (nodeName.startsWith('-')) {
        const fieldName = nodeName.slice(1);
        const parentSpec = parentNode ? NODE_SPECS[parentNode] : null;

        if (parentSpec && fieldName !== 'children') {
          const expectedField = parentSpec[fieldName];
          if (!expectedField) {
            const allowed = Object.keys(parentSpec)
              .filter(k => parentSpec[k].acceptableNodeTypes)
              .map(k => `-${k}`);
            this.diagnostics.push({
              severity: 'ERROR',
              rule: 'CONTAINER_UNKNOWN',
              path: curPath,
              message: `Node '${parentNode}' has no container field '${nodeName}'.`,
              expected: allowed.length ? allowed.join(', ') : 'No container fields',
              actual: nodeName,
              suggestion: allowed.length ? `Did you mean '${allowed[0]}'?"` : undefined,
              schemaComparison: 'JSON Schema reports an unhelpful "additionalProperties: false" error with no context.'
            });
          }
        }

        // Recurse into container children
        this.validateNode(nodeBody, curPath, parentNode, nodeName);
        return;
      }

      // Special containers: Scene, head
      if (nodeName === 'Scene' || nodeName === 'head' || nodeName === 'X3D') {
        this.validateNode(nodeBody, curPath, nodeName, null);
        return;
      }

      // Check if known concrete node or statement
      const spec = NODE_SPECS[nodeName];
      if (!spec && nodeName !== 'ROUTE') {
        const knownNodes = Object.keys(NODE_SPECS);
        const closest = findClosest(nodeName, knownNodes);
        this.diagnostics.push({
          severity: 'ERROR',
          rule: 'NODE_UNKNOWN',
          path: curPath,
          message: `Unknown X3D node '${nodeName}'.`,
          actual: nodeName,
          suggestion: closest ? `Did you mean '${closest}'?` : 'Check X3DUOM concrete node specifications.',
          schemaComparison: 'JSON Schema produces a massive 30-branch oneOf failure message instead of identifying the typo.'
        });
        return;
      }

      // Check Container Field Child Compatibility
      if (parentContainer && parentNode) {
        this.checkContainerChildCompatibility(parentNode, parentContainer, nodeName, curPath);
      }

      // Special ROUTE semantic validation
      if (nodeName === 'ROUTE' && typeof nodeBody === 'object' && nodeBody !== null) {
        this.validateRoute(nodeBody, curPath);
      }

      // Validate Node Body Attributes
      if (typeof nodeBody === 'object' && nodeBody !== null) {
        this.validateNodeProperties(nodeName, nodeBody, curPath);
      }
    });
  }

  private checkContainerChildCompatibility(
    parentNode: string,
    parentContainer: string,
    childNode: string,
    path: string
  ): void {
    const containerField = parentContainer.slice(1);
    const parentSpec = NODE_SPECS[parentNode];
    if (!parentSpec) return;

    // Allowed statement children
    const childStatements = ['ROUTE', 'IMPORT', 'EXPORT', 'ProtoDeclare', 'ExternProtoDeclare'];
    if (parentContainer === '-children' && childStatements.includes(childNode)) {
      return;
    }

    const fieldSpec = parentSpec[containerField];
    if (!fieldSpec || !fieldSpec.acceptableNodeTypes) return;

    const allowedAbstracts = fieldSpec.acceptableNodeTypes;
    let isAllowed = false;

    for (const abs of allowedAbstracts) {
      if (childNode === abs) {
        isAllowed = true;
        break;
      }
      const concreteList = ABSTRACT_DESCENDANTS[abs] || [];
      if (concreteList.includes(childNode)) {
        isAllowed = true;
        break;
      }
    }

    if (!isAllowed) {
      const examples = allowedAbstracts.flatMap(a => ABSTRACT_DESCENDANTS[a] || [a]).slice(0, 4);
      this.diagnostics.push({
        severity: 'ERROR',
        rule: 'CONTAINER_CHILD_MISMATCH',
        path,
        message: `Invalid child node '${childNode}' inside container '${parentContainer}' on parent '${parentNode}'.`,
        expected: `Node inheriting from ${allowedAbstracts.join(' | ')} (e.g. ${examples.join(', ')})`,
        actual: childNode,
        suggestion: `Use a valid ${allowedAbstracts[0]} such as ${examples[0] || 'Box'}.`,
        schemaComparison: 'JSON Schema cannot explain inheritance relationships; it only outputs "should match oneOf[1]".'
      });
    }
  }

  private validateNodeProperties(nodeName: string, body: Record<string, any>, path: string): void {
    const spec = NODE_SPECS[nodeName] || COMMON_FIELDS;
    const isUseNode = '@USE' in body;

    // DEF / USE semantic verification
    if (isUseNode) {
      const useVal = body['@USE'];
      if (!useVal || typeof useVal !== 'string') {
        this.diagnostics.push({
          severity: 'ERROR',
          rule: 'USE_EMPTY',
          path: `${path}.@USE`,
          message: '@USE identifier must be a non-empty string.',
          schemaComparison: 'JSON Schema only checks string type.'
        });
      } else if (!this.symbolTable.has(useVal)) {
        const knownDefs = Array.from(this.symbolTable.keys());
        const closest = findClosest(useVal, knownDefs);
        this.diagnostics.push({
          severity: 'ERROR',
          rule: 'USE_TARGET_NOT_FOUND',
          path: `${path}.@USE`,
          message: `Referenced @USE identifier '${useVal}' does not exist in the scene graph.`,
          expected: 'A previously declared DEF identifier',
          actual: useVal,
          suggestion: closest ? `Did you mean '${closest}'?` : 'Declare a matching @DEF earlier in the document.',
          schemaComparison: 'JSON Schema CANNOT check if a DEF exists because JSON Schema has no cross-document symbol table.'
        });
      } else {
        const target = this.symbolTable.get(useVal)!;
        if (target.nodeType !== nodeName && target.nodeType !== 'ProtoInstance' && nodeName !== 'ProtoInstance') {
          this.diagnostics.push({
            severity: 'ERROR',
            rule: 'USE_TYPE_MISMATCH',
            path: `${path}.@USE`,
            message: `@USE '${useVal}' was defined as a '${target.nodeType}', but is being reused in a '${nodeName}' node.`,
            expected: target.nodeType,
            actual: nodeName,
            suggestion: `USE reference node must match defined node type '${target.nodeType}'.`,
            schemaComparison: 'JSON Schema marks this as VALID because both Transform and Box share the generic -USEField schema!'
          });
        }
      }

      // Check for illegal property overrides on USE node
      const illegalKeys = Object.keys(body).filter(k => !['@USE', '@containerField', '#comment', '-children'].includes(k));
      if (illegalKeys.length > 0) {
        this.diagnostics.push({
          severity: 'WARNING',
          rule: 'USE_ILLEGAL_PROPERTIES',
          path,
          message: `USE node defines extra fields (${illegalKeys.join(', ')}). A USE node reuses geometry and cannot override properties.`,
          suggestion: 'Remove property overrides or create a separate DEF node.',
          schemaComparison: 'JSON Schema oneOf structure often hides which property caused the conflict.'
        });
      }
    }

    // Check individual fields
    Object.entries(body).forEach(([k, v]) => {
      if (k === '#comment') return;
      const fieldPath = `${path}.${k}`;

      // Recurse into child container
      if (k.startsWith('-')) {
        this.validateNode(v, fieldPath, nodeName, k);
        return;
      }

      // Check attribute
      if (k.startsWith('@')) {
        const fieldName = k.slice(1);
        const fieldSpec = spec[fieldName];

        if (!fieldSpec) {
          const validAttrs = Object.keys(spec).map(f => `@${f}`);
          const closest = findClosest(k, validAttrs);
          this.diagnostics.push({
            severity: 'ERROR',
            rule: 'FIELD_UNKNOWN',
            path: fieldPath,
            message: `Unknown field '${k}' on node '${nodeName}'.`,
            actual: k,
            suggestion: closest ? `Did you mean '${closest}'?` : undefined,
            schemaComparison: 'JSON Schema emits "additionalProperties: false" without field typo recommendations.'
          });
          return;
        }

        // AccessType authoring check
        if (fieldSpec.accessType === 'outputOnly') {
          this.diagnostics.push({
            severity: 'ERROR',
            rule: 'ACCESS_TYPE_OUTPUT_ONLY',
            path: fieldPath,
            message: `Field '${k}' on '${nodeName}' has accessType 'outputOnly'. Output-only events are generated at runtime and cannot be assigned initial values in the scene graph.`,
            actual: JSON.stringify(v),
            suggestion: 'Use a ROUTE to read output events from this field.',
            schemaComparison: 'JSON Schema only checks types, unable to explain the X3D event-model rationale.'
          });
        }

        // Vector Dimensionality & Types
        this.validateFieldValue(fieldSpec, v, fieldPath);
      }
    });
  }

  private validateFieldValue(fieldSpec: FieldSpec, val: any, path: string): void {
    const ftype = fieldSpec.type;

    // Vector dimensions
    if (VECTOR_DIMS[ftype]) {
      const dim = VECTOR_DIMS[ftype];
      if (!Array.isArray(val)) {
        this.diagnostics.push({
          severity: 'ERROR',
          rule: 'TYPE_NOT_ARRAY',
          path,
          message: `Field of type '${ftype}' must be a JSON array of ${dim} numbers.`,
          expected: `Array of ${dim} numbers`,
          actual: typeof val,
          suggestion: `Provide [${Array(dim).fill(0).join(', ')}]`
        });
        return;
      }

      if (!ftype.startsWith('MF') && val.length !== dim) {
        this.diagnostics.push({
          severity: 'ERROR',
          rule: 'VECTOR_DIMENSION_MISMATCH',
          path,
          message: `Vector of type '${ftype}' requires exactly ${dim} numbers, but got ${val.length}.`,
          expected: `${dim} numbers`,
          actual: `${val.length} numbers`,
          suggestion: `Adjust vector to exactly ${dim} components.`,
          schemaComparison: 'JSON Schema outputs minItems/maxItems failures without semantic vector context.'
        });
      }

      for (let i = 0; i < val.length; i++) {
        if (typeof val[i] !== 'number') {
          this.diagnostics.push({
            severity: 'ERROR',
            rule: 'VECTOR_ITEM_NOT_NUMBER',
            path: `${path}[${i}]`,
            message: `Vector element at index ${i} must be a number, got ${typeof val[i]}.`,
            actual: String(val[i])
          });
          break;
        }
      }
      return;
    }

    // Boolean
    if (ftype === 'SFBool') {
      if (typeof val !== 'boolean') {
        this.diagnostics.push({
          severity: 'ERROR',
          rule: 'TYPE_NOT_BOOLEAN',
          path,
          message: `Field of type 'SFBool' must be true or false, got ${typeof val}.`,
          expected: 'boolean (true / false)',
          actual: String(val)
        });
      }
      return;
    }

    // Numbers (Float, Double, Time)
    if (['SFFloat', 'SFDouble', 'SFTime', 'SFInt32'].includes(ftype)) {
      if (typeof val !== 'number') {
        this.diagnostics.push({
          severity: 'ERROR',
          rule: 'TYPE_NOT_NUMBER',
          path,
          message: `Field of type '${ftype}' must be a number, got ${typeof val}.`,
          expected: 'number',
          actual: String(val)
        });
      }
      return;
    }
  }

  private validateRoute(route: Record<string, any>, path: string): void {
    const fromNode = route['@fromNode'];
    const fromField = route['@fromField'];
    const toNode = route['@toNode'];
    const toField = route['@toField'];

    if (!fromNode || !fromField || !toNode || !toField) {
      this.diagnostics.push({
        severity: 'ERROR',
        rule: 'ROUTE_INCOMPLETE',
        path,
        message: 'ROUTE statement requires @fromNode, @fromField, @toNode, and @toField attributes.',
        suggestion: 'Specify all 4 connection parameters.'
      });
      return;
    }

    // Check fromNode existence
    if (!this.symbolTable.has(fromNode)) {
      const known = Array.from(this.symbolTable.keys());
      const closest = findClosest(fromNode, known);
      this.diagnostics.push({
        severity: 'ERROR',
        rule: 'ROUTE_FROM_NODE_UNDEFINED',
        path: `${path}.@fromNode`,
        message: `ROUTE source node '${fromNode}' does not exist as a defined DEF in the scene graph.`,
        expected: 'A defined DEF node identifier',
        actual: fromNode,
        suggestion: closest ? `Did you mean '${closest}'?` : 'Check the @DEF name of the sender node.',
        schemaComparison: 'JSON Schema CANNOT validate ROUTE graph connectivity because it cannot resolve cross-node references.'
      });
      return;
    }

    // Check toNode existence
    if (!this.symbolTable.has(toNode)) {
      const known = Array.from(this.symbolTable.keys());
      const closest = findClosest(toNode, known);
      this.diagnostics.push({
        severity: 'ERROR',
        rule: 'ROUTE_TO_NODE_UNDEFINED',
        path: `${path}.@toNode`,
        message: `ROUTE destination node '${toNode}' does not exist as a defined DEF in the scene graph.`,
        expected: 'A defined DEF node identifier',
        actual: toNode,
        suggestion: closest ? `Did you mean '${closest}'?` : 'Check the @DEF name of the receiver node.',
        schemaComparison: 'JSON Schema CANNOT validate ROUTE graph connectivity because it cannot resolve cross-node references.'
      });
      return;
    }

    const srcEntry = this.symbolTable.get(fromNode)!;
    const destEntry = this.symbolTable.get(toNode)!;

    const srcSpec = NODE_SPECS[srcEntry.nodeType];
    const destSpec = NODE_SPECS[destEntry.nodeType];

    if (!srcSpec || !destSpec) return;

    // Check fromField readable
    const srcFieldSpec = srcSpec[fromField];
    if (!srcFieldSpec) {
      const readable = Object.keys(srcSpec).filter(f => ['outputOnly', 'inputOutput'].includes(srcSpec[f].accessType));
      const closest = findClosest(fromField, readable);
      this.diagnostics.push({
        severity: 'ERROR',
        rule: 'ROUTE_FROM_FIELD_NOT_FOUND',
        path: `${path}.@fromField`,
        message: `Field '${fromField}' does not exist on source node '${fromNode}' (${srcEntry.nodeType}).`,
        expected: `Readable field on ${srcEntry.nodeType}`,
        actual: fromField,
        suggestion: closest ? `Did you mean '${closest}'?` : `Available: ${readable.slice(0, 4).join(', ')}`,
        schemaComparison: 'JSON Schema is completely blind to whether fromField actually exists on the sender node type.'
      });
      return;
    }

    if (srcFieldSpec.accessType !== 'outputOnly' && srcFieldSpec.accessType !== 'inputOutput') {
      this.diagnostics.push({
        severity: 'ERROR',
        rule: 'ROUTE_FROM_NOT_READABLE',
        path: `${path}.@fromField`,
        message: `Source field '${fromField}' on '${fromNode}' has accessType '${srcFieldSpec.accessType}'. Only 'outputOnly' or 'inputOutput' fields can generate route events.`,
        actual: srcFieldSpec.accessType,
        schemaComparison: 'JSON Schema cannot inspect event model permissions.'
      });
    }

    // Check toField writable
    const destFieldSpec = destSpec[toField];
    if (!destFieldSpec) {
      const writable = Object.keys(destSpec).filter(f => ['inputOnly', 'inputOutput'].includes(destSpec[f].accessType));
      const closest = findClosest(toField, writable);
      this.diagnostics.push({
        severity: 'ERROR',
        rule: 'ROUTE_TO_FIELD_NOT_FOUND',
        path: `${path}.@toField`,
        message: `Field '${toField}' does not exist on destination node '${toNode}' (${destEntry.nodeType}).`,
        expected: `Writable field on ${destEntry.nodeType}`,
        actual: toField,
        suggestion: closest ? `Did you mean '${closest}'?` : `Available: ${writable.slice(0, 4).join(', ')}`,
        schemaComparison: 'JSON Schema is completely blind to whether toField exists on the destination node type.'
      });
      return;
    }

    if (destFieldSpec.accessType !== 'inputOnly' && destFieldSpec.accessType !== 'inputOutput') {
      this.diagnostics.push({
        severity: 'ERROR',
        rule: 'ROUTE_TO_NOT_WRITABLE',
        path: `${path}.@toField`,
        message: `Destination field '${toField}' on '${toNode}' has accessType '${destFieldSpec.accessType}'. Only 'inputOnly' or 'inputOutput' fields can receive route events.`,
        actual: destFieldSpec.accessType,
        schemaComparison: 'JSON Schema cannot inspect event model permissions.'
      });
    }

    // Verify Data Type Compatibility
    if (srcFieldSpec.type !== destFieldSpec.type) {
      this.diagnostics.push({
        severity: 'ERROR',
        rule: 'ROUTE_TYPE_MISMATCH',
        path,
        message: `ROUTE type mismatch: '${fromNode}.${fromField}' (${srcFieldSpec.type}) cannot connect to '${toNode}.${toField}' (${destFieldSpec.type}). Event data types must match.`,
        expected: srcFieldSpec.type,
        actual: destFieldSpec.type,
        suggestion: `Insert an interpolator or Script node to convert ${srcFieldSpec.type} to ${destFieldSpec.type}.`,
        schemaComparison: 'JSON Schema CANNOT perform cross-node ROUTE type checking. This fatal runtime bug passes JSON Schema unnoticed!'
      });
    }
  }

  private getResult() {
    const errorCount = this.diagnostics.filter(d => d.severity === 'ERROR').length;
    const warningCount = this.diagnostics.filter(d => d.severity === 'WARNING').length;
    return {
      valid: errorCount === 0,
      errorCount,
      warningCount,
      diagnostics: this.diagnostics,
      symbolTable: Array.from(this.symbolTable.values())
    };
  }
}
