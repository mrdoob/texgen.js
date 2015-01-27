/**
 * @author mrdoob / http://mrdoob.com/
 */

var TG = {};

TG.Texture = function ( width, height ) {

	this.width = width;
	this.height = height;

	this.array = new Float32Array( width * height * 4 );
	this.arrayCopy = new Float32Array( width * height * 4 );

	return this;

};

TG.Texture.prototype = {

	constructor: TG.Texture,

	pass: function ( program, operation ) {

		if ( operation === undefined ) operation = '';

		var color = program.getColor();
		var source = program.getSource();

		this.arrayCopy.set( this.array );

		var string = [
			'var x = 0, y = 0;',
			'for ( var i = 0, il = dst.length; i < il; i += 4 ) {',
				'	' + source,
				color[ 0 ] !== 0 ? '	dst[ i + 0 ] ' + operation + '= color * ' + color[ 0 ] + ';' : '',
				color[ 1 ] !== 0 ? '	dst[ i + 1 ] ' + operation + '= color * ' + color[ 1 ] + ';' : '',
				color[ 2 ] !== 0 ? '	dst[ i + 2 ] ' + operation + '= color * ' + color[ 2 ] + ';' : '',
				'	if ( ++x === width ) { x = 0; y ++; }',
			'}'
		].join( '\n' );

		new Function( 'dst, src, width, height', string )( this.array, this.arrayCopy, this.width, this.height );

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

	toImageData: function ( context ) {

		var array = this.array;

		var imagedata = context.createImageData( this.width, this.height );
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
		canvas.width = this.width;
		canvas.height = this.height;

		var context = canvas.getContext( '2d' );
		var imagedata = this.toImageData( context );

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

			return 'var color = ( ( ( y + ' + offset[ 1 ] + ' ) / ' + size[ 1 ] + ' ) & 1 ) ^ ( ( ( x + ' + offset[ 0 ] + ' + parseInt( y / ' + size[ 1 ] + ' ) * ' + rowShift + ' ) / ' + size[ 0 ] + ' ) & 1 ) ? 0 : 1';

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

			return 'var color = ( x >= ' + position[ 0 ] + ' && x <= ' + ( position[ 0 ] + size[ 0 ] ) + ' && y <= ' + ( position[ 1 ] + size[ 1 ] ) + ' && y >= ' + position[ 1 ] + ' ) ? 1 : 0;';

		}
	} );

};

TG.SineDistort = function () {

	var sines = [ 1, 1 ];
	var offset = [ 0, 0 ];
	var amplitude = [ 0, 0 ];

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
				'var sx = Math.sin(' + sines[ 0 ] / 100 + ' * y + ' + offset[ 0 ] + ') * ' + amplitude[ 0 ] + ' + x;',
				'var sy = Math.sin(' + sines[ 1 ] / 100 + ' * x + ' + offset[ 1 ] + ') * ' + amplitude[ 1 ] + ' + y;',
				'var color = src[ parseInt( sy ) * width * 4 + parseInt( sx ) * 4 ];'
				].join( '\n' );
		}
	} );
}

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
            	'var color = TG.Utils.smoothStep( ' + radius + ' - ' + delta + ', ' + radius + ', dist );',
			].join('\n');
		}
	} );

};

// Utils
TG.Utils = {};

TG.Utils.smoothStep = function ( edge0, edge1, x )
{
    // Scale, bias and saturate x to 0..1 range
    x = TG.Utils.clamp( ( x - edge0 ) / ( edge1 - edge0 ), 0, 1 ); 
    
	// Evaluate polynomial
    return x * x * ( 3 - 2 * x );
}

TG.Utils.distance = function( x0, y0, x1, y1 ) {

	return Math.sqrt( ( x1 - x0 ) * ( x1 - x0 ) + ( y1 - y0 ) * ( y1 - y0 ) );
}

TG.Utils.clamp = function( value, min, max ) {

  return Math.min( Math.max( value, min ), max );
  
};