#!/bin/bash

sudo chown -R node:node node_modules .nuxt .output

yarn --frozen-lockfile
