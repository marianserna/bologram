class Scene {
  constructor() {
    this.container = document.createElement('div');
    document.body.appendChild(this.container);
    this.handOpening = 0;

    this.init();
    this.addLights();
    this.addShape();
    this.addPeppersGhost();
    this.loop();

    window.addEventListener('resize', () => this.handleResize());
  }

  width() {
    return window.innerWidth;
  }

  height() {
    return window.innerHeight;
  }

  init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, this.width() / this.height(), 1, 100000);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    this.renderer.setPixelRatio = window.devicePixelRatio;
    this.renderer.setSize(this.width(), this.height());

    this.container.appendChild(this.renderer.domElement);
  }

  // Shaders from https://github.com/mrdoob/three.js/blob/master/examples/webgl_modifier_tessellation.html
  vertexShader() {
    return `
      uniform float amplitude;
      attribute vec3 customColor;
      attribute vec3 displacement;
      varying vec3 vNormal;
      varying vec3 vColor;
      void main() {
        vNormal = normal;
        vColor = customColor;
        vec3 newPosition = position + normal * amplitude * displacement;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
      }
    `
  }

  fragmentShader() {
    return `
      varying vec3 vNormal;
      varying vec3 vColor;
      void main() {
        const float ambient = 0.4;
        vec3 light = vec3( 1.0 );
        light = normalize( light );
        float directional = max( dot( vNormal, light ), 0.0 );
        gl_FragColor = vec4( ( directional + ambient ) * vColor, 1.0 );
      }
    `
  }

  addLights() {
    const light = new THREE.AmbientLight(0xB2EBF2, 0.7);
    this.scene.add(light);
  }

  addPeppersGhost() {
    this.effect = new THREE.PeppersGhostEffect( this.renderer );
		this.effect.setSize(this.width(), this.height());
		this.effect.cameraDistance = 50;
  }

  addShape() {
    // let geometry = new THREE.TorusGeometry(10, 3, 16, 5000);
    let geometry = new THREE.SphereGeometry(7, 300, 300);
    geometry.center();

    const tessellateModifier = new THREE.TessellateModifier(8);

		for (let i = 0; i < 6; i ++) {
			tessellateModifier.modify(geometry);
		}

		const explodeModifier = new THREE.ExplodeModifier();
		explodeModifier.modify(geometry);
		const numFaces = geometry.faces.length;

    geometry = new THREE.BufferGeometry().fromGeometry(geometry);

    const colors = new Float32Array( numFaces * 3 * 3 );
		const displacement = new Float32Array( numFaces * 3 * 3 );
		const color = new THREE.Color();

    const colourOptions = [
      'rgb(100,255,218)',
      'rgb(213,0,249)',
      'rgb(255, 255, 255)'
    ]

		for ( var f = 0; f < numFaces; f ++ ) {
			const index = 9 * f;
      const randomColour = colourOptions[Math.floor(colourOptions.length * Math.random())];
      color.set(randomColour);

			const d = 15 * (0.5 - Math.random());

			for ( let i = 0; i < 3; i ++ ) {
				colors[ index + ( 3 * i )     ] = color.r;
				colors[ index + ( 3 * i ) + 1 ] = color.g;
				colors[ index + ( 3 * i ) + 2 ] = color.b;
				displacement[ index + ( 3 * i )     ] = d;
				displacement[ index + ( 3 * i ) + 1 ] = d;
				displacement[ index + ( 3 * i ) + 2 ] = d;
			}
		}

    geometry.addAttribute('customColor', new THREE.BufferAttribute(colors, 3));
		geometry.addAttribute('displacement', new THREE.BufferAttribute(displacement, 3));

    this.uniforms = {
			amplitude: {value: 0.0}
		};

    const shaderMaterial = new THREE.ShaderMaterial({
			uniforms:       this.uniforms,
			vertexShader:   this.vertexShader(),
			fragmentShader: this.fragmentShader()
		});

    const shape = new THREE.Mesh(geometry, shaderMaterial);
    this.scene.add(shape);
  }

  handleResize() {
    this.renderer.setSize(this.width(), this.height());
    this.camera.aspect = this.width() / this.height();
    this.camera.updateProjectionMatrix();
  }

  loop() {
    this.render();
    requestAnimationFrame(() => {
      this.loop();
    });
  }

  render() {
    // const date = Date.now() * 0.001;
    this.uniforms.amplitude.value = this.handOpening * 0.1;

    this.camera.lookAt(this.scene.position);
    this.effect.render(this.scene, this.camera);
  }
}
