.PHONY: build serve watch

build:
	jupyter-book build .
	rm -r _build/html/demo | true;
	cp -r ../dist _build/html/demo
	cp ../dist/myst.min.js _static
	sed -i '' "s/NAVIGATION_WITH_KEYS: true/NAVIGATION_WITH_KEYS: false/g" _build/html/_static/documentation_options.js

build-watch:
	jupyter-book build .
	cp ../dist/myst.min.js _build/html/_static
	sed -i '' "s/NAVIGATION_WITH_KEYS: true/NAVIGATION_WITH_KEYS: false/g" _build/html/_static/documentation_options.js

watch: clean
	make build
	nodemon -w './**' --ignore _build/ -e yml,md,ipynb,js --exec make build-watch

serve:
	cd _build/html; python -m http.server 9000

clean:
	jupyter-book clean .
