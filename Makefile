.PHONY: build deploy down dev


help:	
	@echo "Service launch commands"
	@echo "	build - build container"
	@echo "	deploy - launch container"
	@echo "	down - stop container"
	@echo "	dev - start service locally"


build:
	docker compose build

deploy:
	docker compose up -d

down:
	docker compose down

dev:
	npm run dev
