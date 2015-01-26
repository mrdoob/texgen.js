# texgen.js
Procedural Texture Generator

```javascript
var texture = new TG.Texture( 256, 256 )
    .add( new TG.XOR().color( 1, 0.5, 0.7 ) )
    .add( new TG.SinX().frequency( 0.004 ).color( 0.5, 0, 0 ) )
    .mul( new TG.SinY().frequency( 0.004 ).color( 0.5, 0, 0 ) )
    .add( new TG.SinX().frequency( 0.0065 ).color( 0.1, 0.5, 0.2 ) )
    .add( new TG.SinY().frequency( 0.0065 ).color( 0.5, 0.5, 0.5 ) )
    .add( new TG.Noise().color( 0.1, 0.1, 0.2 ) )
    .toCanvas();

document.body.appendChild( texture );
```
