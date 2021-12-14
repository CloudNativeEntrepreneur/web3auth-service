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