---
layout: post
title: Schema Equivalency Rules
date: 2020-05-16 1:18:31 -0700
---

# Schema Equivalency Rules

These are some equivalence rules for JSON schema. We reduce common patterns down
to schema logical operations on minimal concrete categories.
Some reductions will make it obvious why the case
was handled in JSON Schema syntax, some will illuminate schema semantics, but
all are useful for building a *canonical* representation of a category.

Schema represented in YAML for convenience.

Assume variables such as A, B, and C are references to Categories defined in a
definitions table.
For sake of brevity, example definitions table are not provided.

## object
```yaml
type: object
properties:
  foo: A
  bar: B
  baz: C
```
reduces to:
```yaml
allOf:
  - type: object
    properties:
      foo: A
  - type: object
    properties:
      foo: B
  - type: object
    properties:
      foo: C
```

## not
```yaml
not: A
```
reduces to
```yaml
oneOf:
  - A
  - A
```
This one may not be obvious, we are trying to *invert* A.

If we pass in an object in the A's category, it should fail.
Lets see what happens.
```yaml
oneOf:
  - PASS
  - PASS
---
FAIL
```
If we pass in something outside of A's category...
```yaml
oneOf:
  - FAIL
  - FAIL
---
FAIL
```

## if, then
```yaml
if: A
then: B
```
reduces to
```
allOf:
  - A
  - B
```

## if, then, else
```yaml
if: A
then: B
else: C
```
reduces to
```yaml
oneOf:
  - allOf:
      - A
      - B
  - C
```

## Building NAND

From a certain perspective, `NAND` is the fundamental gate. All other operations
can be built somewhere simply from `NAND`.

`A` | `B` | `NAND`
---|---|---
`false` | `false` | `true`
`true` | `false` | `false`
`false` | `true` | `false`
`true` | `true` | `false`

Another way of saying 'not and' *and* 'not or' is 'not any of':
```yaml
not:
  - anyOf:
    - A
    - B
```
Lets put this into a schema...
```yaml
title: nand
description: passes only when none of the sub elements pass.
type: object
definitions:
  nand:
    not:
      - anyOf:
        - A
        - B
$ref: nand
```
Now we will run into another problem... this isn't generalizable, I need to
repeat this idiom all over my schema, with A and B concretely defined!

It would be nice to be able to pass in a reference and generate the schema
snippet. We could template the snippet:
```yaml
title: {{left_category}} nand {{right_category}}
description: passes only when none of the sub elements pass.
type: object
definitions:
  nand:
    not:
      - anyOf:
        - {{left_category}}
        - {{right_category}}
$ref: nand
```
This can be parameterized with a template:
```yaml
$id: {{left_category}}_nand_{{right_category}}
title: {{left_category}} nand {{right_category}}
description: passes only when none of the sub elements pass.
type: object
definitions:
  nand:
    not:
      - anyOf:
        - $ref: {{left_category}}
        - $ref: {{right_category}}
$ref: nand
```
Passing the following context/view:
```yaml
left_category: 'schemaId#/definitions/typeA'
right_category: 'schemaId#/definitions/typeB'
```
...into a ctemplates style renderer:
```yaml
$id: {{left_category}}_nand_{{right_category}}
title: schemaId#/definitions/typeA nand schemaId#/definitions/typeB
description: passes only when none of the sub elements pass.
$id: schemaId#/definitions/typeA_nand_schemaId#/definitions/typeB
type: object
definitions:
  nand:
    not:
      - anyOf:
        - $ref: schemaId#/definitions/typeA
        - $ref: schemaId#/definitions/typeB
$ref: '#/definitions/nand'
```


Do you know of any build tools that manage and solve these problems?
Reply on Twitter!

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Summary of Logical Operators in JSON Schema, with examples of Category Construction <a href="https://twitter.com/hashtag/JSON?src=hash&amp;ref_src=twsrc%5Etfw">#JSON</a> <a href="https://twitter.com/hashtag/API?src=hash&amp;ref_src=twsrc%5Etfw">#API</a> <a href="https://t.co/8nvx4w2JVb">https://t.co/8nvx4w2JVb</a></p>&mdash; Matthew (@zinkemp) <a href="https://twitter.com/zinkemp/status/1261720285050355712?ref_src=twsrc%5Etfw">May 16, 2020</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
