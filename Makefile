.PHONY: deps up clean format lint test test-unit test-integration test-e2e test-e2e-firefox test-e2e-postgres check-coverage cli seed

# Variables
BUN = bun

# Default target
all: up

deps:
	$(BUN) install
	$(BUN) x playwright install --with-deps

up: deps seed
	$(BUN) run dev

up-api:
	$(BUN) run dev:api

up-frontend:
	$(BUN) run dev:frontend

clean:
	rm -rf node_modules
	rm -rf .coverage
	rm -rf dist
	rm -rf build
	rm -rf playwright-report
	rm -rf test-results
	find . -name "*.log" -type f -delete

format:
	$(BUN) run format

lint:
	$(BUN) run lint

test: test-unit test-integration test-e2e check-coverage

test-unit:
	$(BUN) test --coverage *_test.ts *.test.ts *unit.test.ts **/*unit.test.ts || true

test-integration:
	$(BUN) test --coverage *integration.test.ts **/*integration.test.ts || true

test-e2e:
	$(BUN) run test:e2e

test-e2e-firefox:
	$(BUN) run test:e2e:firefox

test-e2e-postgres:
	@echo "Starting PostgreSQL for E2E tests..."
	@docker compose -f e2e/docker-compose.postgres.yml up -d --wait
	@echo "Running E2E tests with PostgreSQL..."
	@DATABASE_URL="postgres://e2e_user:e2e_password@localhost:5432/e2e_db" $(BUN) run test:e2e; \
	RET=$$?; \
	docker compose -f e2e/docker-compose.postgres.yml down -v; \
	if [ $$RET -ne 0 ]; then false; fi

check-coverage:
	$(BUN) run check-coverage

cli:
	$(BUN) run --filter '@procomeka/cli' cli -- $(ARGS)

seed:
	$(BUN) run --filter '@procomeka/cli' cli -- seed
