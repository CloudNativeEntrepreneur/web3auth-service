LOCAL_DEV_CLUSTER ?= rancher-desktop
NOW := $(shell date +%m_%d_%Y_%H_%M)
SERVICE_NAME := web3auth-service
DEBUG ?= web3auth*,knativebus*,example*

up:
	docker-compose up -d

down:
	docker-compose down --remove-orphans

dev-docker-compose:
	DATABASE_SYNC=true PG_HOST=localhost npm run dev

install:
	npm ci

dev:
	./scripts/run-using-local-dev-cluster-db.sh

onboard: install create-env-file

create-env-file:
	./scripts/create-env-file.sh

open:
	code .
