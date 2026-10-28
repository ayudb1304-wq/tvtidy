# Use the repo venv when there is one (python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt).
PYTHON ?= $(if $(wildcard .venv/bin/python),$(CURDIR)/.venv/bin/python,python3)

.PHONY: sync build test helper

sync:
	$(PYTHON) scripts/sync_upstream.py

build:
	cd site && npm run build

test:
	$(PYTHON) -m pytest
	cd site && npm test

helper:
	cd helper && $(PYTHON) -m tvtidy_helper
