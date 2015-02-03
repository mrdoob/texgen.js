/**
 * @author fernandojsg / http://kile.stravaganza.org
 */

var textureSize = [ 256, 256 ];

var operations = [
	"=",
	"+",
	"-",
	"*",
	"/",
	"&",
	"^",
	"min",
	"max"
];

TGUI = {};

TGUI.GeneratorDefinitions = {
	"XOR": {
		generator: TG.XOR,
		parameters: {}
	},
	"Rect": {
		generator: TG.Rect,
		parameters: {
			"size": {
				"type": "vec2i",
				"default": [ 32, 32 ],
			},
			"position": {
				"type": "vec2i",
				"default": [ 0, 0 ],
			},
		}
	},
	"Checkerboard": {
		generator: TG.CheckerBoard,
		parameters: {
			"size": {
				"type": "vec2i",
				"default": [ 32, 32 ],
			},
			"offset": {
				"type": "vec2i",
				"default": [ 0, 0 ],
			},
			"rowShift": {
				"type": "number",
				"default": 0,
			}
		}
	},
	"OR": {
		generator: TG.OR,
		parameters: {}
	},
	"SinX": {
		generator: TG.SinX,
		parameters: {
			"frequency": {
				"type": "number",
				"default": 0.16,
				"step": 0.01,
			},
			"offset": {
				"type": "number",
				"default": 0,
				"step": 0.01,
			},
		}
	},
	"SinY": {
		generator: TG.SinY,
		parameters: {
			"frequency": {
				"type": "number",
				"default": 0.16,
				"step": 0.01,
			},
			"offset": {
				"type": "number",
				"default": 0,
				"step": 0.01,
			},
		}
	},
	"Circle": {
		generator: TG.Circle,
		parameters: {
			"position": {
				"type": "vec2i",
				"default": [ 0, 0 ],
			},
			"radius": {
				"type": "number",
				"default": 50,
			},
			"delta": {
				"type": "number",
				"default": 1,
			},
		}
	},
	"SineDistort": {
		generator: TG.SineDistort,
		parameters: {
			"sines": {
				"type": "vec2i",
				"default": [ 4, 4 ],
			},
			"offset": {
				"type": "vec2i",
				"default": [ 0, 0 ],
			},
			"amplitude": {
				"type": "vec2i",
				"default": [ 16, 16 ],
			},
		}
	},
	"Twirl": {
		generator: TG.Twirl,
		parameters: {
			"position": {
				"type": "vec2i",
				"default": [ 128, 128 ],
			},
			"radius": {
				"type": "number",
				"default": 120,
			},
			"strength": {
				"type": "number",
				"default": 0.15,
			},
		}
	},
	"Noise": {
		generator: TG.Noise,
		parameters: {
		}
	},
	"Pixelate": {
		generator: TG.Pixelate,
		parameters: {
			"size": {
				"type": "vec2i",
				"default": [ 1, 1 ],
			},
		}
	},
	"Transform": {
		generator: TG.Transform,
		parameters: {
			"offset": {
				"type": "vec2f",
				"default": [ 0, 0 ],
			},
			"scale": {
				"type": "vec2f",
				"default": [ 1, 1 ],
			},
			"angle": {
				"type": "number",
				"default": 0,
			},
		}
	},

};

TGUI.TextureStep = function( id, type ) {
	this.type = type;
	this.id = id;
	this.params = {};

 	var definition = TGUI.GeneratorDefinitions[ type ];
 	for ( var paramId in definition.parameters ) {
		this.params[ paramId ] = definition.parameters[ paramId ][ 'default' ];
	}

	this.operation = "+";
}

function changeOperation( select, id ) {

	var step = texture.getStepById( id );

	if ( step.value !== null ) {

		step.value.operation = select.value;
		texture.render();

	}
}

function generateOperationSelect(id, operation) {

	var html = '<select onchange="changeOperation(this, '+id+')">';
	for (var i = 0; i < operations.length; i++ ) {
		if ( operation == operations[ i ] )
			html+= '<option selected="selected" value="' + operations[ i ]+ '">' + operations[ i ] + '</option>';
		else
			html+= '<option value="' + operations[ i ]+ '">' + operations[ i ] + '</option>';
	}

	html+='</select>';
	return html;


}


TGUI.Texture = function() {

	this.steps = [];
	this.name = "Unknown";
	this.counter = 0;
	this.width = textureSize[ 0 ];
	this.height = textureSize[ 1 ];

}

