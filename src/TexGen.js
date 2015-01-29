/**
 * @author mrdoob / http://mrdoob.com/
 */

var TG = {
	OP: {
		SET: function( x, y ) { return y; },
		ADD: function( x, y ) { return x + y; },
		SUB: function( x, y ) { return x - y; },
		MUL: function( x, y ) { return x * y; },
		DIV: function( x, y ) { return x / y; },
		AND: function( x, y ) { return x & y; },
		XOR: function( x, y ) { return x ^ y; },
		MIN: function( x, y ) { return Math.min( x, y ); },
		MAX: function( x, y ) { return Math.max( x, y ); }
	}
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
			program.getSourcePreLoop ? program.getSourcePreLoop() : "",
			'for ( var i = 0, il = array.length; i < il; i += 4 ) {',
				'	' + program.getSource(),
				'	array[ i     ] = operation( array[ i     ], color[ 0 ] * tint[ 0 ] );',
				'	array[ i + 1 ] = operation( array[ i + 1 ], color[ 1 ] * tint[ 1 ] );',
				'	array[ i + 2 ] = operation( array[ i + 2 ], color[ 2 ] * tint[ 2 ] );',
				'	if ( ++x === width ) { x = 0; y ++; }',
			'}'
		].join( '\n' );

		new Function( 'operation, dst, src, color, params, tint', string )( operation, this.buffer, this.bufferCopy, this.color, program.getParams(), program.getTint() );

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

	var tint = new Float32Array( [ 1, 1, 1 ] );

	object.tint = function ( r, g, b ) {
		tint[ 0 ] = r;
		tint[ 1 ] = g;
		tint[ 2 ] = b;
		return this;
	};

	object.getTint = function () {
		return tint;
	};

	return object;

};

