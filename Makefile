up:
	docker-compose up -d

down:
	docker-compose down --remove-orphans

dev-docker-compose:
	DATABASE_SYNC=true npm run dev

install:
	npm ci

dev:
	-tmux new-session -d -s web3auth-example
	tmux send-keys -t web3auth-example 'tmux new-window -n web3auth-db-psql-port-forward ' ENTER
	tmux send-keys -t web3auth-example "tmux send-keys -t  web3auth-db-psql-port-forward 'kubectl port-forward web3auth-db-postgresql-0 5434:5432' ENTER" ENTER
	./scripts/run-using-local-dev-cluster-db.sh

onboard: install dev