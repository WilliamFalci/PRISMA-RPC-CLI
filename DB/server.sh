#!/bin/bash
command="$*"
docker-compose --env-file ../CLI/env/.env $command