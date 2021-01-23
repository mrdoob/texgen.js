/**
 * @author mrdoob / http://mrdoob.com/
 */

var TG = {};

//

TG.Utils = {

	globalSeed: Date.now(), 		// used as a somewhat random seed, increased on each use so that each default seed is different

	smoothStep: function ( edge0, edge1, x ) {

		// Scale, bias and saturate x to 0..1 range
		x = TG.Utils.clamp( ( x - edge0 ) / ( edge1 - edge0 ), 0, 1 );

		// Evaluate polynomial
		return x * x * ( 3 - 2 * x );

	},

	mixColors: function( c1, c2, delta ) {

		return [
			c1[ 0 ] * ( 1 - delta ) + c2[ 0 ] * delta,
			c1[ 1 ] * ( 1 - delta ) + c2[ 1 ] * delta,
			c1[ 2 ] * ( 1 - delta ) + c2[ 2 ] * delta,
			c1[ 3 ] * ( 1 - delta ) + c2[ 3 ] * delta,
		];
	},

	distance: function( x0, y0, x1, y1 ) {

		var dx = x1 - x0, dy = y1 - y0;
		return Math.sqrt( dx * dx + dy * dy );

	},

	clamp: function( value, min, max ) {

		return Math.min( Math.max( value, min ), max );

	},

	wrap: function ( value, min, max ) {
		var v = value - min;
		var r = max - min;

		return ( ( r + v % r ) % r ) + min;
	},

	mirroredWrap: function ( value, min, max ) {
		var v = value - min;
		var r = ( max - min ) * 2;

		v = ( r + v % r ) % r;

		if ( v > max - min ) {
			return ( r - v ) + min;
		} else {
			return v + min;
		}
	},

	deg2rad: function ( deg ) {

		return deg * Math.PI / 180;

	},

	hashRNG: function ( seed, x, y ) {
		seed = Math.abs(seed % 0x7FFFFFFF) + 1;

		var a = ( seed * ( ( x ^ seed * 777 ) || 556 ) * ( ( y ^ seed * 314 ) || 989 ) + seed * 123 ) % 0x7FFFFFFF;
		a = (a ^ 61) ^ (a >> 16);
		a = a + (a << 3);
		a = a ^ (a >> 4);
		a = a * 0x27d4eb2d;
		a = a ^ (a >> 15);
		a = a / 0x7FFFFFFF;

		return a;
	},

	cellNoiseBase: function ( x, y, seed, density, weightRange ) {
		var qx, qy, rx, ry, w, px, py, dx, dy;
		var dist, value;
		var shortest = Infinity;
		density = Math.abs( density );

		for ( var sx = -2; sx <= 2; sx++ ) {
			for ( var sy = -2; sy <= 2; sy++ ) {
				qx = Math.ceil( x / density ) + sx;
				qy = Math.ceil( y / density ) + sy;

				rx = TG.Utils.hashRNG( seed, qx, qy );
				ry = TG.Utils.hashRNG( seed * 2, qx, qy );
				w = ( weightRange > 0 ) ? 1 + TG.Utils.hashRNG( seed * 3, qx, qy ) * weightRange : 1;

				px = ( rx + qx ) * density;
				py = ( ry + qy ) * density;

				dx = Math.abs( px - x );
				dy = Math.abs( py - y );

				dist =	( dx * dx + dy * dy ) * w;

				if ( dist < shortest ) {
					shortest = dist;
					value = rx;
				}
			}
		}

		return { dist: Math.sqrt( shortest ), value: value };
	}

};

TG.ColorInterpolatorMethod = {
	STEP: 0,
	LINEAR: 1,
	SPLINE: 2,
	COSINE: 3,
};

TG.ColorInterpolator = function( method ) {

	this.points = []; 		// points must be a set pair (point, color): [{ pos-n: [r,g,b,a] } , ..., { pos-N: [r,g,b,a] } ]
	this.low = 0;
	this.high = 0;
	this.interpolation = ( typeof( method ) == 'undefined' ) ? TG.ColorInterpolatorMethod.LINEAR : method;
	this.repeat = false;

	return this;
};

