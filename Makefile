up:
	docker-compose up -d

down:
	docker-compose down --remove-orphans

install:
	npm ci

dev:
	npm run dev

onboard: install dev