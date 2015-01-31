# texgen.js
Procedural Texture Generator

![examples](https://raw.githubusercontent.com/mrdoob/texgen.js/master/files/samples.png)

### Usage

```javascript
var texture = new TG.Texture( 256, 256 )
    .add( new TG.XOR().tint( 1, 0.5, 0.7 ) )
    .add( new TG.SinX().frequency( 0.004 ).tint( 0.5, 0, 0 ) )
    .mul( new TG.SinY().frequency( 0.004 ).tint( 0.5, 0, 0 ) )
    .add( new TG.SinX().frequency( 0.0065 ).tint( 0.1, 0.5, 0.2 ) )
    .add( new TG.SinY().frequency( 0.0065 ).tint( 0.5, 0.5, 0.5 ) )
    .add( new TG.Noise().tint( 0.1, 0.1, 0.2 ) )
    .toCanvas();

document.body.appendChild( texture );
```