TG.ColorInterpolator.prototype = {

	set: function ( points ) {

		this.points = points;
		this.points.sort( function( a, b ) {
			return a.pos - b.pos;
		});

		this.low = this.points[ 0 ].pos;
		this.high = this.points[ this.points.length - 1 ].pos;

		return this;

	},

	addPoint: function ( position, r, g, b ) {
		if ( Array.isArray( r ) ) {
			b = r[ 2 ]; g = r[ 1 ]; r = r[ 0 ];
		}
		if ( typeof g == 'undefined' ) g = r;
		if ( typeof b == 'undefined' ) b = r;

		this.points.push( { pos: position, color: [ r, g, b ] } );
		this.points.sort( function( a, b ) {
			return a.pos - b.pos;
		});

		this.low = this.points[ 0 ].pos;
		this.high = this.points[ this.points.length - 1 ].pos;

		return this;

	},

	setRepeat: function ( value ) {

		this.repeat = value;
		return this;

	},

	setInterpolation: function ( value ) {

		this.interpolation = value;
		return this;

	},

	getColorAt: function ( pos ) {

		if ( this.repeat == 2 ) pos = TG.Utils.mirroredWrap( pos, this.low, this.high );
		else if ( this.repeat ) pos = TG.Utils.wrap( pos, this.low, this.high );
		else pos = TG.Utils.clamp( pos, this.low, this.high );

		var i = 0, points = this.points;

		while ( points[ i + 1 ].pos < pos ) i ++;

		var p1 = points[ i ];
		var p2 = points[ i + 1 ];

		var delta = ( pos - p1.pos ) / ( p2.pos - p1.pos );

		if ( this.interpolation == TG.ColorInterpolatorMethod.STEP ) {

			return p1.color;

		} else if ( this.interpolation == TG.ColorInterpolatorMethod.LINEAR ) {

			return TG.Utils.mixColors( p1.color, p2.color, delta );

		} else if ( this.interpolation == TG.ColorInterpolatorMethod.SPLINE ) {

			var ar =  2 * p1.color[ 0 ] - 2 * p2.color[ 0 ];
			var br = -3 * p1.color[ 0 ] + 3 * p2.color[ 0 ];
			var dr = p1.color[ 0 ];

			var ag =  2 * p1.color[ 1 ] - 2 * p2.color[ 1 ];
			var bg = -3 * p1.color[ 1 ] + 3 * p2.color[ 1 ];
			var dg = p1.color[ 1 ];

			var ab =  2 * p1.color[ 2 ] - 2 * p2.color[ 2 ];
			var bb = -3 * p1.color[ 2 ] + 3 * p2.color[ 2 ];
			var db = p1.color[ 2 ];

			var delta2 = delta * delta;
			var delta3 = delta2 * delta;

			return [
				ar * delta3 + br * delta2 + dr,
				ag * delta3 + bg * delta2 + dg,
				ab * delta3 + bb * delta2 + db
			];

		} else if ( this.interpolation == TG.ColorInterpolatorMethod.COSINE ) {
			var cos = (1 - Math.cos(delta * Math.PI)) / 2;

			return [
				( p1.color[ 0 ] * ( 1 - cos ) ) + ( p2.color[ 0 ] * cos ),
				( p1.color[ 1 ] * ( 1 - cos ) ) + ( p2.color[ 1 ] * cos ),
				( p1.color[ 2 ] * ( 1 - cos ) ) + ( p2.color[ 2 ] * cos ),
			];

		}

	}

};

//

TG.Buffer = function ( width, height ) {

	this.width = width;
	this.height = height;

	this.array = new Float32Array( width * height * 4 );
	this.color = new Float32Array( 4 );

};

TG.Buffer.prototype = {

	constructor: TG.Buffer,

	copy: function ( buffer ) {

		this.array.set( buffer.array );

	},

	getPixelNearest: function ( x, y ) {

		if ( y >= this.height ) y -= this.height;
		if ( y < 0 ) y += this.height;
		if ( x >= this.width ) x -= this.width;
		if ( x < 0 ) x += this.width;

		var array = this.array;
		var color = this.color;
		var offset = Math.round( y ) * this.width * 4 + Math.round( x ) * 4;

		color[ 0 ] = array[ offset     ];
		color[ 1 ] = array[ offset + 1 ];
		color[ 2 ] = array[ offset + 2 ];

		return this.color;

	},

	getPixelBilinear: function ( x, y ) {

		var px = Math.floor( x );
		var py = Math.floor( y );
		var p0 = px + py * this.width;

		var array = this.array;
		var color = this.color;

		// Calculate the weights for each pixel
		var fx = x - px;
		var fy = y - py;
		var fx1 = 1 - fx;
		var fy1 = 1 - fy;

		var w1 = fx1 * fy1;
		var w2 = fx  * fy1;
		var w3 = fx1 * fy ;
		var w4 = fx  * fy ;

		var p1 = p0 * 4; 							// 0 + 0 * w
		var p2 = ( 1 + p0 ) * 4; 					// 1 + 0 * w
		var p3 = ( 1 * this.width + p0 ) * 4; 		// 0 + 1 * w
		var p4 = ( 1 + 1 * this.width + p0 ) * 4; 	// 1 + 1 * w

		var len = this.width * this.height * 4;

		if ( p1 >= len ) p1 -= len;
		if ( p1 < 0 ) p1 += len;
		if ( p2 >= len ) p2 -= len;
		if ( p2 < 0 ) p2 += len;
		if ( p3 >= len ) p3 -= len;
		if ( p3 < 0 ) p3 += len;
		if ( p4 >= len ) p4 -= len;
		if ( p4 < 0 ) p4 += len;

		// Calculate the weighted sum of pixels (for each color channel)
		color[ 0 ] = array[ p1 + 0 ] * w1 + array[ p2 + 0 ] * w2 + array[ p3 + 0 ] * w3 + array[ p4 + 0 ] * w4;
		color[ 1 ] = array[ p1 + 1 ] * w1 + array[ p2 + 1 ] * w2 + array[ p3 + 1 ] * w3 + array[ p4 + 1 ] * w4;
		color[ 2 ] = array[ p1 + 2 ] * w1 + array[ p2 + 2 ] * w2 + array[ p3 + 2 ] * w3 + array[ p4 + 2 ] * w4;
		color[ 3 ] = array[ p1 + 3 ] * w1 + array[ p2 + 3 ] * w2 + array[ p3 + 3 ] * w3 + array[ p4 + 3 ] * w4;

		return this.color;
	},

	getPixelOffset: function ( offset ) {

		var array = this.array;
		var color = this.color;

		offset = parseInt( offset * 4 );

		color[ 0 ] = array[ offset     ];
		color[ 1 ] = array[ offset + 1 ];
		color[ 2 ] = array[ offset + 2 ];
		color[ 3 ] = array[ offset + 3 ];

		return this.color;
	},

};

