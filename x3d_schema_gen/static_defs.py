"""
Static definitions for standard X3D JSON Schema constructs.
Includes child statement rules, USE field specifications, and spatial reference (geoSystem) definitions.
"""

from typing import Any, Dict

STATIC_DEFS: Dict[str, Dict[str, Any]] = {
    "-childStatements": {
        "title": "Child statements and comments",
        "description": "Child statements and comments",
        "type": "array",
        "minItems": 1,
        "items": {
            "type": "object",
            "properties": {
                "#comment": {
                    "type": "string"
                },
                "ROUTE": {
                    "$ref": "#/$defs/ROUTE"
                },
                "IMPORT": {
                    "$ref": "#/$defs/IMPORT"
                },
                "ProtoDeclare": {
                    "$ref": "#/$defs/ProtoDeclare"
                },
                "ExternProtoDeclare": {
                    "$ref": "#/$defs/ExternProtoDeclare"
                },
                "EXPORT": {
                    "$ref": "#/$defs/EXPORT"
                }
            },
            "additionalProperties": False
        }
    },
    "-NamedUSEField": {
        "title": "Named USE Field",
        "description": "A USE field with a @name field",
        "type": "object",
        "properties": {
            "-children": {
                "type": "array",
                "minItems": 1,
                "items": {
                    "type": "object",
                    "properties": {
                        "#comment": {
                            "description": "#comment statements are the only allowed in -children node when using a USE field",
                            "type": "string"
                        }
                    },
                    "additionalProperties": False
                }
            },
            "@USE": {
                "type": "string",
                "pattern": "^[a-zA-Z_][\\w.-]*$",
                "$comment": "SFString inputOutput"
            },
            "@name": {
                "type": "string",
                "$comment": "SFString inputOutput"
            },
            "@class": {
                "type": "string",
                "$comment": "SFString inputOutput"
            },
            "@containerField": {
                "type": "string",
                "$comment": "NMTOKEN inputOutput"
            }
        },
        "required": [
            "@USE",
            "@name"
        ],
        "additionalProperties": False
    },
    "-USEField": {
        "title": "USE Field",
        "description": "A USE field",
        "type": "object",
        "properties": {
            "-children": {
                "type": "array",
                "minItems": 1,
                "items": {
                    "type": "object",
                    "properties": {
                        "#comment": {
                            "description": "#comment statements are the only allowed in -children node when using a USE field",
                            "type": "string"
                        }
                    },
                    "additionalProperties": False
                }
            },
            "@USE": {
                "type": "string",
                "pattern": "^[a-zA-Z_][\\w.-]*$",
                "$comment": "SFString inputOutput"
            },
            "@class": {
                "type": "string",
                "$comment": "SFString inputOutput"
            },
            "@containerField": {
                "type": "string",
                "$comment": "NMTOKEN inputOutput"
            }
        },
        "required": [
            "@USE"
        ],
        "additionalProperties": False
    },
    "@geoSystem": {
        "$comment": "Spatial reference system: Geodetic, UTM, or Geocentric",
        "oneOf": [
            {
                "$ref": "#/$defs/@geoSystem-GD"
            },
            {
                "$ref": "#/$defs/@geoSystem-UTM"
            },
            {
                "$ref": "#/$defs/@geoSystem-GC"
            }
        ]
    },
    "@geoSystem-GD": {
        "title": "GD",
        "$comment": "Spatial reference system (GD) Geodetic (latitude, longitude, elevation)",
        "type": "array",
        "minItems": 1,
        "maxItems": 3,
        "prefixItems": [
            {
                "type": "string",
                "enum": [
                    "GD"
                ]
            },
            {
                "$ref": "#/$defs/@geoSystem-ellipsoid"
            }
        ],
        "items": {
            "type": "string",
            "enum": [
                "latitude_first",
                "longitude_first"
            ]
        }
    },
    "@geoSystem-UTM": {
        "type": "array",
        "minItems": 2,
        "maxItems": 3,
        "prefixItems": [
            {
                "type": "string",
                "enum": [
                    "UTM"
                ]
            },
            {
                "$ref": "#/$defs/@geoSystem-UTM-zone"
            }
        ],
        "items": {
            "$ref": "#/$defs/@geoSystem-ellipsoid"
        },
        "if": {
            "prefixItems": [
                {
                    "type": "string",
                    "enum": [
                        "UTM"
                    ]
                },
                {
                    "type": "string",
                    "pattern": "^Z(0?[1-9]|[1-5][0-9]|60)[NS]$"
                }
            ]
        },
        "then": {
            "prefixItems": [
                {
                    "type": "string",
                    "enum": [
                        "UTM"
                    ]
                },
                {
                    "type": "string",
                    "pattern": "^Z(0?[1-9]|[1-5][0-9]|60)[NS]$"
                },
                {
                    "type": "string",
                    "enum": [
                        "northing_first",
                        "easting_first"
                    ]
                }
            ],
            "items": False
        }
    },
    "@geoSystem-GC": {
        "title": "GC",
        "$comment": "Spatial reference system (GC) Earth-centered Cartesian coordinates",
        "type": "array",
        "minItems": 1,
        "maxItems": 2,
        "prefixItems": [
            {
                "type": "string",
                "enum": [
                    "GC"
                ]
            },
            {
                "$ref": "#/$defs/@geoSystem-ellipsoid"
            }
        ],
        "items": False
    },
    "@geoSystem-ellipsoid": {
        "title": "Ellipsoid code",
        "$comment": "Standard ellipsoid code or earth-radius value",
        "type": "string",
        "default": "WGS84",
        "enum": [
            "AA", "AM", "AN", "BN", "BR", "CC", "CD", "CP", "EA", "EB",
            "EC", "ED", "EE", "EF", "FA", "HE", "HO", "ID", "IN", "KA",
            "RF", "SA", "WD", "WE", "WGS84"
        ]
    },
    "@geoSystem-UTM-zone": {
        "title": "UTM zone number",
        "$comment": "Zone 1–60 prefixed with Z. Leading zero is optional: Z1 and Z01 are both valid.",
        "type": "string",
        "pattern": "^Z(0?[1-9]|[1-5][0-9]|60)$"
    }
}
