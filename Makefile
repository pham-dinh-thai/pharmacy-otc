COMPOSE := docker compose -f docker-compose.yaml

.PHONY: infra dev dev-build prod prod-build down

infra:
	$(COMPOSE) up -d

dev:
	$(COMPOSE) -f docker-compose.dev.yaml up -d
	$(COMPOSE) -f docker-compose.dev.yaml up -d --force-recreate nginx

dev-build:
	$(COMPOSE) -f docker-compose.dev.yaml up -d --build
	$(COMPOSE) -f docker-compose.dev.yaml up -d --force-recreate nginx

prod:
	$(COMPOSE) -f docker-compose.prod.yaml up -d
	$(COMPOSE) -f docker-compose.prod.yaml up -d --force-recreate nginx

prod-build:
	$(COMPOSE) -f docker-compose.prod.yaml up -d --build
	$(COMPOSE) -f docker-compose.prod.yaml up -d --force-recreate nginx

down:
	docker compose -p pharmacy-otc down
