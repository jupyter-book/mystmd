.PHONY: build serve watch

build:
	jupyter-book build .
	rm -r _build/html/dist | true;
	cp -r ../dist _build/html/demo

watch:
	nodemon -w './**' -e yml,md,ipynb --exec jupyter-book build .

serve:
	cd _build/html; python -m http.server 9000

clean:
	jupyter-book clean .
