---
layout: post
title: Logic expressed in JSON-Schema
date: 2020-05-08 5:14:57 -0700
---

# Logic expressed in JSON-Schema
(`{ if: {}, then: {} }` considering harmful)

The allOf, oneOf, and anyOf operators can be used to manipulate schema, and by proxies schema categories by applying some generic logical operations to the schema. 'oneOf' acts like xor, 'allOf' acts like and, and 'anyOf' acts like or. This can give us a sort of intuition for how schema should operate.

Assume we have the following schema that we draw our categories from. These
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

exclusive choice (exclusive or, xor)
- only one schema can be chosen, exactly one schema must pass
- multiple passing schemas (i.e. overlapping categories) are errors
- if no schema passes, this is a validation error

```javascript
const choice_schema = {
  oneOf: [
    { '$ref': 'schema_table#/definitions/counting_number'},
    { '$ref': 'schema_table#/definitions/conditional'},
    { '$ref': 'schema_table#/definitions/word'}
  ]
}
```

JSON Schema validators do not limit the schemas that can be listed in a oneOf,
however if two schemas describe overlapping sets, the intersection of those sets
will be disallowed.

In practice, the matching reference type can be used to provide a form of reflection to the caller: based on which schema validates, I can choose a behavior. oneOf provides a guard against ambiguous schema, this can be frustating for the user if they recieve multiple validation errors for a particular input. It may not be clear how to change the input to make it pass only one schema.

Making the schemas mutually exclusive can help. Using a [type discriminator](https://swagger.io/docs/specification/data-models/inheritance-and-polymorphism/) (such as a `class` property), the most relevant error message can be passed to the user and ensures the schemas are mutually exclusive. If there is no discriminator value that matches to a discriminator in oneOf, the user can be provided a different error message that enumerates acceptable discriminator values.

The next example shows a oneOf with overlapping categories.
```javascript
const remove_subset_schema = {
  oneOf: [
    { '$ref': 'schema_table#/definitions/counting_number'},
    { '$ref': 'schema_table#/definitions/selected_primes'},
  ]
}
```

This filters out selected primes, this is one way to implement subtraction
from a set. Reflection is not useful in this particular example, because only a subset of a type is allowed.

Validation here provides an exclusive or, not both/all, just one. Applying this operation in chains, using intersecting schemas, will remove elements from the category.  


```javascript
const not_intersection_schema = {
  oneOf: [
    { '$ref': 'schema_table#/definitions/selected_primes'},
    { '$ref': 'schema_table#/definitions/selected_fibonacci'},
  ]
}
```
this excludes the intersection of these sets, 2, 3, 5, and 13 from passing, but it adds 7, 11, 17, 19, 131 and 1, 8, 21 into an unambiguous category. If there are fuzzy rules for processing ambiguous inputs, in this case 2, 3, 5, and 13, the input must be passed to another system for complex handling.  

### in summary

- planned mutual exclusivity of sets is a plus, more predictable
- a discriminator can be used to provide choice, and match behavior
- if sets are not mutually exclusive, oneOf subtracts intersections from the provided categorys.


# anyOf

multiple choice, non exclusive (logical or)
any number of choices can be included
when rendering templates -- templates that do not pass the schema would not be rendered
```javascript
const optional_schema = {
  anyOf: [
    { type: 'number' },
    { type: 'boolean' },
    { type: 'string' }
  ]
}
```
in practice, this can be used to create validation on unions of sets

anyOf is fairly forgiving... bringing sets of inputs together
may be easy to unintentionally allow bad objects in complex schemas

# allOf

*impossible!*
```javascript
const impossible_required_schema = {
  allOf: [
    { type: 'number' },
    { type: 'boolean' },
    { type: 'string' }
  ]
}
```
Schemas listed in an "allOf" must share the same JSON type, they must pass all of the schemas listed in the array. This is a logical and applied to categories.
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

*An object is a set of key value pairs*
  - whose values can be other sets (objects)
  - an array can be an 'unkeyed' set
    - a set has no duplicates
    - is not sensitive to order, does not need to be orderable

an *array* can be a *set*, a *list*, or a *tuple*


a *list* is an
  - unbounded array
  - consisting of potentially many types
  - order of types does not matter any more than the elements themselves

a *tuple* is a length bounded array, with a prescribed category at each index

a *dictionary* is an object with arbitrary keys, and values that belong to a particular category.