TG.OP = {
	SET: function ( x, y ) { return y; },
	ADD: function ( x, y ) { return x + y; },
	SUB: function ( x, y ) { return x - y; },
	MUL: function ( x, y ) { return x * y; },
	DIV: function ( x, y ) { return x / y; },
	AND: function ( x, y ) { return x & y; },
	XOR: function ( x, y ) { return x ^ y; },
	MIN: function ( x, y ) { return Math.min( x, y ); },
	MAX: function ( x, y ) { return Math.max( x, y ); },
	POW: function ( x, y ) { return Math.pow( x, y ); }
};

TG.Texture = function ( width, height ) {

	this.color = new Float32Array( 4 );

	this.buffer = new TG.Buffer( width, height );
	this.bufferCopy = new TG.Buffer( width, height );

};

TG.Texture.prototype = {

	constructor: TG.Texture,

	set: function ( program, operation ) {

		if ( operation === undefined ) operation = TG.OP.SET;

		this.bufferCopy.copy( this.buffer );

		var string = [
			'var x = 0, y = 0;',
			'var array = dst.array;',
			'var width = dst.width, height = dst.height;',
			( typeof program.getInit == 'function' ) ? program.getInit() : '',
			'for ( var i = 0, il = array.length; i < il; i += 4 ) {',
				'	' + program.getSource(),
				'	array[ i     ] = op( array[ i     ], color[ 0 ] * tint[ 0 ] );',
				'	array[ i + 1 ] = op( array[ i + 1 ], color[ 1 ] * tint[ 1 ] );',
				'	array[ i + 2 ] = op( array[ i + 2 ], color[ 2 ] * tint[ 2 ] );',
				'	if ( ++x === width ) { x = 0; y ++; }',
			'}'
		].join( '\n' );

		new Function( 'op, dst, src, color, params, tint', string )( operation, this.buffer, this.bufferCopy, this.color, program.getParams(), program.getTint() );

		return this;

	},

	add: function ( program ) { return this.set( program, TG.OP.ADD ); },

	sub: function ( program ) { return this.set( program, TG.OP.SUB ); },

	mul: function ( program ) { return this.set( program, TG.OP.MUL ); },

	div: function ( program ) { return this.set( program, TG.OP.DIV ); },

	and: function ( program ) { return this.set( program, TG.OP.AND ); },

	xor: function ( program ) { return this.set( program, TG.OP.XOR ); },

	min: function ( program ) { return this.set( program, TG.OP.MIN ); },

	max: function ( program ) { return this.set( program, TG.OP.MAX ); },

	pow: function ( program ) { return this.set( program, TG.OP.POW ); },

	toImageData: function ( context ) {

		var buffer = this.buffer;
		var array = buffer.array;

		var imagedata = context.createImageData( buffer.width, buffer.height );
		var data = imagedata.data;

		for ( var i = 0, il = array.length; i < il; i += 4 ) {

			data[ i     ] = array[ i     ] * 255;
			data[ i + 1 ] = array[ i + 1 ] * 255;
			data[ i + 2 ] = array[ i + 2 ] * 255;
			data[ i + 3 ] = 255;

		}

		return imagedata;

	},

	toCanvas: function ( canvas ) {

		if ( canvas === undefined ) canvas = document.createElement( 'canvas' );
		canvas.width = this.buffer.width;
		canvas.height = this.buffer.height;

		var context = canvas.getContext( '2d' );
		var imagedata = this.toImageData( context );

		context.putImageData( imagedata, 0, 0 );

		return canvas;

	}

};

TG.Program = function ( object ) {

	var tint = new Float32Array( [ 1, 1, 1 ] );

	object.tint = function ( r, g, b ) { 		// multiplies each color channel of the generated image by 'r', 'g' and 'b' respectively
		tint[ 0 ] = r;
		tint[ 1 ] = ( typeof g == 'undefined' ) ? r : g;
		tint[ 2 ] = ( typeof b == 'undefined' ) ? r : b;
		return this;
	};

	object.getTint = function () {
		return tint;
	};

	return object;

};

// --- Generators ---

TG.Fill = function () { 		// every pixel set to 1; together with tint can be used to do basic calculations (e.g. .mul( TG.Fill().tint( 2 ) ) -> double the value of each pixel)

	return new TG.Program( {
		getParams: function () {},
		getSource: function () {
			return [
				'color[ 0 ] = 1;',
				'color[ 1 ] = 1;',
				'color[ 2 ] = 1;'
			].join('\n');
		}
	} );

};

TG.SinX = function () { 		// generates a sine wave on the x and value (brightness) axes

	var params = {
		frequency: 1,
		offset: 0
	};

	return new TG.Program( {
		frequency: function ( value ) { 		// sets the 'width' of the sine wave in pixels
			params.frequency = ( 2 / value ) * Math.PI;
			return this;
		},
		offset: function ( value ) { 		// moves the wave by 'value' pixels
			params.offset = -value;
			return this;
		},
		getParams: function () {
			return params;
		},
		getSource: function () {
			return [
				'var value = Math.sin( ( x + params.offset ) * params.frequency );',
				'color[ 0 ] = value;',
				'color[ 1 ] = value;',
				'color[ 2 ] = value;'
			].join('\n');
		}
	} );

};

TG.SinY = function () { 		// generates a sine wave on the y and value (brightness) axes

	var params = {
		frequency: 1,
		offset: 0
	};

	return new TG.Program( {
		frequency: function ( value ) { 		// sets the 'width' of the sine wave in pixels
			params.frequency = ( 2 / value ) * Math.PI;
			return this;
		},
		offset: function ( value ) { 		// moves the wave by 'value' pixels
			params.offset = -value;
			return this;
		},
		getParams: function () {
			return params;
		},
		getSource: function () {
			return [
				'var value = Math.sin( ( y + params.offset ) * params.frequency );',
				'color[ 0 ] = value;',
				'color[ 1 ] = value;',
				'color[ 2 ] = value;'
			].join('\n');
		}
	} );

};

