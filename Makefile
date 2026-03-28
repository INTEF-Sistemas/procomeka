.PHONY: deps up down clean format lint test test-unit test-integration test-e2e test-e2e-firefox test-e2e-postgres check-coverage cli seed build-preview up-static up-docker down-docker seed-docker up-postgres

# Variables
BUN = bun

# Default target
all: up

deps:
	$(BUN) install

up: deps seed
	$(BUN) run dev

down:
	-@lsof -ti:3000 | xargs kill 2>/dev/null
	-@lsof -ti:4321 | xargs kill 2>/dev/null
	@echo "Servicios detenidos"

up-api:
	$(BUN) run dev:api

up-frontend:
	$(BUN) run dev:frontend

# Preview estático: construye y sirve localmente como lo haría GitHub Pages
build-preview:
	cd apps/frontend && PREVIEW_STATIC=true PREVIEW_BASE=/procomeka/ $(BUN) run build:preview
	@# Crear estructura de subpath para servir localmente
	@rm -rf apps/frontend/.preview-serve
	@mkdir -p apps/frontend/.preview-serve/procomeka
	@cp -r apps/frontend/dist/* apps/frontend/.preview-serve/procomeka/

up-static: deps build-preview
	@echo "Sirviendo preview estático en http://localhost:8080/procomeka/"
	@cd apps/frontend/.preview-serve && python3 -m http.server 8080

clean:
	rm -rf .coverage
	rm -rf dist
	rm -rf build
	rm -rf playwright-report
	rm -rf test-results
	rm -rf local-data
	rm -rf apps/frontend/.preview-serve
	find . -name "*.log" -type f -delete

format:
	$(BUN) run format

lint:
	$(BUN) run lint

test:
	$(BUN) run test

test-standard:
	$(BUN) run test:standard

test-unit:
	@echo "Running unit tests..."
	$(BUN) run test:unit

test-integration:
	@echo "Running integration tests..."
	$(BUN) run test:integration

test-all: test test-e2e

test-e2e:
	@echo "Checking E2E browser environment (chromium)..."
	$(BUN) run test:e2e:preflight chromium
	@echo "Running E2E tests (chromium)..."
	$(BUN) run test:e2e

test-e2e-firefox:
	@echo "Checking E2E browser environment (firefox)..."
	$(BUN) run test:e2e:preflight firefox
	@echo "Running E2E tests (firefox)..."
	$(BUN) run test:e2e:firefox

test-e2e-postgres:
	@echo "Starting PostgreSQL for E2E tests..."
	@docker compose -f e2e/docker-compose.postgres.yml up -d --wait
	@echo "Checking E2E browser environment (chromium)..."
	@$(BUN) run test:e2e:preflight chromium
	@echo "Running E2E tests with PostgreSQL..."
	@DATABASE_URL="postgres://e2e_user:e2e_password@localhost:5432/e2e_db" $(BUN) run test:e2e; \
		RET=$$?; \
		docker compose -f e2e/docker-compose.postgres.yml down -v; \
	if [ $$RET -ne 0 ]; then false; fi

check-coverage:
	@echo "Checking coverage threshold..."
	$(BUN) run check-coverage

cli:
	$(BUN) run --filter '@procomeka/cli' cli -- $(ARGS)

seed:
	$(BUN) run --filter '@procomeka/cli' cli -- seed

up-postgres: deps
	@echo "Levantando PostgreSQL en Docker para desarrollo local..."
	@docker compose up -d --wait db
	@echo "Ejecutando seed sobre PostgreSQL real..."
	@DATABASE_URL="postgres://procomeka:procomeka@localhost:5432/procomeka" \
		$(BUN) run --filter '@procomeka/cli' cli -- seed
	@echo "Arrancando API + frontend local con PostgreSQL real..."
	@DATABASE_URL="postgres://procomeka:procomeka@localhost:5432/procomeka" \
		FRONTEND_URL="http://localhost:4321" \
		BETTER_AUTH_URL="http://localhost:4321" \
		$(BUN) run dev

# Docker
up-docker:
	docker compose up --build -d

down-docker:
	docker compose down

seed-docker:
	docker compose run --rm seed
