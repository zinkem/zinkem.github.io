---
layout: post
title: Categories in JSON schema
date:   2020-05-07 12:58:00 -0700
---

JSON-schema is an invaluable tool for providing input validation to rest APIs and other JavaScript processes. It provides a hierarchical way of organizing validation on parts of JSON objects, and builds those up into a top level schema for parsing whole objects. All objects in schema are themselves valid JSON-schema on their own.

So what exactly is JSON-Schema descibing? JSON objects, right?

When we write schema, we often think in terms of a few valid JSON objects we want to accept, and use some intuition based on experience to craft a schema that allows those things in, and keeps the bad things out. We are actually defining an entire set of JSON objects, and in many cases, these sets are infinite. Consider accepting an array of arbitrary size or an integer as a property in a schema.

Discussions around schema are then mired in confusion, and sometimes participants are left asking what is actually being discussed? Are we discussing a concrete object, or a class of objects, what the heck is a class anyway?

Well we know what a schema is. We know the syntax of the thing it's validating. But the thing its validating can take on many forms, and one must build an intuition to shape the acceptable forms.

First, lets define this thing we're talking about:

*A _validation set_ for a particular schema is the set of all JSON objects that pass validation of that schema. If a JSON object passes schema validation, it is a member of that schema's validation set. Every schema describes a validation set and complex schemas can broken down into subsets.*

A validation set is simply the set of all objects that pass validation for a given schema. Sometimes we might refer to these as *types*, but the new term is useful to avoid confusion with the JSON-schema `type` property. JSON property types, as they are described in JSON schema, are the primitives used to build up a validation set.

This idea should be natural coming from OOP languages, Java has primitives and classes are defined from primitives. Classes define sets of possible object instances. JavaScript also has it's own definition of a class, which is compatible with this view of the world.

There is another word we can use from abstract algebra to describe these validation sets, *categories*.

*A _Category_ for a particular schema is the set of all JSON objects that pass validation of that schema. If a JSON object passes schema validation, it is a member of set that forms a Category or many Categories. Every schema describes a Category, and its properties can be broken down into subsets of Categories.*
