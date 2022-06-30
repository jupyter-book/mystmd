.PHONY: patch-react-router

patch-react-router:
	# I think this will be available in 6.4.0
	# https://github.com/remix-run/react-router/pull/8877/files#diff-cf8c561ed8c0d6c0ace3e6be06dcceaa55f84f916d19f6d6247c208774982921R480
	sed -i.bak "s/\[\.\~\-\]/\[\@\.\~\-\]/g" ./node_modules/react-router/main.js
	sed -i.bak "s/\[\.\~\-\]/\[\@\.\~\-\]/g" ./node_modules/react-router/index.js
	sed -i.bak "s/\[\.\~\-\]/\[\@\.\~\-\]/g" ./node_modules/react-router/react-router.development.js
	sed -i.bak "s/\[\.\~\-\]/\[\@\.\~\-\]/g" ./node_modules/react-router/react-router.production.min.js
	sed -i.bak "s/\[\.\~\-\]/\[\@\.\~\-\]/g" ./node_modules/react-router/umd/react-router.development.js
	sed -i.bak "s/\[\.\~\-\]/\[\@\.\~\-\]/g" ./node_modules/react-router/umd/react-router.production.min.js
