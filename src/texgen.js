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

TG.Checkboard = function () {

	var dx = 32;
	var dy = 32;
	var rowShift = 0;
	
	return new TG.Program( {
		dx: function ( value ) {
			dx = value;
			return this;
		},
		dy: function ( value ) {
			dy = value;
			return this;
		},
		rowShift: function ( value ) {
			rowShift = value;
			return this;
		},
		getSource: function () {

			return 'var color = ( ( ( y / ' + dy + ' ) & 1 ) ^ ( ( (x + parseInt( y / ' + dy + ' ) * ' + rowShift + ' ) / '+ dx + ' ) & 1 ) ) ? 0 : 1';
			
		}
	} );
}

TG.Rect = function () {

	var left = 0;
	var right = 255;
	var top = 0;
	var bottom = 255;
	
	
	return new TG.Program( {
		set: function ( newLeft, newTop, newRight, newBottom ) {
			
			left = newLeft;
			right = newRight;
			top = newTop;
			bottom = newBottom;

			return this;
		},
		getSource: function () {

			return 'var color =  ( (x >= '+ left +') && (x <= '+ right +') && (y <= '+ bottom +') && (y >= '+ top +') ) ? 1 : 0;';
			
		}
	} );
}

TG.Flare = function () {

	var type = 0;
	var radius = [ 128, 128 ];
	var position = [ 128, 128 ];
	var alpha = 1;
	var gamma = 1;
	var degree = 1;

	return new TG.Program( {
		radius: function ( radiusX, radiusY ) {
						
			if ( typeof radiusY === 'undefined')
				radiusY = radiusX;

			radius = [ radiusX, radiusY ];

			return this;
		},
		position: function(x,y) {
			position = [ x, y ];
			return this;
		},
		type: function ( value ) {
			type = value;
			return this;
		},
		degree: function ( value ) {
			degree = value;
			return this;
		},
		getSource: function () {
			
			var source = 'var dx = ' + position[ 0 ] + ' - x, dy = ' + position[ 1 ] + ' - y; ';
			source += 'var d = Math.sqrt( dx * dx / ' + radius[ 0 ]*radius[ 0 ] + ' + dy * dy / ' + radius[ 1 ]*radius[ 1 ] +');';

			switch (type) {
				
				case 0:
					source += 'var color = (1-d);'
					source += 'color *= 1-TG.Utils.smoothStep(1-.01, 1+.02, d);'
					break;
				case 1:
					source += 'var color = d'+ Array( degree ).join( '*d' ) + ';';
					source += 'color *= 1-TG.Utils.smoothStep(1-.01, 1+.02, d);'
					break;
				case 2:
					source += 'var color = 1-Math.abs(d-0.9)/0.1;'
					source += 'if (color < 0) color = 0;'
					source += 'color = color'+ Array( degree ).join( '*color' ) + ';'
					break;
			}

			return source;
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


TG.Utils.clamp = function( value, min, max ) {

  return Math.min( Math.max( value, min ), max );
  
};