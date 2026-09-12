#!/bin/sh
cd /opt/xpi-bd && git pull && docker compose up -d --build
