/**
 * @author mrdoob / http://mrdoob.com/
 */

var TG = {};

TG.Texture = function ( width, height ) {

	this.width = width;
	this.height = height;

	this.array = new Float32Array( width * height * 4 );

	return this;

};

TG.Texture.prototype = {

	constructor: TG.Texture,

	pass: function ( program, operation ) {

		if ( operation === undefined ) operation = '';

		var color = program.getColor();
		var source = program.getSource();

		var string = [
			'var x = 0, y = 0;',
			'for ( var i = 0, il = array.length; i < il; i += 4 ) {',
				'	' + source,
				color[ 0 ] !== 0 ? '	array[ i + 0 ] ' + operation + '= color * ' + color[ 0 ] + ';' : '',
				color[ 1 ] !== 0 ? '	array[ i + 1 ] ' + operation + '= color * ' + color[ 1 ] + ';' : '',
				color[ 2 ] !== 0 ? '	array[ i + 2 ] ' + operation + '= color * ' + color[ 2 ] + ';' : '',
				'	if ( ++x === width ) { x = 0; y ++; }',
			'}'
		].join( '\n' );

		new Function( 'array, width, height', string )( this.array, this.width, this.height );

		return this;

	},

	add: function ( program ) {

		return this.pass( program, '+' );

	},

	sub: function ( program ) {

		return this.pass( program, '-' );

	},

	mul: function ( program ) {

		return this.pass( program, '*' );

	},

	div: function ( program ) {

		return this.pass( program, '/' );

	},

	toCanvas: function () {

		var width = this.width;
		var height = this.height;

		var array = this.array;

		var canvas = document.createElement( 'canvas' );
		canvas.width = width;
		canvas.height = height;

		var context = canvas.getContext( '2d' );
		var imagedata = context.createImageData( width, height );
		var data = imagedata.data;

		for ( var i = 0, il = array.length; i < il; i += 4 ) {

			data[ i     ] = array[ i     ] * 255;
			data[ i + 1 ] = array[ i + 1 ] * 255;
			data[ i + 2 ] = array[ i + 2 ] * 255;
			data[ i + 3 ] = 255;

		}

		context.putImageData( imagedata, 0, 0 );

		return canvas;

	}

};

TG.Program = function ( object ) {

	var color = [ 1, 1, 1 ];

	object.color = function ( r, g, b ) {
		color = [ r, g, b ];
		return this;
	};

	object.getColor = function () {
		return color;
	};

	return object;

};

TG.Number = function () {

	return new TG.Program( {
		getSource: function () {
			return 'var color = 1;';
		}
	} );

};

TG.SinX = function () {

	var frequency = 1;
	var offset = 0;

	return new TG.Program( {
		frequency: function ( value ) {
			frequency = value * Math.PI;
			return this;
		},
		offset: function ( value ) {
			offset = value;
			return this;
		},
		getSource: function () {
			return 'var color = Math.sin( ( x + ' + offset + ' ) * ' + frequency + ' );';
		}
	} );

};

TG.SinY = function () {

	var frequency = 1;
	var offset = 0;

	return new TG.Program( {
		frequency: function ( value ) {
			frequency = value * Math.PI;
			return this;
		},
		offset: function ( value ) {
			offset = value;
			return this;
		},
		getSource: function () {
			return 'var color = Math.sin( ( y + ' + offset + ' ) * ' + frequency + ' );';
		}
	} );

};

TG.OR = function () {

	return new TG.Program( {
		getSource: function () {
			return 'var color = ( x | y ) / width;';
		}
	} );

};

TG.XOR = function () {

	return new TG.Program( {
		getSource: function () {
			return 'var color = ( x ^ y ) / width;';
		}
	} );

};

TG.Noise = function () {

	return new TG.Program( {
		getSource: function () {
			return 'var color = Math.random();';
		}
	} );

};
