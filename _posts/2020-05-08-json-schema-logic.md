---
layout: post
title: Logic expressed in JSON-Schema
date: 2020-05-08 5:14:57 -0700
---

# Logic expressed in JSON-Schema
(`{ if: {}, then: {} }` considering harmful)

The allOf, oneOf, and anyOf operators can be used to manipulate schema, and by proxies schema categories by applying some generic logical operations to the schema. 'oneOf' acts like xor, 'allOf' acts like and, and 'anyOf' acts like or. This can give us a sort of intuition for how schema should operate.

Assume access to the following schema that defines our categories. These
definitions represent a set of *Terminal Symbols*. The sets defined in these
terminals are guaranteed to have elements that do not contain other categories.
If a schema is built up from these elements, composition of non-sensical or
circular schemas is impossible.

In recursion, these terminals would contain the base cases.

```javascript
const schema_table = {
  id: 'schema_table',
  definitions: {
    counting_number: {
      type: 'integer'
    },
    conditional: {
      type: 'boolean'
    },
    letters: {
      type: 'string'
    },
    symbol: {
      type: 'string',
      regex: '[a-Z0-9]*'
    },
    digits: {
      type: 'string',
      regex: '[0-9]*'
    },
    word: {
      type: 'string',
      regex: '[a-Z]*'
    },
    important_words: {
      type: 'string',
      enum: [ 'food', 'water', 'sleep' ]
    },
    selected_primes: {
      type: 'integer',
      enum: [ 2, 3, 5, 7, 11, 13, 17, 19, 131 ]
    },
    selected_fibonacci: {
      type: 'integer',
      enum: [ 1, 2, 3, 5, 8, 13, 21 ]
    }
  }
}
```
These categories will be used in JSON Schema operator examples below.

