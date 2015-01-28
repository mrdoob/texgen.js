/**
 * @author mrdoob / http://mrdoob.com/
 */

var TG = {};

TG.Texture = function ( width, height ) {

	this.color = new TG.Color();

	this.buffer = new TG.Buffer( width, height );
	this.bufferCopy = new TG.Buffer( width, height );

};

TG.Texture.prototype = {

	constructor: TG.Texture,

	set: function ( program, operation ) {

		if ( operation === undefined ) operation = '';

		var modulate = program.getColor();
		var source = program.getSource();

		this.bufferCopy.copy( this.buffer );

		var string = [
			'var x = 0, y = 0;',
			'var array = dst.array;',
			'var width = dst.width, height = dst.height;',
			'for ( var i = 0, il = array.length; i < il; i += 4 ) {',
				'	' + source,
				'	array[ i + 0 ] ' + operation + '= color.array[ 0 ] * ' + modulate[ 0 ] + ';',
				'	array[ i + 1 ] ' + operation + '= color.array[ 1 ] * ' + modulate[ 1 ] + ';',
				'	array[ i + 2 ] ' + operation + '= color.array[ 2 ] * ' + modulate[ 2 ] + ';',
				'	if ( ++x === width ) { x = 0; y ++; }',
			'}'
		].join( '\n' );

		new Function( 'dst, src, color', string )( this.buffer, this.bufferCopy, this.color );

		return this;

	},

	add: function ( program ) {

		return this.set( program, '+' );

	},

	sub: function ( program ) {

		return this.set( program, '-' );

	},

	mul: function ( program ) {

		return this.set( program, '*' );

	},

	div: function ( program ) {

		return this.set( program, '/' );

	},

	and: function ( program ) {

		return this.set( program, '&' );

	},

	xor: function ( program ) {

		return this.set( program, '^' );

	},

	toImageData: function ( context ) {

		var array = this.buffer.array;

		var imagedata = context.createImageData( this.buffer.width, this.buffer.height );
		var data = imagedata.data;

		for ( var i = 0, il = array.length; i < il; i += 4 ) {

			data[ i		 ] = array[ i		 ] * 255;
			data[ i + 1 ] = array[ i + 1 ] * 255;
			data[ i + 2 ] = array[ i + 2 ] * 255;
			data[ i + 3 ] = 255;

		}

		return imagedata;

	},

	toCanvas: function () {

		var canvas = document.createElement( 'canvas' );
		canvas.width = this.buffer.width;
		canvas.height = this.buffer.height;

		var context = canvas.getContext( '2d' );
		var imagedata = this.toImageData( context );

		context.putImageData( imagedata, 0, 0 );

		return canvas;

	}

};

//

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
			return 'color.setRGB( 1, 1, 1 );';
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
			return [
				'var value = Math.sin( ( x + ' + offset + ' ) * ' + frequency + ' );',
				'color.setRGB( value, value, value );'
			].join('\n');
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
			return [
				'var value = Math.sin( ( y + ' + offset + ' ) * ' + frequency + ' );',
				'color.setRGB( value, value, value );'
			].join('\n');
		}
	} );

};

TG.OR = function () {

	return new TG.Program( {
		getSource: function () {
			return [
				'var value = ( x | y ) / width;',
				'color.setRGB( value, value, value );'
			].join('\n');
		}
	} );

};

TG.XOR = function () {

	return new TG.Program( {
		getSource: function () {
			return [
				'var value = ( x ^ y ) / width;',
				'color.setRGB( value, value, value );'
			].join('\n');
		}
	} );

};

TG.Noise = function () {

	return new TG.Program( {
		getSource: function () {
			return [
				'var value = Math.random();',
				'color.setRGB( value, value, value );'
			].join('\n');
		}
	} );

};

TG.CheckerBoard = function () {

	var size = [ 32, 32 ];
	var offset = [ 0, 0 ];
	var rowShift = 0;

	return new TG.Program( {
		size: function ( x, y ) {
			size = [ x, y ];
			return this;
		},
		offset: function ( x, y ) {
			offset = [ x, y ];
			return this;
		},
		rowShift: function ( value ) {
			rowShift = value;
			return this;
		},
		getSource: function () {
			return [
				'var value = ( ( ( y + ' + offset[ 1 ] + ' ) / ' + size[ 1 ] + ' ) & 1 ) ^ ( ( ( x + ' + offset[ 0 ] + ' + parseInt( y / ' + size[ 1 ] + ' ) * ' + rowShift + ' ) / ' + size[ 0 ] + ' ) & 1 ) ? 0 : 1',
				'color.setRGB( value, value, value );'
			].join('\n');
		}
	} );

};

