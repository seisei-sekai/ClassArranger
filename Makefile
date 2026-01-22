.PHONY: help setup dev build clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

setup: ## Initial project setup
	@echo "Setting up project..."
	cp .env.example .env
	@echo "Setup complete. Run 'make dev' to start."

dev: ## Start development environment with Docker Compose
	docker-compose up --build

dev-frontend: ## Start frontend development server
	cd frontend && npm run dev

dev-backend: ## Start backend development server
	cd backend && source venv/bin/activate && uvicorn app.main:app --reload

build: ## Build Docker images
	docker-compose build

clean: ## Clean up containers and images
	docker-compose down -v
	docker system prune -f

test-frontend: ## Run frontend tests
	cd frontend && npm run lint && npm run build

lint: ## Run linters
	cd frontend && npm run lint

logs-backend: ## View backend logs
	docker-compose logs -f backend

logs-frontend: ## View frontend logs
	docker-compose logs -f frontend

logs-mongodb: ## View MongoDB logs
	docker-compose logs -f mongodb

status: ## Check service status
	docker-compose ps
