build:
	./node_modules/.bin/browserify javascript/app.js -o javascript/app-build.js

help:
	@echo Usage: make [build]