TG.Rect = function () {

	var position = [ 0, 0 ];
	var size = [ 32, 32 ];

	return new TG.Program( {
		position: function ( x, y ) {
			position = [ x, y ];
			return this;
		},
		size: function ( x, y ) {
			size = [ x, y ];
			return this;
		},
		getSource: function () {
			return [
				'var value = ( x >= ' + position[ 0 ] + ' && x <= ' + ( position[ 0 ] + size[ 0 ] ) + ' && y <= ' + ( position[ 1 ] + size[ 1 ] ) + ' && y >= ' + position[ 1 ] + ' ) ? 1 : 0;',
				'color.setRGB( value, value, value );'
			].join('\n');
		}
	} );

};

TG.Circle = function () {

	var position = [ 0, 0 ];
	var radius = 50;
	var delta = 1;

	return new TG.Program( {
		delta: function ( value ) {
			delta = value;
			return this;
		},
		position: function ( x, y ) {
			position = [ x, y ];
			return this;
		},
		radius: function ( value ) {
			radius = value;
			return this;
		},
		getSource: function () {
			return [
				
				'var dist = TG.Utils.distance( x, y, ' + position[ 0 ] + ',' + position[ 1 ] + ');',
				'var value = 1 - TG.Utils.smoothStep( ' + radius + ' - ' + delta + ', ' + radius + ', dist );',
				'color.setRGB( value, value, value );'

			].join('\n');
		}
	} );

};

// Filters

TG.SineDistort = function () {

	var sines = [ 4, 4 ];
	var offset = [ 0, 0 ];
	var amplitude = [ 16, 16 ];

	return new TG.Program( {
		sines: function ( x, y ) {
			sines = [ x, y ];
			return this;
		},
		offset: function ( x, y ) {
			offset = [ x, y ];
			return this;
		},
		amplitude: function ( x, y ) {
			amplitude = [ x, y ];
			return this;
		},
		getSource: function () {
			return [
				'var s = Math.sin(' + sines[ 0 ] / 100 + ' * y + ' + offset[ 0 ] + ') * ' + amplitude[ 0 ] + ' + x;',
				'var t = Math.sin(' + sines[ 1 ] / 100 + ' * x + ' + offset[ 1 ] + ') * ' + amplitude[ 1 ] + ' + y;',
				'color.set( src.getPixelNearest( s, t ) );',
			].join( '\n' );
		}
	} );

};

TG.Twirl = function () {

	var strength = 0;
	var radius = 120;
	var position = [ 128, 128 ];

	return new TG.Program( {
		strength: function ( value ) {
			strength = value / 100.0;
			return this;
		},
		radius: function ( value ) {
			radius = value;
			return this;
		},
		position: function ( x, y ) {
			position = [ x, y ];
			return this;
		},
		getSource: function () {
			return [
				'var dist = TG.Utils.distance( x, y, ' + position[ 0 ] + ',' + position[ 1 ] + ');',

				// no distortion if outside of whirl radius.
				'if (dist < '+ radius +') {',
					'dist = Math.pow('+ radius +' - dist, 2) / ' + radius + ';',

					'var angle = 2.0 * Math.PI * (dist / (' + radius + ' / ' + strength + '));',
					's = (((x - ' + position[ 0 ] + ') * Math.cos(angle)) - ((y - ' + position[ 0 ] + ') * Math.sin(angle)) + ' + position[ 0 ] + ' + 0.5);',
					't = (((y - ' + position[ 1 ] + ') * Math.cos(angle)) + ((x - ' + position[ 1 ] + ') * Math.sin(angle)) + ' + position[ 1 ] + ' + 0.5);',
				'} else {',
					's = x;',
					't = y;',
				'}',

				'color.set( src.getPixelNearest( s, t ) );',

			].join( '\n' );
		}
	} );

};

TG.Transform = function () {

		var offset = [ 0, 0 ];
		var angle = 0;
		var scale = [ 1, 1 ];

		return new TG.Program( {
				offset: function ( x, y ) {
					offset = [ x, y ];
					return this;
				},
				angle: function ( value ) {
					angle = TG.Utils.deg2rad( value );
					return this;
				},
				scale: function ( x, y ) {
					if ( x === 0 || y === 0 ) return;
					scale = [ x, y ];
					return this;
				},
				getSource: function () {
					return [
						'var x2 = x - width / 2;',
						'var y2 = y - height / 2;',

						'var s = x2 * (' + ( Math.cos( angle ) / scale[ 0 ] ) + ') + y2 * -(' + ( Math.sin( angle ) / scale[ 0 ] ) + ');',
						'var t = x2 * (' + ( Math.sin( angle ) / scale[ 1 ] ) + ') + y2 * (	' + ( Math.cos( angle ) / scale[ 1 ] ) + ');',

						's += ' + offset[ 0 ] + ' + width /2;',
						't += ' + offset[ 1 ] + ' + height /2;',

						'color.set( src.getPixelNearest( s, t ) );',

					].join( '\n' );
				}
		} );

};

