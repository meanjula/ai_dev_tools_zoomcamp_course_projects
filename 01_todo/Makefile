# ============================================
# Django + uv Makefile
# ============================================

VENV = .venv
PY = uv run python

# --------------------------------------------
# Environment Setup
# --------------------------------------------

venv:
	uv venv $(VENV)

activate:
	@echo "Activate the virtual environment:"
	@echo "  source $(VENV)/bin/activate"

install:
	uv pip install -r requirements.txt

freeze:
	uv pip freeze > requirements.txt

# --------------------------------------------
# Django Commands
# --------------------------------------------

run:
	$(PY) manage.py runserver

migrate:
	$(PY) manage.py migrate

makemigrations:
	$(PY) manage.py makemigrations

shell:
	$(PY) manage.py shell

# --------------------------------------------
# Testing
# --------------------------------------------

test:
	$(PY) manage.py test

# --------------------------------------------
# Cleanup
# --------------------------------------------

clean:
	find . -type d -name "__pycache__" -exec rm -r {} +

clean-venv:
	rm -rf $(VENV)

reset: clean clean-venv
