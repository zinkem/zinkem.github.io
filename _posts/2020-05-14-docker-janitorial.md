---
layout: post
title: Docker Janitorial
date:   2020-05-15 00:58:00 -0700
---

# Cleaning up after docker

```
$ docker system prune -a

WARNING! This will remove:
  - all stopped containers
  - all networks not used by at least one container
  - all images without at least one container associated to them
  - all build cache

```
