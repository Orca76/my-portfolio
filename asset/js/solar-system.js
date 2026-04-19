import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function initSolarSystem(holder) {
  const scene = new THREE.Scene();

  const width = holder.clientWidth;
  const height = holder.clientHeight || 320;
  const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
  camera.position.set(0, 12, 26);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  holder.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;

  const starGeo = new THREE.BufferGeometry();
  const starCount = 800;
  const positions = new Float32Array(starCount * 3);
  for (let index = 0; index < starCount; index += 1) {
    const radius = 220 * (0.6 + Math.random() * 0.4);
    const theta = Math.random() * Math.PI * 2;
    const phi = (Math.random() - 0.5) * Math.PI;
    positions[index * 3 + 0] = radius * Math.cos(theta) * Math.cos(phi);
    positions[index * 3 + 1] = radius * Math.sin(phi);
    positions[index * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ size: 1.2, sizeAttenuation: true, color: 0xffffff, transparent: true, opacity: 0.85 })
  );
  scene.add(stars);

  const makeOrbit = (radius, color) => {
    const geometry = new THREE.BufferGeometry();
    const segments = 128;
    const points = new Float32Array(segments * 3);
    for (let index = 0; index < segments; index += 1) {
      const angle = (index / segments) * Math.PI * 2;
      points[index * 3 + 0] = Math.cos(angle) * radius;
      points[index * 3 + 1] = 0;
      points[index * 3 + 2] = Math.sin(angle) * radius;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(points, 3));
    return new THREE.LineLoop(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.35 }));
  };

  const pastelSphere = (radius, color) => new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), new THREE.MeshBasicMaterial({ color }));

  const ringMesh = (innerRadius, outerRadius, color) => {
    const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
    const material = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  };

  const sun = pastelSphere(2.6, 0xffe08a);
  scene.add(sun);

  const sunGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: (() => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 256;
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(128, 128, 20, 128, 128, 128);
        gradient.addColorStop(0, 'rgba(255,240,160,1)');
        gradient.addColorStop(0.5, 'rgba(255,200,120,.45)');
        gradient.addColorStop(1, 'rgba(255,200,120,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 256, 256);
        const texture = new THREE.CanvasTexture(canvas);
        texture.anisotropy = 4;
        return texture;
      })(),
      transparent: true,
      depthWrite: false
    })
  );
  sunGlow.scale.set(9, 9, 1);
  scene.add(sunGlow);

  const planets = [];
  const definitions = [
    { r: 0.6, orbitRadius: 5.0, speed: 0.02, color: 0xb8e0d2 },
    { r: 0.9, orbitRadius: 7.2, speed: 0.014, color: 0xf7c5cc },
    { r: 1.0, orbitRadius: 9.6, speed: 0.011, color: 0xc7d2fe },
    { r: 1.1, orbitRadius: 12.4, speed: 0.009, color: 0xfde68a },
    { r: 0.9, orbitRadius: 15.2, speed: 0.007, color: 0xd1fae5, ring: true }
  ];

  definitions.forEach((definition) => {
    const group = new THREE.Group();
    const body = pastelSphere(definition.r, definition.color);
    body.position.x = definition.orbitRadius;
    group.add(body);
    group.add(makeOrbit(definition.orbitRadius, 0x9fb3d1));
    if (definition.ring) {
      const ring = ringMesh(definition.r * 1.8, definition.r * 3.0, 0xdbeafe);
      ring.position.copy(body.position);
      ring.rotation.z = 0.5;
      group.add(ring);
    }
    scene.add(group);
    planets.push({ group, angle: Math.random() * Math.PI * 2, speed: definition.speed, orbitRadius: definition.orbitRadius });
  });

  const moon = pastelSphere(0.35, 0xffffff);
  planets[2].group.add(moon);

  const clock = new THREE.Clock();
  let frameId = 0;

  const tick = () => {
    const delta = clock.getDelta();
    stars.rotation.y += 0.002 * delta * 60;

    planets.forEach((planet) => {
      planet.angle += planet.speed * delta * 60;
      const x = Math.cos(planet.angle) * planet.orbitRadius;
      const z = Math.sin(planet.angle) * planet.orbitRadius;
      planet.group.children[0].position.set(x, 0, z);

      planet.group.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.RingGeometry) {
          child.position.set(x, 0, z);
        }
      });
    });

    const host = planets[2].group.children[0];
    moon.position.set(
      host.position.x + 1.7 * Math.cos(clock.elapsedTime * 1.8),
      0.2,
      host.position.z + 1.7 * Math.sin(clock.elapsedTime * 1.8)
    );

    controls.update();
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(tick);
  };

  const onResize = () => {
    const nextWidth = holder.clientWidth;
    const nextHeight = holder.clientHeight || 320;
    camera.aspect = nextWidth / nextHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(nextWidth, nextHeight);
  };

  window.addEventListener('resize', onResize);
  tick();

  return () => {
    cancelAnimationFrame(frameId);
    window.removeEventListener('resize', onResize);
    controls.dispose();
    renderer.dispose();
  };
}