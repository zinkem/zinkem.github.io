---
layout: post
title: Docker Cheatsheet
date: 2020-05-14 17:58:00 -0700
---
{% raw %}
# Container Lifecycle

```
$ docker run \
  -h {{hostname}}
  -e {{environment_variables}}
  -v {{host_volume}}:{{container_path}} \
  -p {{host_port}}:{{container_port}} \
  {{#detach}} -d {{/detatch}}
  IMAGE[:TAG|@DIGEST] \
  [COMMAND] [ARG...] \
```
Run a container
  - `-h` Container hostname in docker network
  - `-e` Environment Variables
  - `-v` Mount this directory inside the container
  - `-p` Port forwarding, `host_port` is as entered in a browser
  - `-d` Detatch. This prevents docker from stealing your terminal.

```
$ docker stop \
  -t0 \
  {{container_name}}
```
Stop container immediately (no timeout)

# Visibility

```
# view running containers
$ docker ps

# view all containers
$ docker ps -a
```
Container visibility, `-a` to see stopped containers.

```
$ docker images
```
List all images

```
$ docker network ls
```
list networks

```
$ docker volume ls
```

# Cleanup

```
$ docker system prune -a
```
This will remove:
  - all stopped containers
  - all networks not used by at least one container
  - all images without at least one container associated to them
  - all build cache

```
$ docker volume ls
$ docker volume prune
```
Volumes are *not* cleared by the first command.

> If you are on Docker 17.06.1 or higher and want to also prune volumes,
add the --volumes flag:
```
$ docker system prune --volumes
```

{% endraw %}
[Official](https://docs.docker.com/config/pruning/)
