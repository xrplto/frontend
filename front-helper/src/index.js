#!/usr/bin/env node

// Native
const http = require('http');
const {promisify} = require('util');
// const {parse} = require('url');
const os = require('os');

// Packages
const handler = require('./serve-handler');
const compression = require('compression');

// Utilities
const log = require('./logger')();
const compressionHandler = promisify(compression());

const interfaces = os.networkInterfaces();

const registerShutdown = (fn) => {
	let run = false;

	const wrapper = () => {
		if (!run) {
			run = true;
			fn();
		}
	};

	process.on('SIGINT', wrapper);
	process.on('SIGTERM', wrapper);
	process.on('exit', wrapper);
};

const getNetworkAddress = () => {
	for (const name of Object.keys(interfaces)) {
		for (const interface of interfaces[name]) {
			const {address, family, internal} = interface;
			if (family === 'IPv4' && !internal) {
				return address;
			}
		}
	}
};

const startEndpoint = (port, config) => {
	// const compress = args['--no-compression'] !== true;

	const compress = true;

	const serverHandler = async (request, response) => {
		/*if (args['--cors']) {
			response.setHeader('Access-Control-Allow-Origin', '*');
		}*/
		if (compress) {
			await compressionHandler(request, response);
		}

		return handler(request, response, config);
	};

	const server = http.createServer(serverHandler);

	server.on('error', (err) => {
		console.error(error(`Failed to serve: ${err.stack}`));
		process.exit(1);
	});

	server.listen(port, async () => {
		const details = server.address();
		registerShutdown(() => server.close());

		let localAddress = null;
		let networkAddress = null;

		if (typeof details === 'string') {
			localAddress = details;
		} else if (typeof details === 'object' && details.port) {
			const address = details.address === '::' ? 'localhost' : details.address;
			const ip = getNetworkAddress();

			localAddress = `http://${address}:${details.port}`;
			networkAddress = ip ? `http://${ip}:${details.port}` : null;
		}

		const suffix = localAddress ? ` at ${localAddress}` : '';
		log.info(`Accepting connections${suffix}`);
	});
};

(async () => {
	const PORT = process.env.PORT || 3000;
	
	let config = {};
	config.etag = true;
	config.public = '../build';
	config.rewrites = [
		/*{
			source: '/token/:slug',
			destination: '/detail.html'
		},*/
		{
			source: '**',
			destination: '/index.html'
		}
	];

	startEndpoint(PORT, config);

	registerShutdown(() => {
		log.info('\nGracefully shutting down. Please wait...');

		process.on('SIGINT', () => {
			log.info('\nForce-closing all open sockets...');
			process.exit(0);
		});
	});
})();