TG.OR = function () { 		// generates a pattern using bitwise OR on the x and y coordinates

	return new TG.Program( {
		getParams: function () {},
		getSource: function () {
			return [
				'var value = ( x | y ) / width;',
				'color[ 0 ] = value;',
				'color[ 1 ] = value;',
				'color[ 2 ] = value;'
			].join('\n');
		}
	} );

};

TG.XOR = function () { 		// generates a pattern using bitwise XOR on the x and y coordinates

	return new TG.Program( {
		getParams: function () {},
		getSource: function () {
			return [
				'var value = ( x ^ y ) / width;',
				'color[ 0 ] = value;',
				'color[ 1 ] = value;',
				'color[ 2 ] = value;'
			].join('\n');
		}
	} );

};

TG.Noise = function () { 		// generates a random noise pattern

	var params = {
		seed: TG.Utils.globalSeed++,
		size: 1
	};

	return new TG.Program( {
		seed: function ( value ) { 		// the same seed always results in the same noise pattern
			params.seed = value;
			return this;
		},
		size: function ( value ) { 		// sets the size of the pixel grid for the noise function
			params.size = value;
			return this;
		},
		getParams: function () {
			return params;
		},
		getSource: function () {
			return [
				'var value = TG.Utils.hashRNG( params.seed, Math.floor( x / params.size ), Math.floor( y / params.size ) );',
				'color[ 0 ] = value;',
				'color[ 1 ] = value;',
				'color[ 2 ] = value;'
			].join('\n');
		}
	} );

};

TG.FractalNoise = function () { 		// generates a noise pattern with extra 'depth' by overlaying noise of different sizes

	var params = {
		interpolator: new TG.ColorInterpolator( TG.ColorInterpolatorMethod.STEP ),
		seed: TG.Utils.globalSeed++,
		baseFrequency: 0.03125,
		amplitude: 0.4,
		persistence: 0.72,
		octaves: 4,
		step: 4
	};

	return new TG.Program( {
		seed: function ( value ) { 		// the same seed always results in the same noise pattern
			params.seed = value;
			return this;
		},
		baseFrequency: function ( value ) { 		// sets the size of the noise for the first octave in pixels
			params.baseFrequency = 1 / value;
			return this;
		},
		amplitude: function ( value ) { 		// sets how much 'contrast' the noise should initially have; gets decreased with each octave
			params.amplitude = value;
			return this;
		},
		persistence: function ( value ) { 		// how much the amplitude should be decreased with each octave
			params.persistence = value;
			return this;
		},
		octaves: function ( value ) { 		// how many different noise patterns are layered on top of each other
			params.octaves = Math.max( 1, value );
			return this;
		},
		step: function ( value ) { 		// how much the frequency gets decreased with each octave (e.g. a value of 2 halves the size each time)
			params.step = Math.max( 0, value );
			return this;
		},
		interpolation: function ( value ) { 		// which interpolation algorithm should be used for non-whole coordinates -> should the noise be smooth or rough? (see TG.ColorInterpolator below)
			params.interpolator.setInterpolation( value );
			return this;
		},
		getParams: function () {
			return params;
		},
		getSource: function () {
			return [
				'var value = 0;',
				'var amp = params.amplitude;',
				'var freq = params.baseFrequency;',
				'var x1, y1, dx, dy;',
				'var v1, v2, v3, v4;',
				'var i1, i2;',

				'for ( var j = 1; j <= params.octaves; j++ ) {',
					'x1 = Math.floor( x * freq ), y1 = Math.floor( y * freq );',

					'if ( params.interpolator.interpolation == TG.ColorInterpolatorMethod.STEP ) {',
						'value += TG.Utils.hashRNG( params.seed * j, x1, y1 ) * amp;',
					'} else {',
						'dx = ( x * freq ) - x1, dy = ( y * freq ) - y1;',

						'v1 = TG.Utils.hashRNG( params.seed * j, x1    , y1     );',
						'v2 = TG.Utils.hashRNG( params.seed * j, x1 + 1, y1     );',
						'v3 = TG.Utils.hashRNG( params.seed * j, x1    , y1 + 1 );',
						'v4 = TG.Utils.hashRNG( params.seed * j, x1 + 1, y1 + 1 );',

						'params.interpolator.set( [',
							'{ pos: 0, color: [ v1 ] },',
							'{ pos: 1, color: [ v2 ] }',
						'] );',

						'i1 = params.interpolator.getColorAt( dx )[ 0 ];',

						'params.interpolator.set( [',
							'{ pos: 0, color: [ v3 ] },',
							'{ pos: 1, color: [ v4 ] }',
						'] );',

						'i2 = params.interpolator.getColorAt( dx )[ 0 ];',

						'params.interpolator.set( [',
							'{ pos: 0, color: [ i1 ] },',
							'{ pos: 1, color: [ i2 ] }',
						'] );',

						'value += params.interpolator.getColorAt( dy )[ 0 ] * amp;',
					'}',

					'freq *= params.step;',
					'amp *= params.persistence;',
				'}',

				'color[ 0 ] = value;',
				'color[ 1 ] = value;',
				'color[ 2 ] = value;',
			].join('\n');
		}
	} );

};

