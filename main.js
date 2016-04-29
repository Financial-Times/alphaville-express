const path = require('path');
const fs = require('fs');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const exphbs = require('express-handlebars');
const headerConfig = require('alphaville-header-config');

const environment = process.env.ENVIRONMENT || 'test';



module.exports = function (options) {
	const app = express();

	app.set('views', path.join(options.directory, 'views'));

	const alphavilleHbs = exphbs.create({
		defaultLayout: path.join(__dirname, 'templates/layout'),
		extname: '.handlebars',
		partialsDir: path.join(options.directory, 'views', 'partials'),
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

	alphavilleHbs.handlebars.partials = {
		header: fs.readFileSync(path.join(options.directory, 'bower_components/alphaville-header/main.handlebars'), 'utf-8'),
		footer: fs.readFileSync(path.join(options.directory, 'bower_components/alphaville-footer/main.handlebars'), 'utf-8'),
		ctm: fs.readFileSync(path.join(__dirname, 'templates/ctm.handlebars'), 'utf-8')
	};

	const defaultOptions = {
		assetsBasePath: path.join((environment === 'prod' ? '//alphaville-h2.ft.com' : ''), 'assets', options.appBasePath, options.fingerprint),
		basePath: '/' + options.appBasePath,
		isTest: environment === 'test' ? true : false,
		isProd: environment === 'prod' ? true : false,
		ctmCoreClass: 'core',
		polyfillServiceUrl: '//alphaville-h2.ft.com/polyfill/v2/polyfill.min.js?features=default,fetch|gated',
		headerConfig: headerConfig.setSelected(options.navSelected)
	};

	app.use( function( req, res, next ) {
		const _render = res.render;
		res.render = function( view, options, fn ) {
			Object.assign(options, defaultOptions);

			_render.call( this, view, options, fn );
		};
		next();
	});

	app.engine('handlebars', alphavilleHbs.engine);
	app.set('view engine', 'handlebars');



	app.use(logger('dev'));
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(cookieParser());



	const ayear = 365 * 24 * 60 * 60 * 1000;

	app.get(`/assets/${options.appBasePath}/bower/:fingerprint/*.(woff|svg|ttf|eot|gif|png|jpg)`, (req, res) => {
		const newPath = req.originalUrl.split('/').slice(5).join('/');

		if (environment === 'prod') {
			res.set('Cache-Control', 'public, max-age=' + (ayear/1000));
		}

		res.sendFile(path.join(options.directory, '/bower_components', newPath));
	});
	app.use(`/assets/${options.appBasePath}/:fingerprint/`, express.static(path.join(options.directory, 'public', {
		maxage: environment === 'prod' ? ayear : 0
	})));


	return app;
};
