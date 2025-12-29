.PHONY: all build clean test chaincode network api

# Go parameters
GOCMD=go
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get
GOMOD=$(GOCMD) mod

# Binary names
API_BINARY=cityflow-api

# Directories
CHAINCODE_DIR=chaincode
API_DIR=cmd/api
BUILD_DIR=build

all: deps build

deps:
	$(GOMOD) download
	$(GOMOD) tidy

build: build-api

build-api:
	mkdir -p $(BUILD_DIR)
	$(GOBUILD) -o $(BUILD_DIR)/$(API_BINARY) ./$(API_DIR)

clean:
	$(GOCLEAN)
	rm -rf $(BUILD_DIR)

test:
	$(GOTEST) -v ./...

# Chaincode packaging
package-chaincode:
	@echo "Packaging chaincode..."
	cd $(CHAINCODE_DIR)/user && $(GOMOD) tidy && $(GOMOD) vendor
	cd $(CHAINCODE_DIR)/parking && $(GOMOD) tidy && $(GOMOD) vendor
	cd $(CHAINCODE_DIR)/charging && $(GOMOD) tidy && $(GOMOD) vendor
	cd $(CHAINCODE_DIR)/wallet && $(GOMOD) tidy && $(GOMOD) vendor

# Network commands
network-up:
	cd network && ./start.sh

network-down:
	cd network && ./stop.sh

network-clean:
	cd network && ./cleanup.sh

# Run API server
run-api:
	$(GOBUILD) -o $(BUILD_DIR)/$(API_BINARY) ./$(API_DIR)
	./$(BUILD_DIR)/$(API_BINARY)

# Development
dev:
	$(GOCMD) run ./$(API_DIR)

# Docker commands
docker-build:
	docker build -t cityflow-api:latest -f Dockerfile .

docker-run:
	docker run -p 8080:8080 cityflow-api:latest