TGUI.Texture.prototype = {

	render: function () {

		var code = 'var texture = new TG.Texture( ' + this.width +', ' + this.height + ' )';

		var _texture = new TG.Texture( 256, 256 );

		for ( var i = 0; i < texture.steps.length; i++ ) {

			var step = texture.steps[ i ];
			var definition = TGUI.GeneratorDefinitions[ step.type ];
			var layer = new definition.generator;

			var paramString = "";
			for ( var id in step.params ) {

				layer.getParams()[ id ] = step.params[ id ];

				if ( step.params[ id ] instanceof Array )
					paramString += '.' + id + '( ' + step.params[ id ].join( ', ' ) + ' )';
				else
					paramString += '.' + id + '( ' + step.params[ id ] + ' )';

			}

			switch( step.operation ) {

				case '=': _texture.set( layer ); break;
				case '+': _texture.add( layer ); break;
				case '-': _texture.sub( layer ); break;
				case '*': _texture.mul( layer ); break;
				case '/': _texture.div( layer ); break;
				case '&': _texture.and( layer ); break;
				case '^': _texture.xor( layer ); break;
				case 'min': _texture.min( layer ); break;
				case 'max': _texture.max( layer ); break;

			}

			var operationsFunc = { //@todo remove
				"=": "set",
				"+": "add",
				"-": "sub",
				"*": "mul",
				"/": "div",
				"&": "and",
				"^": "xor",
				"min": "min",
				"max": "max"
			};

			code += '\n\t.' + operationsFunc[ step.operation ] + '( new TG.' + step.type + '()' + paramString + ' )';

		}
		code+=";";

		ctx.putImageData( _texture.toImageData( ctx ), 0, 0 );

		cube.material.map.needsUpdate = true;

		document.getElementById("code").innerHTML = code;
		Prism.highlightAll();

	},

	getStepById: function ( id ) {

		for ( var i = 0; i < this.steps.length; i++ ) {
			if ( this.steps[ i ].id == id )
				return { index: i, value: this.steps[ i ] };
		}

		return { index: -1, value: null };
	},

	deleteStep: function ( id ) {

		var step = this.getStepById( id );

		if ( step.index !== -1 ) {

			delete this.steps[ step.index ];
			this.steps.splice( step.index, 1 );

			this.regenerateStepList();
			texture.render();

		}
		
	},

	regenerateStepList: function () {

		var options = [];

		for ( var i = 0; i < this.steps.length; i ++ ) {

			var step = this.steps[ i ];
			var select = generateOperationSelect( step.id, step.operation );
			options.push( { value: step.id, html: select + ' (ID=' + step.id + ') ' + step.type +' <button onclick="texture.deleteStep(' + step.id + ')" style="color:#f99;float:right">delete</button>'} );

		}

		stepList.setOptions( options );

		if ( this.steps.length > 0 ) {

			var lastId = this.steps[ this.steps.length - 1 ].id;
			stepList.setValue( lastId );
			generatorSelected( lastId );

		} else {

			if ( currentGenerator != null ) {
				generatorPanels[ currentGenerator.type ].dom.style.display = "none";
			}

		}

	},

	add: function ( type, operation ) {

		var id = this.counter++;
		var machine = new TGUI.TextureStep( id, type );
		this.steps.push( machine );

		this.regenerateStepList();
		this.render();

	}
}

function updateControlParameter( e ) {

	if ( e.srcElement.id.indexOf(".") !== -1 ) {

		var ids = e.srcElement.id.split(".");
		currentGenerator.params[ ids[ 0 ] ][ parseInt( ids[ 1 ] ) ] = e.srcElement.value;

	} else {

		currentGenerator.params[ e.srcElement.id ] = e.srcElement.value;

	}

	texture.render();

}

function generatorSelected( id ) {

	if ( currentGenerator != null ) {
		generatorPanels[ currentGenerator.type ].dom.style.display = "none";
	}

	var step = texture.getStepById( id );

	if ( step.index == -1 )
		return;

	currentGenerator = step.value;
	var type = currentGenerator.type;
	generatorPanels[ type ].dom.style.display = "block";

	for ( var idParam in TGUI.GeneratorDefinitions[ type ].parameters ) {

		param = TGUI.GeneratorDefinitions[ type ].uiparameters[ idParam ];

		if ( param.length > 1 ) {

			for ( var i = 0; i < param.length; i ++ )
				param[ i ].setValue( currentGenerator.params[ idParam ][ i ] );

		} else {

			param[ 0 ].setValue( currentGenerator.params[ idParam ] );
		}

	}

}