TG.CellularNoise = function () { 		// noise based on the distance of randomly distributed points on the xy-plane

	var params = {
		seed: TG.Utils.globalSeed++,
		density: 32,
		weightRange: 0
	};

	return new TG.Program( {
		seed: function ( value ) { 		// the same seed always results in the same noise pattern
			params.seed = value;
			return this;
		},
		density: function ( value ) { 		// the average distance betweeen each point in pixels; negative values invert the pattern
			params.density = value;
			return this;
		},
		weightRange: function ( value ) { 		// gives some points more or less 'influence' making them bigger or smaller; too high values can break the point finding algorithm!
			params.weightRange = Math.max( 0, value );
			return this;
		},
		getParams: function () {
			return params;
		},
		getSource: function () {
			return [
				'var p = TG.Utils.cellNoiseBase( x, y, params.seed, params.density, params.weightRange );',

				'var value = 1 - ( p.dist / params.density );',
				'if ( params.density < 0 ) value -= 1;',

				'color[ 0 ] = value;',
				'color[ 1 ] = value;',
				'color[ 2 ] = value;'
			].join('\n');
		}
	} );

};

TG.VoronoiNoise = function () { 		// noise based on voronoi diagrams of randomly distributed points on the xy-plane

	var params = {
		seed: TG.Utils.globalSeed++,
		density: 32,
		weightRange: 0
	};

	return new TG.Program( {
		seed: function ( value ) { 		// the same seed always results in the same noise pattern
			params.seed = value;
			return this;
		},
		density: function ( value ) { 		// the average distance betweeen each point in pixels
			params.density = value;
			return this;
		},
		weightRange: function ( value ) { 		// gives some points more or less 'influence'; too high values can break the point finding algorithm!
			params.weightRange = Math.max( 0, value );
			return this;
		},
		getParams: function () {
			return params;
		},
		getSource: function () {
			return [
				'var p = TG.Utils.cellNoiseBase( x, y, params.seed, params.density, params.weightRange );',

				'color[ 0 ] = p.value;',
				'color[ 1 ] = p.value;',
				'color[ 2 ] = p.value;'
			].join('\n');
		}
	} );

};

TG.CellularFractal = function () { 		// generates a noise pattern with extra 'depth' by overlaying cellular noise with different densities

	var params = {
		seed: TG.Utils.globalSeed++,
		weightRange: 0,
		baseDensity: 64,
		amplitude: 0.7,
		persistence: 0.45,
		octaves: 4,
		step: 2
	};

	return new TG.Program( {
		seed: function ( value ) { 		// the same seed always results in the same noise pattern
			params.seed = value;
			return this;
		},
		baseDensity: function ( value ) { 		// sets the density for the first octave
			params.baseDensity = value;
			return this;
		},
		weightRange: function ( value ) { 		// sets the weightRange for the cellular noise; see TG.CellularNoise above
			params.weightRange = Math.max( 0, value );
			return this;
		},
		amplitude: function ( value ) { 		// sets how much 'contrast' the noise should initially have; gets decreased with each octave
			params.amplitude = value;
			return this;
		},
		persistence: function ( value ) { 		// how much the amplitude should be decreased with each octave
			params.persistence = value;
			return this;
		},
		octaves: function ( value ) { 		// how many different noise patterns are layered on top of each other
			params.octaves = Math.max( 1, value );
			return this;
		},
		step: function ( value ) { 		// how much the density gets decreased with each octave (e.g. a value of 2 halves the density each time)
			params.step = Math.max( 1, value );
			return this;
		},
		getParams: function () {
			return params;
		},
		getSource: function () {
			return [
				'var p;',
				'var value = 0;',
				'var amp = params.amplitude;',
				'var dens = params.baseDensity;',

				'for ( var j = 1; j <= params.octaves; j++ ) {',
					'p = TG.Utils.cellNoiseBase( x, y, params.seed * j, dens, params.weightRange );',

					'p.dist = 1 - ( p.dist / dens );',
					'if ( dens < 0 ) p.dist -= 1;',

					'value += p.dist * amp;',
					'dens /= params.step;',
					'amp *= params.persistence;',
				'}',

				'color[ 0 ] = value;',
				'color[ 1 ] = value;',
				'color[ 2 ] = value;',
			].join('\n');
		}
	} );

};

TG.VoronoiFractal = function () { 		// generates a noise pattern with extra 'depth' by overlaying voronoi noise with different densities

	var params = {
		seed: TG.Utils.globalSeed++,
		weightRange: 0,
		baseDensity: 64,
		amplitude: 0.6,
		persistence: 0.6,
		octaves: 4,
		step: 2
	};

	return new TG.Program( {
		seed: function ( value ) { 		// the same seed always results in the same noise pattern
			params.seed = value;
			return this;
		},
		baseDensity: function ( value ) { 		// sets the density for the first octave
			params.baseDensity = value;
			return this;
		},
		weightRange: function ( value ) { 		// sets the weightRange for the voronoi noise; see TG.VoronoiNoise above
			params.weightRange = Math.max( 0, value );
			return this;
		},
		amplitude: function ( value ) { 		// sets how much 'contrast' the noise should initially have; gets decreased with each octave
			params.amplitude = value;
			return this;
		},
		persistence: function ( value ) { 		// how much the amplitude should be decreased with each octave (values over 1 increase the amplitude instead)
			params.persistence = value;
			return this;
		},
		octaves: function ( value ) { 		// how many different noise patterns are layered on top of each other
			params.octaves = Math.max( 1, value );
			return this;
		},
		step: function ( value ) { 		// how much the density gets decreased with each octave (e.g. a value of 2 halves the density each time)
			params.step = Math.max( 1, value );
			return this;
		},
		getParams: function () {
			return params;
		},
		getSource: function () {
			return [
				'var p;',
				'var value = 0;',
				'var amp = params.amplitude;',
				'var dens = params.baseDensity;',

				'for ( var j = 1; j <= params.octaves; j++ ) {',
					'p = TG.Utils.cellNoiseBase( x, y, params.seed * j, dens, params.weightRange );',

					'value += p.value * amp;',
					'dens /= params.step;',
					'amp *= params.persistence;',
				'}',

				'color[ 0 ] = value;',
				'color[ 1 ] = value;',
				'color[ 2 ] = value;',
			].join('\n');
		}
	} );

};

