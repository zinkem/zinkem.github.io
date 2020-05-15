---
layout: post
title: JSON Schema Equivalency
date:   2020-05-07 12:58:00 -0700
---

# Equivalent Schema

Schemas that describe the same Category, or validation set, are said to be equivalent.

Schema can contain many extraneous properties and structures that result in different descriptions of the same sets. Consider the following:
```json
{
  "type": "object",
  "properties": {
    "key": {
      "type": "string",
      "regex": "[a-Z]*"
    },
    "value": {
      "type": "string"
    }
  }
}
```
and:
```json
{
  "type": "object",
  "definitions": {
    "key": {
      "type": "string",
      "regex": "[a-Z]*"
    },
    "value": {
      "type": "string"
    }
  },
  "allOf": [
    { "$ref": "#/definitions/key" },
    { "$ref": "#/definitions/value" }    
  ]
}
```
Both schemas describe the same category. One schema uses the properties keyword to define object properties within a particular scope, and the other schema uses allOf to combine sub-categories into a single set.

To further confuse things, these approaches can be mixed to yield a third, equivalent representation:
```json
{
  "type": "object",
  "properties": {
    "key": {
      "type": "string",
      "regex": "[a-Z]*"
    }    
  },
  "definitions": {
    "value": {
      "type": "string"
    }
  },
  "allOf": [
    { "$ref": "#/definitions/value" }      
  ]
}
```
We can apply many changes to a schema that do not change its category.

Note the allOf operator can be nested ad infinitum, ad nauseum, without changing the underlying validation set:
```json
{
  "allOf": [{
    "allOf": [{
      "allOf": [{
        "allOf": [
          { "type":"object" }
        ]
      }]
    }]
  }]
}
```
No matter how many allOfs, oneOfs, anyOfs in the chain, it all reduces to:
```json
{ "type" : "object "}
```

This observation produces an equivalence rule:
```javascript
{ "allOf": [ {} ] } === {}
```
Applying this rule to the former schema four times produces a more elegant representation of the validation set. Is this a minimal representation of the validation set?

Chains of references have a similar effect as the previous nested allOf example.
Obesrving one `$ref` chain reveals a similar rule:

```javascript
{
  "definitions" : {
    "schema0": {}  
    "schema1": { "$ref": "#/definitions/schema0" },
      ...
    "schemaN": { "$ref": "#/definitions/schemaN-1" },
  },
  "$ref" : "#/definitions/schemaN"  
} === {}
```
Shown another way:
```javascript
{
  "definitions" : {
    "port": {
      "type":"integer",
      "maximumValue": 65535,
      "minimumValue": 0
    },
    "tcp_port": { "$ref": "#/definitions/port" },
    "http_port": { "$ref" ; "#/definitions/tcp_port" },
  },
  "$ref" : "#/definitions/http_port"  
} === {
  "type":"integer",
  "maximumValue": 65535,
  "minimumValue": 0
}
```
No matter how many naked references we follow, the schema is unaltered.

We have established that many schema representations provide equivalent validation sets, and that rules exist to remove no-ops from the schema representation. Can a canonical schema be defined for a given validation set?
