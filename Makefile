.PHONY: deps up down clean format lint test test-unit test-integration test-e2e test-e2e-firefox test-e2e-postgres check-coverage cli seed build-preview up-static up-docker down-docker seed-docker up-postgres download-exelearning-editor

# Variables
BUN = bun
EXELEARNING_EDITOR_DIR = apps/api/static/exelearning-editor
EXELEARNING_EDITOR_REPO = exelearning/exelearning

# Default target
all: up

deps:
	$(BUN) install

up: deps seed ensure-exelearning-editor
	$(BUN) run dev

# Descarga el editor solo si no existe
ensure-exelearning-editor:
	@if [ ! -f $(EXELEARNING_EDITOR_DIR)/index.html ]; then \
		$(MAKE) download-exelearning-editor; \
	else \
		echo "Editor eXeLearning ya descargado."; \
	fi

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

up-static: deps ensure-exelearning-editor build-preview
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

# eXeLearning: descarga el editor estático desde la última release de GitHub
download-exelearning-editor:
	@echo "Descargando editor estático de eXeLearning..."
	@mkdir -p $(EXELEARNING_EDITOR_DIR)
	@RELEASE_URL=$$(curl -s "https://api.github.com/repos/$(EXELEARNING_EDITOR_REPO)/releases/latest" \
		| grep -o '"browser_download_url": *"[^"]*exelearning-static[^"]*\.zip"' \
		| head -1 \
		| cut -d'"' -f4); \
	if [ -z "$$RELEASE_URL" ]; then \
		echo "Error: No se encontró el asset exelearning-static en la última release."; \
		echo "Buscando cualquier .zip..."; \
		RELEASE_URL=$$(curl -s "https://api.github.com/repos/$(EXELEARNING_EDITOR_REPO)/releases/latest" \
			| grep -o '"browser_download_url": *"[^"]*\.zip"' \
			| head -1 \
			| cut -d'"' -f4); \
	fi; \
	if [ -z "$$RELEASE_URL" ]; then \
		echo "Error: No se encontró ningún .zip en la release."; \
		exit 1; \
	fi; \
	echo "Descargando: $$RELEASE_URL"; \
	curl -L -o /tmp/exelearning-static.zip "$$RELEASE_URL"; \
	echo "Extrayendo en $(EXELEARNING_EDITOR_DIR)/..."; \
	rm -rf $(EXELEARNING_EDITOR_DIR)/*; \
	unzip -o -q /tmp/exelearning-static.zip -d $(EXELEARNING_EDITOR_DIR); \
	rm /tmp/exelearning-static.zip; \
	echo "Editor eXeLearning descargado en $(EXELEARNING_EDITOR_DIR)/"

# Docker
up-docker:
	docker compose up --build -d

down-docker:
	docker compose down

seed-docker:
	docker compose run --rm seed
