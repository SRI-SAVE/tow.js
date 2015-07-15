// Copyright 2014, SRI International
// tow.js
// dependencies: three.js https://github.com/mrdoob/three.js
//               tween.js https://github.com/sole/tween.js (optional)

/*
EXAMPLE:

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
*/

var TOW = { REVISION: '0.5' };

TOW.Fov = 40;
TOW.Near = 0.1;
TOW.Far = 10000;
TOW.ContainerWidth = window.innerWidth;
TOW.ContainerHeight = window.innerHeight;
TOW.TWEEN = true;
TOW.Canvas = undefined;
TOW.Light = undefined;
TOW.Scene = new THREE.Scene();
TOW.Camera =  new THREE.PerspectiveCamera(TOW.Fov, TOW.ContainerWidth / TOW.ContainerHeight, TOW.Near, TOW.Far);
TOW.Renderer = new THREE.WebGLRenderer({ width: TOW.ContainerWidth, height: TOW.ContainerHeight, antialias: true });
TOW.Loader = new THREE.ColladaLoader();

TOW.Loader.options.convertUpAxis = true;
TOW.Renderer.setSize(TOW.ContainerWidth, TOW.ContainerHeight);

// light, camera, target (optional) => x, y, z grid (optional)
TOW.intow = function(lightX, lightY, lightZ, posX, posY, posZ, lookX, lookY, lookZ, grid) {
  lookX = lookX || 0;
  lookY = lookY || 0;
  lookZ = lookZ || 0;
  grid = grid || true;
  TOW.Light = TOW.addLight();
  TOW.addLight({ type: 'Ambient' });
  TOW.Light.position.set(lightX, lightY, lightZ);
  TOW.Camera.position.set(posX, posY, posZ);
  TOW.Camera.lookAt(new THREE.Vector3(lookX, lookY, lookZ));

  if (grid) TOW.addGrid(10, 1, 0x808080); // #808080
};

TOW.changeContainerById = function(id) {
  var container = document.getElementById(id);

  TOW.ContainerWidth = container.clientWidth; //style.width;
  TOW.ContainerHeight = container.clientHeight; //style.height;
  TOW.Camera =  new THREE.PerspectiveCamera(TOW.Fov, TOW.ContainerWidth / TOW.ContainerHeight, TOW.Near, TOW.Far);;
  TOW.Canvas = container;

  if (container.tagName === 'CANVAS') {
    TOW.Renderer = new THREE.WebGLRenderer({ canvas: TOW.Canvas, width: TOW.ContainerWidth, height: TOW.ContainerHeight, antialias: true });
    TOW.Renderer.setSize(TOW.ContainerWidth, TOW.ContainerHeight);
  } else {
    TOW.Renderer = new THREE.WebGLRenderer({ width: TOW.ContainerWidth, height: TOW.ContainerHeight, antialias: true });
    TOW.Renderer.setSize(TOW.ContainerWidth, TOW.ContainerHeight);
    container.appendChild(TOW.Renderer.domElement);
  }
};

TOW.addGrid = function(size, step, lineColor) {
  var geometry = new THREE.Geometry();
  var material = new THREE.LineBasicMaterial({ color: lineColor });
  var line = new THREE.Line(geometry, material, THREE.LinePieces);

  for (var i = -size; i <= size; i += step) {
    geometry.vertices.push(new THREE.Vector3(-size, - 0, i));
    geometry.vertices.push(new THREE.Vector3(size, - 0, i));
    geometry.vertices.push(new THREE.Vector3(i, - 0, -size));
    geometry.vertices.push(new THREE.Vector3(i, - 0, size));
  }

  TOW.Scene.add(line);
  return line;
};

TOW.addLight = function(options) {
  options = options || { };

  var color = options.color || 0xffffff;
  var light = new THREE.DirectionalLight(color, options.intensity);

  switch (options.type) {
  case 'Ambient':
    light = new THREE.AmbientLight(color);
    break;
  case 'Directional':
    light = new THREE.DirectionalLight(color, options.intensity);
    break;
  case 'Point':
    light = new THREE.PointLight(color, options.intensity, options.distance);
    break;
  }

  if (options.type != 'ambient') light.position = options.position || new THREE.Vector3(-1, 1, -1);

  TOW.Scene.add(light);
  return light;
};

TOW.getRootName = function(url) {
  var parts = url.split('/');

  return parts[ parts.length - 1 ].replace('.', '_');
};

TOW.loadColladaFromXmlString = function(xmlString, url, onLoad, visible, rootName) {
  rootName = rootName || TOW.getRootName(url);
  visible = visible === undefined? true : visible;
  TOW.Loader.loadFromXmlString(xmlString, url, function(collada) {
    collada.scene.name = rootName;
    TOW.Scene.add(collada.scene);
    eval('$' + rootName + ' = collada.scene');

    if (!visible) TOW.invisibleSceneChildren(collada.scene);
    if (onLoad !== undefined) onLoad(collada.scene);
  });
};

TOW.loadCollada = function(url, onLoad, visible, rootName) {
  rootName = rootName || TOW.getRootName(url);
  visible = visible === undefined? true : visible;
  TOW.Loader.load(url, function(collada) {
    collada.scene.name = rootName;
    TOW.Scene.add(collada.scene);
    eval('$' + rootName + ' = collada.scene');
    
    if (!visible) TOW.invisibleSceneChildren(collada.scene);
    if (onLoad !== undefined) onLoad(collada.scene);
  });
};