# oneOf
[Definition](https://json-schema.org/understanding-json-schema/reference/combining.html)
*Must be valid against exactly one of the subschemas.*

- Exactly one schema must pass
- Multiple passing schemas (i.e. overlapping categories) result in errors
- No passing schema results in a validation error

*Exclusive OR, XOR*

Those already familiar with digital logic, or predicate logic, may already be
aware of XOR's significance.
All other logical operators can be built up from XOR.

```javascript
const choice_schema = {
  oneOf: [
    { '$ref': 'schema_table#/definitions/counting_number'},
    { '$ref': 'schema_table#/definitions/conditional'},
    { '$ref': 'schema_table#/definitions/word'}
  ]
}
```
JSON Schema validators do not limit the schemas that can be listed in a `oneOf`,
however if two schemas describe overlapping sets, the intersection of those sets
will be disallowed.

The next example shows a oneOf with overlapping categories.
```javascript
const remove_subset_schema = {
  oneOf: [
    { '$ref': 'schema_table#/definitions/counting_number'},
    { '$ref': 'schema_table#/definitions/selected_primes'},
  ]
}
```
This filters out selected primes and shows one way to implement subtraction
from a set.

Since Validation here provides a exclusive or, not both/all, just one.
Adding more schemas that identify *category subsets* to the operation will
remove them from the larger category.
If the schema author is not careful however, they may *also* be adding more
objects to the validation set.
```javascript
const not_intersection_schema = {
  oneOf: [
    { '$ref': 'schema_table#/definitions/selected_primes'},
    { '$ref': 'schema_table#/definitions/selected_fibonacci'},
  ]
}
```
This example excludes the intersection of these sets from passing: 2, 3, 5,
and 13.
It also combines the elements outside the intersection (7, 11, 17, 19, 131
and 1, 8, 21) into a single category.
Again, the schema author is responsible for managing knowledge of these
categories in their particular schema.

---

`oneOf` provides runtime protection against ambiguous schema, and the validator
compiler will not reject `oneOf` definitions that contain intersecting schemas.
This is an intended behavior, even though it may have some surprising results.

Runtime validation errors, however, can be frustating for the developer to
handle properly because it is not often clear which category of objects the user
intended to submit.
Often, runtime validation errors are then forwarded directly to the user, who
also cannot make sense of multiple validation errors.
Then for the user, it may not be clear how to change the input to make it pass
the correct schema and the user inherits the frustration.
Which of these schemas actually gives be the behavior I want? What the heck do
these errors even say?

Some of these problems can be alleviated in development by properly packaging
validation errors in an easier to read manner than a printout of the error,
verbatim from the validator.
It is not always transparent to the developer *who* will be using their software,
however, and shortcuts are often taken if the end user can be taught to read the
errors.
The work of API Designers and UX Developers to craft guidelines for mapping the
software domain to the user's domain could help here.

In practice, the matching reference type could be used to provide a form of
reflection to the caller but validators do not always track references or
return any such information to the user about the validation results.
It is often the author of the validating program to manage these concerns.

The schema oneOf element must be first decomposed, and a validator compiled for
each. Based on which schema validation passes, the process can choose a path.

Making the schemas mutually exclusive can help, and may be critical.
Using a
[type discriminator](https://swagger.io/docs/specification/data-models/inheritance-and-polymorphism/)
(such as a `class` property), the most relevant error message can be passed to
the user and ensures schema validation will be mutually exclusive.
If there is no discriminator value that matches to a discriminator in `oneOf`, the
user can be provided a different error message that enumerates acceptable
discriminator values.

The discriminator names the Cateogory or validation process that let it through,
allowing the developer to branch on the discriminator property alone, also
enabling the creation of new categories for the service to use at other critical
branch points.

Mutual exclusivity of sets:
  - Responsibility of the schema author
  - Enhances predictability of `input -> process` mappings
  - A discriminator property can be used to simplify creation of non-overlapping
    categories
  - If sets are not mutually exclusive, oneOf subtracts all intersections from
    the union of the provided categorys.

# anyOf
[Definition](https://json-schema.org/understanding-json-schema/reference/combining.html)
*Must be valid against any of the subschemas*

- At least one schema must pass
- Does not exclude intersections
- Union of categories

*Non-exclusive OR, logical OR*

This property maps to traditional `OR` in logic.

```javascript
const optional_schema = {
  anyOf: [
    { type: 'number' },
    { type: 'boolean' },
    { type: 'string' }
  ]
}
```
In practice, this can be used to create validation on unions of sets

`anyOf` is fairly forgiving, allowing in all objects that pass any of the
schemas.

# allOf
[Definition](https://json-schema.org/understanding-json-schema/reference/combining.html)
*Must be valid against all of the subschemas*

- Objects must pass validation on all listed schemas
- A single failing validation results in an error
- Using `allOf` with mutually exclusive categories results in an empty category

*Intersection, AND, logical AND*

Represents the intersection of all listed schemas.

*Impossible!*
```javascript
const impossible_required_schema = {
  allOf: [
    { type: 'number' },
    { type: 'boolean' },
    { type: 'string' }
  ]
}
```
Schemas listed in an `allOf` must share a single possible JSON type, since they
must pass all of the schemas listed in the array. This is a logical AND applied
to categories.
```javascript
const possible_required_schema = {
  allOf: [
    { '$ref': 'schema_table#/definitions/selected_fibonacci' },
    { '$ref': 'schema_table#/definitions/selected_prime_strings' }
  ]
}
```
This allows 2, 3, 5, and 13. An intersection of sets. Inverse of set defined by not_intersection_schema.

## Closing thoughts

*JSON Schema validates Objects*
  - An object is a set
  - Sets can be manipulated using logical operators

*An object is a set of key value pairs*
  - whose values can be other sets (objects)
  - an array can be an 'unkeyed' set
    - a set has no duplicates
    - is not sensitive to order, does not need to be orderable

An *array* can be a *set*, a *list*, or a *tuple*

A *list* is an
  - unbounded array
  - consisting of potentially many types
  - order of types does not matter any more than the elements themselves

A *tuple* is a length bounded array, with a prescribed category at each index

A *sequence* is like a tuple, with no bound

A *dictionary* is an object with arbitrary keys, and values that belong to a particular category.

What are the most interesting ways to construct logic around these basic
Categories of data?
