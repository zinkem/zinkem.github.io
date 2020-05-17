---
layout: post
title: Mermaid Diagrams (as Code)
date: 2020-05-06 21:44:37 -0700
---

[mermaid.js](https://mermaid-js.github.io/)

Mermaid is a handy tool for creating diagrams with text quickly.
Much work has been put into it lately as more objects and diagrams have been
added.
There is also a great [VScode extension](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid) for rendering mermaid into markdown.

It can be extremely useful for visualizing and documenting source code in very
spartan environments.
Starting from simple bash commands with lists of files, patterns in several
languages can be grepped for and processed.

This example shows a process for getting a high level overview of a new codebase
in javascript. `npm ls` may show the module structure, but I am unaware of
any way to get a quick and dirty picture of how files *within* a module are
related without loading up an expensive IDE.

For Node.js modules, they use require. We can grep for `require(`:

```sh
grep 'require(' **/*.js
```
When done on the `request` npm module, we get something like this:
```sh

$ npm install request
$ cd node_modules/request
$ grep 'require(' **/*.js
index.js:var extend = require('extend')
index.js:var cookies = require('./lib/cookies')
index.js:var helpers = require('./lib/helpers')
index.js:request.Request = require('./request')
lib/auth.js:var caseless = require('caseless')
lib/auth.js:var uuid = require('uuid/v4')
lib/auth.js:var helpers = require('./helpers')
lib/cookies.js:var tough = require('tough-cookie')
lib/har.js:var fs = require('fs')
lib/har.js:var qs = require('querystring')

                   ...

request.js:var Querystring = require('./lib/querystring').Querystring
request.js:var Har = require('./lib/har').Har
request.js:var Auth = require('./lib/auth').Auth
request.js:var OAuth = require('./lib/oauth').OAuth
request.js:var hawk = require('./lib/hawk')
request.js:var Multipart = require('./lib/multipart').Multipart
request.js:var Redirect = require('./lib/redirect').Redirect
request.js:var Tunnel = require('./lib/tunnel').Tunnel
request.js:var now = require('performance-now')
request.js:var Buffer = require('safe-buffer').Buffer
$
```
This is a list of all of `request`s internal dependencies, as well as which
files depend on external APIs.
It is a tightly scoped and well organized module.
Internal dependencies are mainly used by request.js and index.js, the graph of
dependencies is fairly flat.

If we examine the lines, we can see that `request.js`, for example, has an
external depency on `./lib/oauth`.
```sh
request.js:var OAuth = require('./lib/oauth').OAuth
```
What we want is to translate these lines into mermaid.js graph syntax.
```
request.js --> './lib/oauth'
```
`:var OAuth = require(` becomes ` --> ` and the remainder of the string is truncated.
Everything between the colon and the word 'require' is fairly arbitrary.

The following script can make this transformation.
This can be useful for diving into a new project and getting a quick overview of the structure, or communicating it to other developers.
There may be a surefire way to parse this information from the code, but this
will yield 80% of the reslts with 20% of the effort.
```javascript
/*
* this script takes the output of : grep 'require(' and turns it into a
* mermaid dependency graph for the request module  
* this will not work on all npm modules, but it might be a good start
*/

const buffer = [];
process.stdin.on('data', (data) => {
  buffer.push(data.toString('utf8'));
})

process.stdin.on('end', () => {
  buffer.join('')
    .split('\n')
    .map(line => {
      const top = line.split(':')
      const current = top[0];
      if(!top[1]) process.exit(0);
      const slicePoint = top[1].indexOf('require(') + 8;
      let dep = top[1].slice(slicePoint).split(')')[0];

      if(dep.indexOf('./') === 1)
        dep = dep.slice(0,dep.length-1) + ".js'"

      process.stdout.write(`'./${current}' --> ${dep}\n`);
    })
})
```
Save the above code as `translate.js`.
```sh
grep 'require(' **/*.js | node translate.js
```
Running the line above yields this output, which can be copied into VScode and previewed:
```mermaid
graph LR
  './foo.js' --> '
  './index.js' --> 'extend'
  './index.js' --> './lib/cookies.js'
  './index.js' --> './lib/helpers.js'
  './index.js' --> './request.js'
  './lib/auth.js' --> 'caseless'
  './lib/auth.js' --> 'uuid/v4'
  './lib/auth.js' --> './helpers.js'
  './lib/cookies.js' --> 'tough-cookie'
  './lib/har.js' --> 'fs'
  './lib/har.js' --> 'querystring'
  './lib/har.js' --> 'har-validator'
  './lib/har.js' --> 'extend'
  './lib/hawk.js' --> 'crypto'
  './lib/helpers.js' --> 'json-stringify-safe'
  './lib/helpers.js' --> 'crypto'
  './lib/helpers.js' --> 'safe-buffer'
  './lib/multipart.js' --> 'uuid/v4'
  './lib/multipart.js' --> 'combined-stream'
  './lib/multipart.js' --> 'isstream'
  './lib/multipart.js' --> 'safe-buffer'
  './lib/oauth.js' --> 'url'
  './lib/oauth.js' --> 'qs'
  './lib/oauth.js' --> 'caseless'
  './lib/oauth.js' --> 'uuid/v4'
  './lib/oauth.js' --> 'oauth-sign'
  './lib/oauth.js' --> 'crypto'
  './lib/oauth.js' --> 'safe-buffer'
  './lib/querystring.js' --> 'qs'
  './lib/querystring.js' --> 'querystring'
  './lib/redirect.js' --> 'url'
  './lib/tunnel.js' --> 'url'
  './lib/tunnel.js' --> 'tunnel-agent'
  './request.js' --> 'http'
  './request.js' --> 'https'
  './request.js' --> 'url'
  './request.js' --> 'util'
  './request.js' --> 'stream'
  './request.js' --> 'zlib'
  './request.js' --> 'aws-sign2'
  './request.js' --> 'aws4'
  './request.js' --> 'http-signature'
  './request.js' --> 'mime-types'
  './request.js' --> 'caseless'
  './request.js' --> 'forever-agent'
  './request.js' --> 'form-data'
  './request.js' --> 'extend'
  './request.js' --> 'isstream'
  './request.js' --> 'is-typedarray'
  './request.js' --> './lib/helpers.js'
  './request.js' --> './lib/cookies.js'
  './request.js' --> './lib/getProxyFromURI.js'
  './request.js' --> './lib/querystring.js'
  './request.js' --> './lib/har.js'
  './request.js' --> './lib/auth.js'
  './request.js' --> './lib/oauth.js'
  './request.js' --> './lib/hawk.js'
  './request.js' --> './lib/multipart.js'
  './request.js' --> './lib/redirect.js'
  './request.js' --> './lib/tunnel.js'
  './request.js' --> 'performance-now'
  './request.js' --> 'safe-buffer'
```
Mermaid diagrams can also be templated, and common code structures
can be easily mapped to mermaid diagrams.

Consider the following exxample:
```
graph LR
  module1 --> module2
  module2 --> module4
  module3 --> module4
```
We could template one of these modules if it is variable, such as a database:
```
{% raw %}graph LR
  module1 --> module2
  module2 --> {{database}}
  module3 --> {{database}}{% endraw %}
```
This affords us a visual representation of replacable modules, and the module structure itself. That can be quickly used in a documentation repository.

We could map out an entire service with mermaid, easily updating the visual documentation when a part is swapped out:
```
{% raw %}graph LR
  {{gw}} --> {{api}}
  {{api}} --> {{database}}
  {{nginx}} --> {{static_files}}
  {{nginx}} --> {{auth_backend}}
  {{auth_backend}} --> {{mgmt_db}}
  {{ingress_controller}} --> {{gw}}{% endraw %}
```
An example FAST template that might represent a common pattern in an infrastructure:
```yaml
{% raw %}parameters:
  gw: nginx
  api: PaymentsAPI
  static_files: ShoppingCartWebClient
  auth_backend: OAuth
  ingress_controller: BigIpVE
  mgmt_db: MongoDB
template: |
  graph LR
    {{gw}} --> {{api}}
    {{api}} --> {{database}}
    {{gw}} --> {{static_files}}
    {{api}} --> {{auth_backend}}
    {{auth_backend}} --> {{mgmt_db}}
    {{ingress_controller}} --> {{gw}}{% endraw %}
```