TOW.loadColladas = function(urls, onLoaded, visible) {
  visible = visible === undefined? false : visible;

  var count = urls.length;
  var daeObj3Ds = [ ];
  var onCompleted = function(daeObj3D) {
    daeObj3Ds.push(daeObj3D);

    if (--count == 0 && onLoaded !== undefined) onLoaded(daeObj3Ds);
  };

  urls.forEach(function(url) { TOW.loadCollada(url, onCompleted, visible); });
};

// there is a strange bug were it works for one mesh in a collada scene, i.e. the first, but not for the next.
// subsequent calls do not center, suspect in THREE.GeometryUtils.center it does
// ... geometry.applyMatrix( new THREE.Matrix4().makeTranslation( offset.x, offset.y, offset.z ) ); cause?
// why is clone not preventing it, need deep clone?
TOW.centerGeometry = function(mesh, scene) {
  scene = scene || TOW.Scene;
  THREE.SceneUtils.detach(mesh, mesh.parent, scene);

  var delta = THREE.GeometryUtils.center(mesh.geometry.clone());

  mesh.geometry.applyMatrix(new THREE.Matrix4().setPosition(delta));
  mesh.position.set(0, 0, 0);
};

TOW.centerGeometryOffsetPivot = function(mesh, scene) {
  scene = scene || TOW.Scene;
  // mesh.__prematrix = mesh.matrix.clone();
  mesh.position.set(0, 0, 0);

  var offset = new THREE.Object3D();
  var pivot = new THREE.Object3D();
  var delta = THREE.GeometryUtils.center(mesh.geometry.clone());

  offset.applyMatrix(new THREE.Matrix4().setPosition(delta));
  mesh.parent.remove(mesh);
  offset.add(mesh);
  pivot.add(offset);
  scene.add(pivot);
};

// Experimental and not working correct in dae tests
TOW.restoreCenteredGeometryOffsetPivot = function(mesh, scene) {
  scene = scene || TOW.Scene;
  mesh.applyMatrix(mesh.__prematrix);

  var offset = mesh.parent;
  var pivot = mesh.parent.parent;

  mesh.parent.remove(mesh);
  pivot.remove(offset);
  scene.remove(pivot);
  scene.add(mesh);
  delete mesh.__prematrix;
};

TOW.findMeshAndInvisibleChildren = function(name, scene) {
  scene = scene || TOW.Scene;

  var mesh;

  scene.traverse(function(child) {
    if (child instanceof THREE.Mesh && child.name == name) {
      mesh = child;
    } else {
      child.visible = false;
    }
  });
  return mesh;
};

TOW.findMeshByName = function(name, scene, options) {
  scene = scene || TOW.Scene;
  options = options || { };

  var mesh;

  scene.traverse(function(child) {
    if (child instanceof THREE.Mesh && child.name == name) {
      mesh = child;

      if (options.visible) child.visible = options.visible;
    }
  });
  return mesh;
};

// Deprecated, refactor soon
TOW.findMeshAndVisibleMesh = function(name, scene) {
  scene = scene || TOW.Scene;

  var mesh;

  scene.traverse(function(child) {
    if (child instanceof THREE.Mesh && child.name == name) {
      mesh = child;
      child.visible = true;
    }
  });
  return mesh;
};

TOW.invisibleSceneChildren = function(scene) {
  scene = scene || TOW.Scene;
  scene.traverse(function(child) {
    child.visible = false;
  });
};

TOW.visibleSceneChildren = function(scene) {
  scene = scene || TOW.Scene;
  scene.traverse(function(child) {
    child.visible = true;
  });
};

TOW.findMeshVisibleAndCenter = function(name, scene) {
  var mesh = TOW.findMeshAndVisibleMesh(name, scene);

  TOW.centerGeometryOffsetPivot(mesh, scene);
  return mesh.parent.parent; // return the pivot to the offset to the mesh
};

TOW.findMeshVisibleAndCenterRender = function(name, scene, onRender) {
  var pivot = TOW.findMeshVisibleAndCenter(name, scene);

  TOW.render(function(delta) { onRender(delta, pivot); });
  return pivot;
};

TOW.cancelOnRenders = function() {
  TOW._onRenders = [ ];
};

TOW.cancelRender = function() {
  cancelAnimationFrame(TOW._requestId);
  TOW._render = undefined;
};

TOW.render = function(onRender) {
  TOW._onRenders = TOW._onRenders || [ ];

  if (TOW._render !== undefined) {
    if (onRender !== undefined) TOW._onRenders.push(onRender);

    return;
  }

  if (TOW.Canvas === undefined) document.body.appendChild(TOW.Renderer.domElement);
  if (onRender !== undefined) TOW._onRenders.push(onRender);

  var clock = new THREE.Clock();

  TOW._render = function(timestamp) { // timestamp indicates the current time for when requestAnimationFrame starts to fire callbacks, from mozilla
    TOW._requestId = requestAnimationFrame(TOW._render, TOW.Canvas);

    var delta = clock.getDelta();

    TOW._onRenders.forEach(function(r) { r(delta); });
    TOW.Renderer.render(TOW.Scene, TOW.Camera);
    
    if (TOW.TWEEN) TWEEN.update();
  };

  TOW._render();
};

console.log('TOW.render: ' + TOW.REVISION);