TG.Number = function () {

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

TG.SinX = function () {

	var params = {
		frequency: 1,
		offset: 0
	};

	return new TG.Program( {
		frequency: function ( value ) {
			params.frequency = value * Math.PI;
			return this;
		},
		offset: function ( value ) {
			params.offset = value;
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

TG.SinY = function () {

	var params = {
		frequency: 1,
		offset: 0
	};

	return new TG.Program( {
		frequency: function ( value ) {
			params.frequency = value * Math.PI;
			return this;
		},
		offset: function ( value ) {
			params.offset = value;
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

TG.OR = function () {

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

TG.XOR = function () {

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

TG.Noise = function () {

	return new TG.Program( {
		getParams: function () {},
		getSource: function () {
			return [
				'var value = Math.random();',
				'color[ 0 ] = value;',
				'color[ 1 ] = value;',
				'color[ 2 ] = value;'
			].join('\n');
		}
	} );

};

TG.CheckerBoard = function () {

	var params = {
		size: [ 32, 32 ],
		offset: [ 0, 0 ],
		rowShift: 0
	};

	return new TG.Program( {
		size: function ( x, y ) {
			params.size = [ x, y ];
			return this;
		},
		offset: function ( x, y ) {
			params.offset = [ x, y ];
			return this;
		},
		rowShift: function ( value ) {
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

TG.Rect = function () {

	var params = {
		position: [ 0, 0 ],
		size: [ 32, 32 ]
	};

	return new TG.Program( {
		position: function ( x, y ) {
			params.position = [ x, y ];
			return this;
		},
		size: function ( x, y ) {
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

TG.Circle = function () {

	var params = {
		position: [ 0, 0 ],
		radius: 50,
		delta: 1
	};

	return new TG.Program( {
		delta: function ( value ) {
			params.delta = value;
			return this;
		},
		position: function ( x, y ) {
			params.position = [ x, y ];
			return this;
		},
		radius: function ( value ) {
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

// Filters

TG.SineDistort = function () {

	var params = {
		sines: [ 4, 4 ],
		offset: [ 0, 0 ],
		amplitude: [ 16, 16 ]
	};

	return new TG.Program( {
		sines: function ( x, y ) {
			params.sines = [ x, y ];
			return this;
		},
		offset: function ( x, y ) {
			params.offset = [ x, y ];
			return this;
		},
		amplitude: function ( x, y ) {
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

TG.Twirl = function () {

	var params = {
		strength: 0,
		radius: 120,
		position: [ 128, 128 ]
	};

	return new TG.Program( {
		strength: function ( value ) {
			params.strength = value / 100.0;
			return this;
		},
		radius: function ( value ) {
			params.radius = value;
			return this;
		},
		position: function ( x, y ) {
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
					's = (((x - params.position[ 0 ]) * Math.cos(angle)) - ((y - params.position[ 0 ]) * Math.sin(angle)) + params.position[ 0 ] + 0.5);',
					't = (((y - params.position[ 1 ]) * Math.cos(angle)) + ((x - params.position[ 1 ]) * Math.sin(angle)) + params.position[ 1 ] + 0.5);',
				'} else {',
					's = x;',
					't = y;',
				'}',

				'color.set( src.getPixelBilinear( s, t ) );',
			].join( '\n' );
		}
	} );

};

TG.Transform = function () {

	var params = {
		offset: [ 0, 0 ],
		angle: 0,
		scale: [ 1, 1 ]
	};

	return new TG.Program( {
			offset: function ( x, y ) {
				params.offset = [ x, y ];
				return this;
			},
			angle: function ( value ) {
				params.angle = TG.Utils.deg2rad( value );
				return this;
			},
			scale: function ( x, y ) {
				if ( x === 0 || y === 0 ) return;
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

TG.Pixelate = function () {

	var params = {
		size: [ 1, 1 ]
	};

	return new TG.Program( {
		size: function ( x, y ) {
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

// Buffer

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

// 

TG.ColorInterpolator = {
	STEP: 0,
	LINEAR: 1,
	SPLINE: 2,
};

// points must be a set pair (point, color):
// [{ pos0: [r,g,b,a] } , ..., { posN: [r,g,b,a] } ] posX from 0..1
TG.GradientInterpolator = function( ) {

	this.points = [];
	this.interp = TG.ColorInterpolator.SPLINE;
	
	return this;
};

TG.GradientInterpolator.prototype = {

	set: function( points ) {

		this.points = points;
		return this;

	},

	addPoint: function ( position, color ) {

		this.points.push( { pos: position, color: color } );
		this.points.sort( function( a, b ) {
			return a.pos - b.pos;
		});
		return this;		

	},

	interpolation: function ( value ) {

		this.interp = value;
		return this;
		
	},

	getColorAt: function ( pos ) {

		if (pos > 1) pos = 1;

		for (var i = 0; this.points[ i + 1 ].pos < pos; i++ );
   		
   		var p1 = this.points[ i ];
   		var p2 = this.points[ i + 1 ];

		var delta = ( pos - this.points[ i ].pos ) / ( this.points[ i + 1 ].pos - this.points[ i ].pos );

		
		if ( this.interp == TG.ColorInterpolator.STEP ) {

			return p1.color;

		}
		else if ( this.interp == TG.ColorInterpolator.LINEAR ) {

   			return TG.Utils.mixColors( p1.color, p2.color, delta );

		}
		else if ( this.interp == TG.ColorInterpolator.SPLINE ) {

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

	         return [ ar * delta3 + br * delta2 + dr,
	         		  ag * delta3 + bg * delta2 + dg,
	         		  ab * delta3 + bb * delta2 + db ];

		}
	}

};

TG.RadialGradient = function () {

	var params = {
		interpolation: TG.ColorInterpolator.LINEAR,
		gradient: new TG.GradientInterpolator(),
		radius: 255,
	};

	return new TG.Program( {
		
		interpolation: function ( value ) {
			params.interpolation = value;
			return this;
		},
		getParams: function () {
			return params;
		},
		point: function ( position, color ) {
			params.gradient.addPoint( position, color );
			return this;
		},
		getSourcePreLoop: function() {
			return 'var gradient = new TG.GradientInterpolator().set( '+ JSON.stringify( params.gradient.points ) +').interpolation(' + params.interpolation + ');';
		},
		getSource: function () {
			return [
				
				'var dist = TG.Utils.distance( x, y, width / 2, height / 2 );',
				'color = gradient.getColorAt( dist / params.radius );',

			].join('\n');
		}
	} );

};

TG.LinearGradient = function () {

	var params = {
		interpolation: TG.ColorInterpolator.LINEAR,
		gradient: new TG.GradientInterpolator(),
	};

	return new TG.Program( {
		
		interpolation: function ( value ) {
			params.interpolation = value;
			return this;
		},
		getParams: function () {
			return params;
		},
		point: function ( position, color ) {
			params.gradient.addPoint( position, color );
			return this;
		},
		getSourcePreLoop: function() {
			return 'var gradient = new TG.GradientInterpolator().set( '+ JSON.stringify( params.gradient.points ) +').interpolation(' + params.interpolation + ');';
		},
		getSource: function () {
			return [
				
				'color = gradient.getColorAt( x / width );',

			].join('\n');
		}
	} );

};


//

TG.Utils = {

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

	deg2rad: function ( deg ) {

		return deg * Math.PI / 180;

	}

};
