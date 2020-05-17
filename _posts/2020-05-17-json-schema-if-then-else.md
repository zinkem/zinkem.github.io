---
layout: post
title: if-then-else
date: 2020-05-17 03:58:01 -0700
---

Opinions are my own.

`{ if: {}, then: {}, else: {} }` considered harmful?
or: How I Learned to Stop Worring and Love JSON Schema.

## if, then, else

In general, the usefulness of specific idioms such as `if-then-else` cannot be denied.
These idioms can flatten the structure and make schema more ergonomic to write,
especially for domain experts who are not programmers.
However, it obscures understanding.
Explainations like [this one](https://stackoverflow.com/questions/51539586/how-do-i-use-the-if-then-else-condition-in-json-schema) and [this one](https://json-schema.org/understanding-json-schema/reference/conditionals.html) left me
scratching my head.

It is arguably more convenient for schema authors to learn this syntax.
Mostly because it fits a traditional way of thinking for developers.
It may depend on the perspective of the learner, however, and developers are
not the only target audience of JSON Schema.

```yaml
if: A
then: B
else: C
```
Are these schemas *actually* equivalent?
```yaml
oneOf:
  - allOf:
      - A
      - B
  - C
```
The answer is... it depends.

The inclusion of `if-then-else` clause was hotly [debated](https://github.com/json-schema-org/json-schema-spec/issues/180), and I did not understand it for some time.
We see that it is basically a wrapper around an `allOf`, from the `if-then` example,
and a `oneOf`, to provide exclusivity with the `else` schema. The comments go
into academic debates about the nature of declarative programming, and what
control flow is and isn't.

Observant readers will notice my reduction of `if-then-else` is different than
the one proposed in the issue--- the difference in examples reveals the problem clearly.

My reduction assumes schema describes categories of objects, not validation processes.
[AJV's author](https://github.com/epoberezkin) provides an example that will
evaluate lazily, preventing a potentially expensive validation on the `else`
clause-- in my reduction, `C` will *always* be validated against.

While it may be true the validation implementation is imperative today,
processes that involve control flow metaphors prevent compatibility with
possible near-future concurrent and parallel validation techniques. The parse
may be top down today, but what if it is bottom up in the future?

By coupling the schema specificaiton process to particular tools, JSON Schema
could find itself with heaps of undefined behavior.
Behaviors like this place an extra burden on devlopers and maintainers-- tool maintainers have to support them and build around inconsistencies between tools.

> Ajv version 6.0.0 that supports draft-07 is released. It may require either migrating your schemas or updating your code (to continue using draft-04 and v5 schemas, draft-06 schemas will be supported without changes).

This work is not cheap to do, up to this point ajv has been a labor of love.
[Evgeny Poberezkin](https://github.com/epoberezkin) is now, at the time of writing,
asking for funding to continue development.

Using lean subsets of JSON Schema syntax might mean less maintainence long term.
Draft specification changes are not the only way the ecosystem can evolve,
and the tools are already very capable as they exist today.
Any tool is welcome to extend the schema, but beware of ecosystem compatibility
and potential maintainence costs when making custom modifications.

### Closing Remarks

By supporting a carefully chosen set of operations with particular traits, the
complexity of specifying canonical schemas, defining schema manipulations, and
design of domain specific idioms is much more manageable.
This is the ultimate goal of building declarative APIs.

If the schema needs to be in a certain form for the tool to best work, the tool should be responsible for those transformations, not the user.

`if-then-else` may be encouraging developers to write performance optimizations into
their schemas. This is not a good declarative experience.
Ultimately, proper optimization depends heavily on the runtime environment.

Schema should be approachable for non experts who may not be familiar with
imperative control flow.
Teaching a newcomer what a Declarative API is, and then falling back on
imperative idioms when things get a little rough is sending mixed messages to the
user and the community.

They may be left asking "Is declarative actually an improvement or just some
academic buzzword that can't be reified in the real world?"
