.PHONY: build build-watch serve watch fix-default-js

fix-default-js:
	# Disables the arrow key navigation which doesn't work with shaddow-dom input boxes
	sed -i.bak "s/NAVIGATION_WITH_KEYS: true/NAVIGATION_WITH_KEYS: false/g" ./_build/html/_static/documentation_options.js
	rm ./_build/html/_static/documentation_options.js.bak

build:
	cd ..; npm run build
	cp ../dist/index.cjs.js _static/myst.min.js
	jupyter-book build .
	make fix-default-js

build-watch:
	jupyter-book build .
	cp ../dist/index.cjs.js _build/html/_static/myst.min.js
	make fix-default-js

watch: clean
	make build
	nodemon -w './**' --ignore _build/ -e yml,md,ipynb,js --exec make build-watch

serve:
	cd _build/html; python -m http.server 9000

clean:
	jupyter-book clean .
