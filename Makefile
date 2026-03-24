.PHONY: deps up clean format lint test test-unit test-integration test-e2e check-coverage

# Variables
BUN = bun

# Default target
all: up

deps:
	$(BUN) install

up:
	$(BUN) run dev

clean:
	rm -rf node_modules
	rm -rf .coverage
	rm -rf dist
	rm -rf build
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
	$(BUN) test --coverage *e2e.test.ts **/*e2e.test.ts || true

check-coverage:
	$(BUN) run check-coverage