TG.CheckerBoard = function () { 		// generates a grid pattern of alternating black and white cells

	var params = {
		size: [ 32, 32 ],
		offset: [ 0, 0 ],
		rowShift: 0
	};

	return new TG.Program( {
		size: function ( x, y ) { 		// sets the width and height of each square in pixels
			if ( typeof y == "undefined" ) y = x;
			params.size = [ x, y ];
			return this;
		},
		offset: function ( x, y ) { 		// moves the origin of the pattern to 'x' and 'y' in pixels
			params.offset = [ -x, -y ];
			return this;
		},
		rowShift: function ( value ) { 		// offsets each row by 'value' pixels
			params.rowShift = value;
			return this;
		},
		getParams: function () {
			return params;
		},
		getSource: function () {
			return [
				'var value = ( ( ( y + params.offset[ 1 ] ) / params.size[ 1 ] ) & 1 ) ^ ( ( ( x + params.offset[ 0 ] + parseInt( y / params.size[ 1 ] ) * params.rowShift ) / params.size[ 0 ] ) & 1 ) ? 0 : 1',
				'color[ 0 ] = value;',
				'color[ 1 ] = value;',
				'color[ 2 ] = value;'
			].join('\n');
		}
	} );

};

TG.Rect = function () { 		// generates a basic white rectangle

	var params = {
		position: [ 0, 0 ],
		size: [ 32, 32 ]
	};

	return new TG.Program( {
		position: function ( x, y ) { 		// sets the coordinates of the top-leftmost point of the rectangle
			params.position = [ x, y ];
			return this;
		},
		size: function ( x, y ) { 		// sets the width and height of the rectangle
			if ( typeof y == "undefined" ) y = x;
			params.size = [ x, y ];
			return this;
		},
		getParams: function () {
			return params;
		},
		getSource: function () {
			return [
				'var value = ( x >= params.position[ 0 ] && x <= ( params.position[ 0 ] + params.size[ 0 ] ) && y <= ( params.position[ 1 ] + params.size[ 1 ] ) && y >= params.position[ 1 ] ) ? 1 : 0;',
				'color[ 0 ] = value;',
				'color[ 1 ] = value;',
				'color[ 2 ] = value;'
			].join('\n');
		}
	} );

};

TG.Circle = function () { 		// generates a basic white circle

	var params = {
		position: [ 0, 0 ],
		radius: 50,
		delta: 1
	};

	return new TG.Program( {
		delta: function ( value ) { 		// sets how many pixels from the edge of the circle the brightness should gradually decrease; 0 results in a completely crisp circle
			params.delta = value;
			return this;
		},
		position: function ( x, y ) { 		// sets the coordinates of the center of the circle
			params.position = [ x, y ];
			return this;
		},
		radius: function ( value ) { 		// sets the radius of the circle in pixels
			params.radius = value;
			return this;
		},
		getParams: function () {
			return params;
		},
		getSource: function () {
			return [
				'var dist = TG.Utils.distance( x, y, params.position[ 0 ], params.position[ 1 ] );',
				'var value = 1 - TG.Utils.smoothStep( params.radius - params.delta, params.radius, dist );',
				'color[ 0 ] = value;',
				'color[ 1 ] = value;',
				'color[ 2 ] = value;'
			].join('\n');
		}
	} );

};

TG.PutTexture = function ( texture ) { 		// puts an already existing texture onto another one

	var params = {
		offset: [ 0, 0 ],
		repeat: false,
		srcTex: texture.buffer
	};

	return new TG.Program( {
		offset: function ( x, y ) { 		// sets the coordinates of the top-leftmost point
			params.offset = [ x, y ];
			return this;
		},
		repeat: function ( value ) { 		// which algorithm should be used on coordinates outside of the texture; 1 = wrap around, 2 = wrap around but mirrored, 3 = extend the last pixel
			params.repeat = value;
			return this;
		},
		getParams: function () {
			return params;
		},
		getSource: function () {
			return [
				'var texWidth = params.srcTex.width;',
				'var texHeight = params.srcTex.height;',

				'var texX = Math.floor( x - params.offset[ 0 ] );',
				'var texY = Math.floor( y - params.offset[ 1 ] );',

				'if ( texX >= texWidth || texY >= texHeight || texX < 0 || texY < 0 ) {',
					'if ( params.repeat ) {',
						'var nx, ny;',
						'var rangeX = texWidth - 1;',
						'var rangeY = texHeight - 1;',

						'if ( params.repeat == 1 ) {',
							'nx = TG.Utils.wrap( texX, 0, texWidth );',
							'ny = TG.Utils.wrap( texY, 0, texHeight );',
						'} else if ( params.repeat == 2 ) {',
							'nx = TG.Utils.mirroredWrap( texX, 0, rangeX );',
							'ny = TG.Utils.mirroredWrap( texY, 0, rangeY );',
						'} else if ( params.repeat == 3 ) {',
							'nx = TG.Utils.clamp( texX, 0, rangeX );',
							'ny = TG.Utils.clamp( texY, 0, rangeY );',
						'}',

						'color = params.srcTex.getPixelNearest( nx, ny );',
					'} else {',
						'color[ 0 ] = 0;',
						'color[ 1 ] = 0;',
						'color[ 2 ] = 0;',
					'}',
				'} else color = params.srcTex.getPixelNearest( texX, texY );',
			].join( '\n' );
		}
	} );

};

