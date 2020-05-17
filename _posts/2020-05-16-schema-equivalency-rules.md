---
layout: post
title: Schema Equivalency Rules
date: 2020-05-16 13:18:31 -0700
---

# Schema Equivalency Rules

These are some equivalence rules for JSON schema.
The examples presented aim to show how schemas can be manipulated without
altering the validation set.
By examining these transformations, we hope to get a better understanding of
how objects relate to their representation in JSON Schema.

Schema represented in YAML for convenience.

Assume variables such as A, B, and C are references to Categories defined in a
definitions table.
For sake of brevity, the definitions table is not provided.

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

The properties can be broken down and the schema can then be composed ala carte.
`properties` is an example of a type specific property that can't really be
reduced any further.

Each type, other than booleans have their own properties for defining sub-types
and cannot be generalized.

type | property | creates
---|---|---
`string` | `regex` | string subsets
`number`,`integer` | `minimumValue`, `maximumValue` | bounded domains
`array` | `items` | tuples, sequences, typed lists
`object` | `properties`,`additionalProperties` | objects, dictionaries

## not

The `not` property *can* be built out of logical operators, however.
```yaml
not: A
```
becomes
```yaml
oneOf:
  - {}
  - A
```
`{}` represents the entire catgory of acceptable JSON Schema objects. When A
is true, this will return false. When A is false, this will return true.

## if, then
```yaml
if: A
then: B
```
reduces to
```yaml
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
[Further discussion]({% post_url 2020-05-17-json-schema-if-then-else %})

## Building NAND

From a certain perspective, `NAND` is the fundamental gate. All other basic
logical operations can be built somewhat simply from `NAND`.
I don't know if this schema snippet is particularly useful, it might be, but the
exercise demonstrates that complex operations are possible with few operations.

`NAND` Truth Table

`A` | `B` | `NAND`
---|---|---
`false` | `false` | `true`
`true` | `false` | `true`
`false` | `true` | `true`
`true` | `true` | `false`

Another way of saying 'not allOf':
```yaml
not:
  allOf:
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
{% raw %}
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
id: {{left_category}}_nand_{{right_category}}
title: {{left_category}} nand {{right_category}}
description: passes only when none of the sub elements pass.
type: object
definitions:
  nand:
    not:
      - anyOf:
        - $ref: {{left_category}}
        - $ref: {{right_category}}
$ref: nand{% endraw %}
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
{% endraw %}
References can of course be followed by the application, and loaded into the
validator with some code. Some libraries are available to do this.

* [json-schema-ref-parser](https://www.npmjs.com/package/json-schema-ref-parser)
* [json-schema-traverse](https://www.npmjs.com/package/json-schema-traverse)

Such libraries could be used to hot-load concrete category schemas into purpose
built validation structures. Features like `if-then-else` could be implemented in
such a higher level system targetting a particular domain audience and use case.
This would ease the burden on tool builders who must support the entire
specification.

---

Is `if-then-else` *necessary* for all users in all domains?

Do you know of any build tools that manage and solve these problems?

Reply on Twitter!

<blockquote class="twitter-tweet" data-theme="dark"><p lang="en" dir="ltr">Summary of Logical Operators in JSON Schema, with examples of Category Construction <a href="https://twitter.com/hashtag/JSON?src=hash&amp;ref_src=twsrc%5Etfw">#JSON</a> <a href="https://twitter.com/hashtag/API?src=hash&amp;ref_src=twsrc%5Etfw">#API</a> <a href="https://t.co/8nvx4w2JVb">https://t.co/8nvx4w2JVb</a></p>&mdash; Matthew (@zinkemp) <a href="https://twitter.com/zinkemp/status/1261720285050355712?ref_src=twsrc%5Etfw">May 16, 2020</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