TG.Pixelate = function () {

	var size = [ 1, 1 ];

	return new TG.Program( {
		size: function ( x, y ) {
			size = [ x, y ];
			return this;
		},
		getSource: function () {
			return [
				'var s = ' + size[ 0 ] + ' * Math.floor(x/' + size[ 0 ] + ');',
				'var t = ' + size[ 1 ] + ' * Math.floor(y/' + size[ 1 ] + ');',

				'color.set( src.getPixelNearest( s, t ) );'

			].join( '\n' );
		}
	} );

};

// Color

TG.Color = function () {

	this.array = new Float32Array( 4 );

};

TG.Color.prototype = {

	constructor: TG.Color,

	set: function ( color ) {

		this.array[ 0 ] = color.array[ 0 ];
		this.array[ 1 ] = color.array[ 1 ];
		this.array[ 2 ] = color.array[ 2 ];

	},

	setRGB: function ( r, g, b ) {

		this.array[ 0 ] = r;
		this.array[ 1 ] = g;
		this.array[ 2 ] = b;

	},

	add: function ( color ) {

		this.array[ 0 ] += color.array[ 0 ];
		this.array[ 1 ] += color.array[ 1 ];
		this.array[ 2 ] += color.array[ 2 ];

	},

	sub: function ( color ) {

		this.array[ 0 ] -= color.array[ 0 ];
		this.array[ 1 ] -= color.array[ 1 ];
		this.array[ 2 ] -= color.array[ 2 ];

	},

	mul: function ( color ) {

		this.array[ 0 ] *= color.array[ 0 ];
		this.array[ 1 ] *= color.array[ 1 ];
		this.array[ 2 ] *= color.array[ 2 ];

	},

	div: function ( color ) {

		this.array[ 0 ] /= color.array[ 0 ];
		this.array[ 1 ] /= color.array[ 1 ];
		this.array[ 2 ] /= color.array[ 2 ];

	}

};

// Buffer

TG.Buffer = function ( width, height ) {

	this.width = width;
	this.height = height;

	this.array = new Float32Array( width * height * 4 );
	this.color = new TG.Color();

};

TG.Buffer.prototype = {

	constructor: TG.Buffer,

	copy: function ( buffer ) {

		this.array.set( buffer.array );

	},

	getPixelNearest: function ( x, y ) {

		if ( y > this.height ) y -= this.height;
		if ( y < 0 ) y += this.height;
		if ( x > this.width ) x -= this.width;
		if ( x < 0 ) x += this.width;

		var array = this.array;
		var color = this.color.array;
		var offset = Math.round( y ) * this.width * 4 + Math.round( x ) * 4;

		color[ 0 ] = array[ offset     ];
		color[ 1 ] = array[ offset + 1 ];
		color[ 2 ] = array[ offset + 2 ];

		return this.color;

	}

};

//

TG.Utils = {

	smoothStep: function ( edge0, edge1, x ) {

		// Scale, bias and saturate x to 0..1 range
		x = TG.Utils.clamp( ( x - edge0 ) / ( edge1 - edge0 ), 0, 1 );

		// Evaluate polynomial
		return x * x * ( 3 - 2 * x );

	},

	distance: function( x0, y0, x1, y1 ) {

		var dx = x1 - x0, dy = y1 - y0;
		return Math.sqrt( dx * dx + dy * dy );

	},

	clamp: function( value, min, max ) {

		return Math.min( Math.max( value, min ), max );

	},

	getPixelBilinear: function( pixels, x, y, offset, width, height ) {

		if ( y > height ) y -= height;
		if ( y < 0 ) y += height;
		if ( x > width ) x -= width;
		if ( x < 0 ) x += width;

		var percentX = x - ( x ^ 0 );
		var percentX1 = 1.0 - percentX;
		var percentY = y - ( y ^ 0 );
		var fx4 = ( x ^ 0 ) * 4;
		var cx4 = fx4 + 4;
		var fy4 = ( y ^ 0 ) * 4;
		var cy4wo = ( fy4 + 4 ) * width + offset;
		var fy4wo = fy4 * width + offset;

		var top = pixels[ cy4wo + fx4 ] * percentX1 + pixels[ cy4wo + cx4 ] * percentX;
		var bottom = pixels[ fy4wo + fx4 ] * percentX1 + pixels[ fy4wo + cx4 ] * percentX;

		return top * percentY + bottom * ( 1.0 - percentY );

	},

	deg2rad: function ( deg ) {

		return deg * Math.PI / 180;

	}

};