TG.RadialGradient = function () { 		// generates a circular gradient around a point

	var params = {
		gradient: new TG.ColorInterpolator( TG.ColorInterpolatorMethod.LINEAR ),
		radius: 255,
		center: [ 128, 128 ],
	};

	return new TG.Program( {
		repeat: function ( value ) { 		// sets how the gradient should repeat if outside of the range of the added points; 0 = clamp to the last point, 1 = wrap around, 2 = wrap around but mirrored
			params.gradient.setRepeat( value );
			return this;
		},
		radius: function ( value ) { 		// sets how far from the center the last point (i.e. position 1) of the gradient is
			params.radius = value;
			return this;
		},
		interpolation: function ( value ) { 		// sets the interpolation method of the gradient; 0 = step -> do not interpolate, 1 = linear-, 2 = spline-, 3 = cosine-interpolation
			params.gradient.setInterpolation( value );
			return this;
		},
		center: function ( x, y ) { 		// sets the center around which the gradient is generated
			params.center = [ x, y ];
			return this;
		},
		point: function ( position, r, g, b ) { 		// adds a point to the gradient; position 0 is the center and 1 is the radius
			params.gradient.addPoint( position, r, g, b );
			return this;
		},
		getParams: function () {
			return params;
		},
		getSource: function () {
			return [

				'var dist = TG.Utils.distance( x, y, params.center[ 0 ], params.center[ 1 ] );',
				'color = params.gradient.getColorAt( dist / params.radius );',

			].join('\n');
		}
	} );

};

TG.LinearGradient = function () { 		// generates a gradient across the whole texture

	var params = {
		gradient: new TG.ColorInterpolator( TG.ColorInterpolatorMethod.LINEAR )
	};

	return new TG.Program( {
		repeat: function ( value ) { 		// sets how the gradient should repeat if outside of the range of the added points; 0 = clamp to the last point, 1 = wrap around, 2 = wrap around but mirrored
			params.gradient.setRepeat( value );
			return this;
		},
		interpolation: function ( value ) { 		// sets the interpolation method of the gradient; 0 = step -> do not interpolate, 1 = linear-, 2 = spline-, 3 = cosine-interpolation
			params.gradient.setInterpolation( value );
			return this;
		},
		point: function ( position, r, g, b ) { 		// adds a point to the gradient; position 0 is x0 and 1 is the width of the texture
			params.gradient.addPoint( position, r, g, b );
			return this;
		},
		getParams: function () {
			return params;
		},
		getSource: function () {
			return [

				'color = params.gradient.getColorAt( x / width );',

			].join('\n');
		}
	} );

};

// --- Filters ---

TG.SineDistort = function () { 		// warps the texture in a wavy pattern

	var params = {
		sines: [ 4, 4 ],
		offset: [ 0, 0 ],
		amplitude: [ 16, 16 ]
	};

	return new TG.Program( {
		sines: function ( x, y ) { 		// sets the width of the sine waves on the x and y axis respectively
			if ( typeof y == "undefined" ) y = x;
			params.sines = [ x, y ];
			return this;
		},
		offset: function ( x, y ) { 		// shifts the 'phase' of each wave
			params.offset = [ x, y ];
			return this;
		},
		amplitude: function ( x, y ) { 		// sets the 'amplitude' of each wave (or intensity of the filter)
			if ( typeof y == "undefined" ) y = x;
			params.amplitude = [ x, y ];
			return this;
		},
		getParams: function () {
			return params;
		},
		getSource: function () {
			return [
				'var s = Math.sin( params.sines[ 0 ] / 100 * y + params.offset[ 0 ] ) * params.amplitude[ 0 ] + x;',
				'var t = Math.sin( params.sines[ 1 ] / 100 * x + params.offset[ 1 ] ) * params.amplitude[ 1 ] + y;',
				'color.set( src.getPixelBilinear( s, t ) );',
			].join( '\n' );
		}
	} );

};

TG.Twirl = function () { 		// distorts the texture into a vortex around a point

	var params = {
		strength: 0,
		radius: 120,
		position: [ 128, 128 ]
	};

	return new TG.Program( {
		strength: function ( value ) { 		// sets how much the texture should be rotated
			params.strength = value / 100.0;
			return this;
		},
		radius: function ( value ) { 		// sets the radius of influence
			params.radius = value;
			return this;
		},
		position: function ( x, y ) { 		// sets the coordinates of the center of the swirl
			params.position = [ x, y ];
			return this;
		},
		getParams: function () {
			return params;
		},
		getSource: function () {
			return [
				'var dist = TG.Utils.distance( x, y, params.position[ 0 ], params.position[ 1 ] );',

				// no distortion if outside of whirl radius.
				'if (dist < params.radius) {',
					'dist = Math.pow(params.radius - dist, 2) / params.radius;',

					'var angle = 2.0 * Math.PI * (dist / (params.radius / params.strength));',
					'var s = (((x - params.position[ 0 ]) * Math.cos(angle)) - ((y - params.position[ 0 ]) * Math.sin(angle)) + params.position[ 0 ] + 0.5);',
					'var t = (((y - params.position[ 1 ]) * Math.cos(angle)) + ((x - params.position[ 1 ]) * Math.sin(angle)) + params.position[ 1 ] + 0.5);',
				'} else {',
					'var s = x;',
					'var t = y;',
				'}',

				'color.set( src.getPixelBilinear( s, t ) );',
			].join( '\n' );
		}
	} );

};

