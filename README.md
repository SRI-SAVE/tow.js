# tow.js
Makes using three.js for simple visualizations of assets simple. Strongly opinionated about lights, cameras, and the scene. In other words it does as much as possible with typical defaults.

dependencies: three.js https://github.com/mrdoob/three.js
               tween.js https://github.com/sole/tween.js (optional)


EXAMPLE:

```javascript
TOW.changeContainerById('divOrCanvasId');

TOW.loadCollada('xyz.dae', function() {
  $xyz_dae.scale.set(0.005, 0.005, 0.005);
  TOW.render();
});

TOW.loadColladas([ 'a.dae', 'b.dae' ], function() {
  TOW.render(function(delta) {
    $a.rotation.y += 0.005;
    $b.rotation.y += Math.PI * delta;
  });
});

TOW.loadCollada('a.dae', function() {
  TOW.findMeshVisibleAndCenterRender('child', $a, function(delta, pivot) {
  pivot.rotation.y += 0.005;
}, false);

TOW.intow(-1, 0.5, 0.5, -0.25, 0.025, 0.25, 0, 0, 0); // light, camera, target ... x,y,z

TWEEN: (http://sole.github.io/tween.js/examples/03_graphs.html Easing graphs)
var pivot =  TOW.findMeshAndVisibleMesh('child', $a);

TOW.render(function(delta) { pivot.rotation.y += Math.PI * delta; });
pivot.position.set(0, 0, 0);

var curZ = { z:  pivot.rotation.z };
var pull = new TWEEN.Tween(curZ)
  .to({ z: 0.52 }, 1000) // radians and milliseconds
  // .easing(TWEEN.Easing.Elastic.InOut)
  .easing(TWEEN.Easing.Exponential.InOut)
  .onUpdate(function() { curZ = pivot.rotation.z = -this.z; });
var release = new TWEEN.Tween(curZ)
  .to({ z: 0 }, 500)
  .onUpdate(function() { curZ =  pivot.rotation.z = -this.z })
  .delay(250);

pull.chain(release);
release.chain(pull);
pull.start();
```
