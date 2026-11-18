COMPOSE := docker compose -f docker-compose.yaml
SERVICE ?=

.PHONY: infra dev dev-build dev-logs prod prod-build prod-logs down
.PHONY: dev-logs-% prod-logs-% dev-build-% prod-build-%

infra:
	$(COMPOSE) up -d

dev:
	$(COMPOSE) -f docker-compose.dev.yaml up -d
	$(COMPOSE) -f docker-compose.dev.yaml up -d --force-recreate nginx

dev-build:
	$(COMPOSE) -f docker-compose.dev.yaml up -d --build $(SERVICE)
	$(COMPOSE) -f docker-compose.dev.yaml up -d --force-recreate nginx

dev-build-%:
	$(COMPOSE) -f docker-compose.dev.yaml up -d --build $*
	$(COMPOSE) -f docker-compose.dev.yaml up -d --force-recreate nginx

dev-logs:
	$(COMPOSE) -f docker-compose.dev.yaml logs -f $(SERVICE)

dev-logs-%:
	$(COMPOSE) -f docker-compose.dev.yaml logs -f $*

prod:
	$(COMPOSE) -f docker-compose.prod.yaml up -d
	$(COMPOSE) -f docker-compose.prod.yaml up -d --force-recreate nginx

prod-build:
	$(COMPOSE) -f docker-compose.prod.yaml up -d --build $(SERVICE)
	$(COMPOSE) -f docker-compose.prod.yaml up -d --force-recreate nginx

prod-build-%:
	$(COMPOSE) -f docker-compose.prod.yaml up -d --build $*
	$(COMPOSE) -f docker-compose.prod.yaml up -d --force-recreate nginx

prod-logs:
	$(COMPOSE) -f docker-compose.prod.yaml logs -f $(SERVICE)

prod-logs-%:
	$(COMPOSE) -f docker-compose.prod.yaml logs -f $*

down:
	docker compose -p pharmacy-otc down