function init() {

	var canvas = document.getElementById('preview');
	canvas.width = textureSize[ 0 ];
	canvas.height = textureSize[ 1 ];
	ctx = canvas.getContext('2d');

	init3D();

	var container = new UI.Panel();
	stepList = new UI.FancySelect();
	stepList.onChange( function () {

		generatorSelected( stepList.getValue() );

	} );

	document.getElementById("sidebar2").appendChild( stepList.dom );

	for ( var definitionId in TGUI.GeneratorDefinitions ) {

		var panel = new UI.CollapsiblePanel();
		panel.setId( definitionId );

		panel.addStatic( new UI.Text().setValue( definitionId ) );
		generatorPanels[ definitionId ] = panel;

		panel.add( new UI.Break() );
		container.add( panel );

		var parameters = TGUI.GeneratorDefinitions[ definitionId ].parameters;
		TGUI.GeneratorDefinitions[ definitionId ].panel = panel;
		TGUI.GeneratorDefinitions[ definitionId ].uiparameters = {};

		for ( var idParam in parameters ) {

			var param = parameters[ idParam ];

			var row = new UI.Panel();

			TGUI.GeneratorDefinitions[ definitionId ].uiparameters[ idParam ] = [];

			row.setId( definitionId + "." + idParam );
			row.add( new UI.Text( idParam ).setWidth( '90px' ) );

			switch ( param.type ) {

				case "number":
					var c = new UI.Number().setWidth( '50px' ).onChange( updateControlParameter ).setId( idParam );
					if ( param.step )
						c.step = param.step;

					TGUI.GeneratorDefinitions[ definitionId ].uiparameters[ idParam ].push(c);

					row.add( c );
					break;

				case "vec2i":
					var c1 = new UI.Integer().setWidth( '50px' ).onChange( updateControlParameter ).setId( idParam+'.0');
					var c2 = new UI.Integer().setWidth( '50px' ).onChange( updateControlParameter ).setId( idParam+'.1');
					TGUI.GeneratorDefinitions[ definitionId ].uiparameters[ idParam ].push(c1);
					TGUI.GeneratorDefinitions[ definitionId ].uiparameters[ idParam ].push(c2);
					row.add( c1, c2 );
					break;

				case "vec2f":
					var c1 = new UI.Number().setWidth( '50px' ).onChange( updateControlParameter ).setId( idParam+'.0');
					var c2 = new UI.Number().setWidth( '50px' ).onChange( updateControlParameter ).setId( idParam+'.1');
					TGUI.GeneratorDefinitions[ definitionId ].uiparameters[ idParam ].push(c1);
					TGUI.GeneratorDefinitions[ definitionId ].uiparameters[ idParam ].push(c2);
					row.add( c1, c2 );
					break;

				case "boolean":
					var c = new UI.Checkbox().setWidth( '50px' ).onChange( updateControlParameter );
					TGUI.GeneratorDefinitions[ definitionId ].uiparameters[ idParam ].push(c);
					row.add( c );
					break;

				case "color":
					var c = new UI.Color().setWidth( '50px' );
					TGUI.GeneratorDefinitions[ definitionId ].uiparameters[ idParam ].push(c);
					row.add( c );
					break;

				default:
					console.error("Unknown param type",param.type);
			}

			panel.add( row );

		}

		panel.dom.style.display = "none";

	}

	document.getElementById("sidebar").appendChild( container.dom );

}

var cube;
var sphere;
var material;

function init3D() {

	var scene = new THREE.Scene();

	var container = document.getElementById("preview3d");

	var camera = new THREE.PerspectiveCamera( 50, container.clientWidth / container.clientHeight, 0.1, 1000 );
	var renderer = new THREE.WebGLRenderer( { antialias: true } );

	renderer.setSize( container.clientWidth, container.clientHeight );
	document.getElementById("preview3d").appendChild( renderer.domElement );

	material =  new THREE.MeshBasicMaterial( {
		color: 0xffffff,
		transparent: true,
		map: new THREE.Texture( document.getElementById("preview") ) } );

	// Add cube
	var cubeGeometry = new THREE.BoxGeometry( 10, 10, 10 );
	cube = new THREE.Mesh( cubeGeometry, material );
	scene.add( cube );

	var sphereGeometry = new THREE.SphereGeometry( 7, 10, 10 );
	sphere = new THREE.Mesh( sphereGeometry, material );
	scene.add( sphere );
	sphere.visible = false;

	scene.add( new THREE.AmbientLight( 0x111111 ) );

	camera.position.z = 20;

	function renderScene() {
		requestAnimationFrame( renderScene );

		var timer = 0.0005 * Date.now();

		cube.rotation.y = timer;
		sphere.rotation.y = timer;

		renderer.render(scene, camera);
	}

	renderScene();
}

function showObject( button ) {

	if ( button.id == "cube" ) {

		cube.visible = true;
		sphere.visible = false;
		button.className = "selected";
		document.getElementById("sphere").className = "";

	} else {

		cube.visible = false;
		sphere.visible = true;
		button.className = "selected";
		document.getElementById("cube").className = "";

	}

}

var texture = new TGUI.Texture();
var stepList;
var currentGenerator = null;
var generatorPanels = {};
var ctx;
