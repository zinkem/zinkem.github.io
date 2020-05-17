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
`{ if: {}, then: {}, else: {} }` considered harmful?

The inclusion of `if-then-else` clause is debated.
Not many tools understand it, or can parse it.
We see that it is basically a wrapper around an `allOf`, from the `if-then` example,
and a `oneOf`, to provide exclusivity with the `else` schema.

Adding structured `if-else` logic to the schema does not break json schema, and likewise is does not increase JSON Schema's capability.
It is more convenient for the schema author, but features like this place an
extra burden on the tool author. The maintainer has to support an extra feature
for their tool to work.

We've seen some fracturing of the community, and the tools, in the jump from JSON Schema Draft-4 to Draft-7, where this feature was added.

If JSON Schema itself manages to stay lean, fewer property features will be
needed by the tools. Any tool is welcome to extend the schema, but the author
of the extended schema must be prepared to support conversion to a lower level
syntax for integration with other tools. The community of course is free to choose
their own path, I would recommend sticking to Draft-4 while experimenting with
the newer properties.

The usefulness of specific idioms such as if-then-else cannot be denied, but the
question is if every user of JSON Schema needs these idioms or not. I do not
believe if-then-else is *necessary* and in some cases fosters the impression
that there is an imperative structure to schema validation.

By supporting a smaller set of homogenous and orthogonal operations, the
complexity of specifying canonical schemas, defining schema manipulations, and
designing domain specific idioms is more managable and can be left to domain
experts utilizing schema composition tools.
By packing the base specification with too many features that
do not improve the capability of the system, we are wasting maintainence cycles
on work that could have been used to better serve client domains effectively.

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
  anyOf:
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

Do you know of any build tools that manage and solve these problems?
Reply on Twitter!

<blockquote class="twitter-tweet" data-theme="dark"><p lang="en" dir="ltr">Summary of Logical Operators in JSON Schema, with examples of Category Construction <a href="https://twitter.com/hashtag/JSON?src=hash&amp;ref_src=twsrc%5Etfw">#JSON</a> <a href="https://twitter.com/hashtag/API?src=hash&amp;ref_src=twsrc%5Etfw">#API</a> <a href="https://t.co/8nvx4w2JVb">https://t.co/8nvx4w2JVb</a></p>&mdash; Matthew (@zinkemp) <a href="https://twitter.com/zinkemp/status/1261720285050355712?ref_src=twsrc%5Etfw">May 16, 2020</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
