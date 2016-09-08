'use strict';

const path = require('path');
const _ = require('lodash');
const express = require('express');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const exphbs = require('express-handlebars');
const headerConfig = require('alphaville-header-config');


module.exports = function (options) {
	const environment = options.env || 'test';

	const app = express();

	app.set('views', path.join(options.directory, 'views'));

	const alphavilleHbs = exphbs.create({
		defaultLayout: path.join(options.directory, 'bower_components/alphaville-ui/layout'),
		extname: '.handlebars',
		partialsDir: [
			path.join(options.directory, 'views', 'partials'),
			path.join(options.directory, 'bower_components')
		],
		helpers: {
			block: function (name) {
				const blocks = this._blocks;
				const content = blocks && blocks[name];

				return content ? content.join('\n') : null;
			},

			contentFor: function (name, options) {
				const blocks = this._blocks || (this._blocks = {});
				const block = blocks[name] || (blocks[name] = []);

				block.push(options.fn(this));
			}
		}
	});

	function getNavItems (navSelected) {
		const navItems = headerConfig.get(navSelected);

		return navItems;
	}

	const defaultOptions = {
		assetsBasePath: (environment === 'prod' ? '//alphaville-h2.ft.com' : '') +'/assets' +'/'+ options.appBasePath +'/'+ options.fingerprint,
		assetsBowerBasePath: (environment === 'prod' ? '//alphaville-h2.ft.com' : '') +'/assets/'+ options.appBasePath +'/bower/' + options.fingerprint,
		basePath: '/' + options.appBasePath,
		isTest: environment === 'test' ? true : false,
		isProd: environment === 'prod' ? true : false,
		polyfillServiceUrl: '//alphaville-h2.ft.com/polyfill/v2/polyfill.min.js?features=default,fetch|gated&excludes=Symbol,Symbol.iterator,Symbol.species,Map,Set'
	};

	app.engine('handlebars', alphavilleHbs.engine);
	app.set('view engine', 'handlebars');


	app.use(logger('dev'));
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(cookieParser());

	app.use( function( req, res, next ) {
		const _render = res.render;

		res.render = function( view, viewOptions, fn ) {
			const viewModel = _.merge({}, viewOptions, defaultOptions);

			if (viewOptions.navSelected) {
				viewModel.headerConfig = getNavItems(viewOptions.navSelected);
			} else {
				viewModel.headerConfig = getNavItems(options.navSelected);
			}

			if (viewOptions.headerConfig) {
				viewModel.headerConfig = _.merge({}, viewModel.headerConfig, viewOptions.headerConfig);
			}

			if (req.cookies.FTSession) {
				viewModel.userIsLoggedIn = true;
			}

			_render.call( this, view, viewModel, fn );
		};
		next();
	});

	const ayear = 365 * 24 * 60 * 60 * 1000;

	app.get(`/assets/${options.appBasePath}/bower/:fingerprint/*.(woff|svg|ttf|eot|gif|png|jpg)`, (req, res) => {
		const newPath = req.originalUrl.split('/').slice(5).join('/');

		if (environment === 'prod') {
			res.set('Cache-Control', 'public, max-age=' + (ayear/1000));
		}

		res.sendFile(path.join(options.directory, '/bower_components', newPath));
	});
	app.use(`/assets/${options.appBasePath}/:fingerprint/`, express.static(path.join(options.directory, 'public'), {
		maxage: environment === 'prod' ? ayear : 0
	}));

	return app;
};