TG.Transform = function () { 		// moves, rotates or scales the texture

	var params = {
		offset: [ 0, 0 ],
		angle: 0,
		scale: [ 1, 1 ]
	};

	return new TG.Program( {
		offset: function ( x, y ) { 		// moves the texture by 'x' and 'y' pixels
			params.offset = [ -x, -y ];
			return this;
		},
		angle: function ( value ) { 		// rotates the texture by 'value' degrees around the origin (x: 0, y: 0)
			params.angle = TG.Utils.deg2rad( value );
			return this;
		},
		scale: function ( x, y ) { 		// scales the texture by 'x' and 'y' (e.g. 2 doubles the size)
			x = x || 1;
			y = y || x;

			params.scale = [ x, y ];
			return this;
		},
		getParams: function () {
			return params;
		},
		getSource: function () {
			return [
				'var x2 = x - width / 2;',
				'var y2 = y - height / 2;',

				'var s = x2 * ( Math.cos( params.angle ) / params.scale[ 0 ] ) + y2 * -( Math.sin( params.angle ) / params.scale[ 0 ] );',
				'var t = x2 * ( Math.sin( params.angle ) / params.scale[ 1 ] ) + y2 *  ( Math.cos( params.angle ) / params.scale[ 1 ] );',

				's += params.offset[ 0 ] + width / 2;',
				't += params.offset[ 1 ] + height / 2;',

				'color.set( src.getPixelBilinear( s, t ) );',
			].join( '\n' );
		}
	} );

};

TG.Pixelate = function () { 		// divides the texture into 'pixels'

	var params = {
		size: [ 1, 1 ]
	};

	return new TG.Program( {
		size: function ( x, y ) { 		// set the width and height of each 'pixel'
			if ( typeof y == "undefined" ) y = x;
			params.size = [ x, y ];
			return this;
		},
		getParams: function () {
			return params;
		},
		getSource: function () {
			return [
				'var s = params.size[ 0 ] * Math.floor(x/params.size[ 0 ]);',
				'var t = params.size[ 1 ] * Math.floor(y/params.size[ 1 ]);',

				'color.set( src.getPixelNearest( s, t ) );'
			].join( '\n' );
		}
	} );

};

TG.GradientMap = function () { 		// takes the value of each pixel and maps it to a color in a gradient; best used on a grayscale image

	var params = {
		gradient: new TG.ColorInterpolator( TG.ColorInterpolatorMethod.LINEAR )
	};

	return new TG.Program( {
		repeat: function ( value ) { 		// how to map values that are out of range onto the gradient; 0 = clamp to the last (first) point of the gradient, 1 = wrap around, 2 = wrap around but mirrored
			params.gradient.setRepeat( value );
			return this;
		},
		interpolation: function ( value ) { 		// set the interpolation method for the gradient; 0 = step -> do not interpolate, 1 = linear-, 2 = spline-, 3 = cosine-interpolation
			params.gradient.setInterpolation( value );
			return this;
		},
		point: function ( position, r, g, b ) { 		// add a point to the gradient; position 0 is black and 1 is white in the original texture
			params.gradient.addPoint( position, r, g, b );
			return this;
		},
		getParams: function () {
			return params;
		},
		getSource: function () {
			return [
				'var v = src.getPixelNearest( x, y );',

				'var r = params.gradient.getColorAt( v[ 0 ] )[ 0 ];',
				'var g = params.gradient.getColorAt( v[ 1 ] )[ 1 ];',
				'var b = params.gradient.getColorAt( v[ 2 ] )[ 2 ];',

				'color[ 0 ] = r;',
				'color[ 1 ] = g;',
				'color[ 2 ] = b;'
			].join('\n');
		}
	} );

};

TG.Normalize = function () { 		// adjusts the whole texture so that every pixel is in the visible range (0 - 1)

	return new TG.Program( {
		getParams: function () {},
		getInit: function () {
			return [
				'var high = -Infinity;',
				'var low = Infinity;',

				'for ( var j = 0, len = src.array.length; j < len; j++ ) {',
					'if ( j % 4 == 3 ) continue;',

					'high = ( src.array[ j ] > high ) ? src.array[ j ] : high;',
					'low  = ( src.array[ j ] < low  ) ? src.array[ j ] : low;',
				'}',

				'var offset = -low;',
				'var multiplier = 1 / ( high - low );',
			].join( '\n' );
		},
		getSource: function () {
			return [
				'var v = src.getPixelNearest( x, y );',
				'color[ 0 ] = ( v[ 0 ] + offset ) * multiplier;',
				'color[ 1 ] = ( v[ 1 ] + offset ) * multiplier;',
				'color[ 2 ] = ( v[ 2 ] + offset ) * multiplier;'
			].join( '\n' );
		}
	} );

};

TG.Posterize = function () { 		// reduces the amount of colors in a texture

	var params = {
		step: 2
	};

	return new TG.Program( {
		step: function ( value ) { 		// sets how many possible values each color channel is divided into (2 means possible values are 0 and 1, 3 means 0, 0.5 and 1 etc.)
			params.step = Math.max( value, 2 );
			return this;
		},
		getParams: function () {
			return params;
		},
		getSource: function () {
			return [
				'var v = src.getPixelNearest( x, y );',
				'color[ 0 ] = Math.floor( v[ 0 ] / ( 1 / params.step ) ) / ( params.step - 1 );',
				'color[ 1 ] = Math.floor( v[ 1 ] / ( 1 / params.step ) ) / ( params.step - 1 );',
				'color[ 2 ] = Math.floor( v[ 2 ] / ( 1 / params.step ) ) / ( params.step - 1 );'
			].join( '\n' );
		}
	} );

};

