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

Adding structured `if-else` logic to the schema does not break json schema, but
also does not increase JSON Schema's capability.
It is more convenient for the schema author, but features like this place an
extra burden on devlopers and maintainers.
Tool maintainers have to support these extra features.

> Ajv version 6.0.0 that supports draft-07 is released. It may require either migrating your schemas or updating your code (to continue using draft-04 and v5 schemas, draft-06 schemas will be supported without changes).

This work is not cheap to do, up to this point ajv was in particular has been
written in the spare time of
[Evgeny Poberezkin](https://github.com/epoberezkin),
who is, at the time of writing, asking for funding to continue development.

Using lean subsets of JSON Schema syntax might mean less maintainence long term.
Draft specification changes are not the only way the ecosystem can be improved,
and the tools are very capable as they exist today.
Any tool is welcome to extend the schema, but beware of ecosystem compatibility
and potential maintainence costs when making custom modifications.

The usefulness of specific idioms such as `if-then-else` cannot be denied, but
in some cases it obscures understanding.
Explainations like [this one](https://stackoverflow.com/questions/51539586/how-do-i-use-the-if-then-else-condition-in-json-schema) and [this one](https://json-schema.org/understanding-json-schema/reference/conditionals.html) do not inspire confidence.
Discussion of *applying* schemas introduces an imperative metaphor where none
is needed.
Is `if-then-else` is *necessary* for all users in all domains?

By supporting a carefully chosen set of homogenous operations, the
complexity of specifying canonical schemas, defining schema manipulations, and
designing domain specific idioms is much more manageable.

## Building NAND

From a certain perspective, `NAND` is the fundamental gate. All other basic
logical operations can be built somewhat simply from `NAND`.

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
