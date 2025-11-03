// ===== three.js: パステル太陽系 =====
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const holder = document.getElementById('gl-holder');
if (holder) {
  const scene = new THREE.Scene();

  // Camera & renderer
  const camera = new THREE.PerspectiveCamera(55, holder.clientWidth / holder.clientHeight, 0.1, 1000);
  camera.position.set(0, 12, 26);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(holder.clientWidth, holder.clientHeight);
  holder.appendChild(renderer.domElement);

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;

  // Stars (background points)
  const starGeo = new THREE.BufferGeometry();
  const starCount = 800;
  const pos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 220 * (0.6 + Math.random() * 0.4),
      th = Math.random() * Math.PI * 2,
      ph = (Math.random() - 0.5) * Math.PI;
    pos[i * 3 + 0] = r * Math.cos(th) * Math.cos(ph);
    pos[i * 3 + 1] = r * Math.sin(ph);
    pos[i * 3 + 2] = r * Math.sin(th) * Math.cos(ph);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ size: 1.2, sizeAttenuation: true, color: 0xffffff, transparent: true, opacity: 0.85 })
  );
  scene.add(stars);

  // Utils
  function makeOrbit(radius, color) {
    const g = new THREE.BufferGeometry();
    const segments = 128;
    const pts = new Float32Array(segments * 3);
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      pts[i * 3 + 0] = Math.cos(a) * radius;
      pts[i * 3 + 1] = 0;
      pts[i * 3 + 2] = Math.sin(a) * radius;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    return new THREE.LineLoop(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.35 }));
  }

  function pastelSphere(radius, color) {
    const geo = new THREE.SphereGeometry(radius, 48, 32);
    const mat = new THREE.MeshBasicMaterial({ color });
    return new THREE.Mesh(geo, mat);
  }

  function ringMesh(innerR, outerR, color) {
    const geo = new THREE.RingGeometry(innerR, outerR, 64);
    const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }

  // Sun + glow
  const sun = pastelSphere(2.6, 0xffe08a);
  scene.add(sun);
  const sunGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: (() => {
        const c = document.createElement('canvas');
        c.width = c.height = 256;
        const ctx = c.getContext('2d');
        const g = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
        g.addColorStop(0, 'rgba(255,240,160,1)');
        g.addColorStop(0.5, 'rgba(255,200,120,.45)');
        g.addColorStop(1, 'rgba(255,200,120,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 256, 256);
        const t = new THREE.CanvasTexture(c);
        t.anisotropy = 4;
        return t;
      })(),
      transparent: true,
      depthWrite: false
    })
  );
  sunGlow.scale.set(9, 9, 1);
  scene.add(sunGlow);

  // Planets
  const planets = [];
  const defs = [
    { r: 0.6, R: 5.0, sp: 0.02, color: 0xb8e0d2 },
    { r: 0.9, R: 7.2, sp: 0.014, color: 0xf7c5cc },
    { r: 1.0, R: 9.6, sp: 0.011, color: 0xc7d2fe },
    { r: 1.1, R: 12.4, sp: 0.009, color: 0xfde68a },
    { r: 0.9, R: 15.2, sp: 0.007, color: 0xd1fae5, ring: true }
  ];

  defs.forEach((d) => {
    const g = new THREE.Group();
    const body = pastelSphere(d.r, d.color);
    body.position.x = d.R;
    g.add(body);
    g.add(makeOrbit(d.R, 0x9fb3d1));
    if (d.ring) {
      const ring = ringMesh(d.r * 1.8, d.r * 3.0, 0xdbeafe);
      ring.position.copy(body.position);
      ring.rotation.z = 0.5;
      g.add(ring);
    }
    scene.add(g);
    planets.push({ group: g, body, angle: Math.random() * Math.PI * 2, speed: d.sp, R: d.R });
  });

  // Moon (spherical) around the 3rd planet
  const moon = pastelSphere(0.35, 0xffffff);
  planets[2].group.add(moon);

  // Animation
  const clock = new THREE.Clock();
  function tick() {
    const dt = clock.getDelta();
    stars.rotation.y += 0.002 * dt * 60;

    planets.forEach((p) => {
      p.angle += p.speed * dt * 60;
      const x = Math.cos(p.angle) * p.R,
        z = Math.sin(p.angle) * p.R;
      p.group.children[0].position.set(x, 0, z);
      for (let c of p.group.children) {
        if (c instanceof THREE.Mesh && c.geometry instanceof THREE.RingGeometry) {
          c.position.set(x, 0, z);
        }
      }
    });

    const host = planets[2].group.children[0];
    moon.position.set(
      host.position.x + 1.7 * Math.cos(clock.elapsedTime * 1.8),
      0.2,
      host.position.z + 1.7 * Math.sin(clock.elapsedTime * 1.8)
    );

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();

  // Resize
  addEventListener('resize', () => {
    const w = holder.clientWidth,
      h = holder.clientHeight || 320;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}

// ===== Works: data-driven cards & year =====
const works = [
  { title: 'アイルトレイル (WIP)', stack: ['Unity', 'C#', 'タワーディフェンス'], thumb: 'source/rogue-seas-thumb.png', url: 'https://github.com/Orca76/rogue-seas', desc: '島探索×ローグライク。航海・セントリー召喚。' },
  { title: 'RUNE CRAFT DUNGEON', stack: ['Unity', 'C#', 'ローグライク'], thumb: 'source/RuneCraft-thumb.png', url: 'https://github.com/Orca76/pixelShooting', desc: 'オリジナル魔法構築、自動生成ダンジョン探索' },
  { title: '単語学習アプリ', stack: ['Kotlin', 'Android Studio', 'XML'], thumb: 'source/studyword_thumb.png', url: '#', desc: '自分で単語を登録できる学習アプリ　どの分野にも' },
  { title: 'coin climber', stack: ['Unity', 'C#', 'アーケード'], thumb: 'source/coincollector_thumb.png', url: 'https://prtimes.jp/main/html/rd/p/000000026.000016959.html', desc: 'ジャンプしてコインを集めていく' },
  { title: 'Hook Adventure', stack: ['Unity', 'C#', '2Dアクション'], thumb: 'source/hookAdventure_thumb.gif', url: 'https://unityroom.com/games/hook_adventure', desc: 'フックショットでどんどん進め！' },
  { title: 'Swing Run', stack: ['Unity', 'C#', 'アーケード'], thumb: 'source/swingrun_thumb.gif', url: 'https://unityroom.com/games/swing_run', desc: 'シンプルな操作　ハイスコアを目指せ！' },
  { title: 'ピクセルダンジョン', stack: ['Unity', 'C#', 'シューティング'], thumb: 'source/pixeldungeon_thumb.gif', url: 'https://unityroom.com/games/pixel_dungeon', desc: 'オリジナル魔法構築シューティング（RUNE CRAFT DUNGEON前作）' },
  { title: '胡蝶のゆりかご', stack: ['Unity', 'C#', 'タワーディフェンス'], thumb: 'source/butterfly4.png', url: '#', desc: 'サークルでのチーム開発ゲーム　防衛TD' },
  { title: 'Blender作品', stack: ['Blender'], thumb: 'source/blender_thumb.png', url: '#', desc: 'Blenderも一部触れています　ゲーム用のモデル作成等' },
  { title: 'Chrono Ricochet Classic(WIP)', stack: ['Unity', 'C#', 'シューティング'], thumb: 'source/chrono2.png', url: '#', desc: '跳弾を用いて戦うタンクゲーム' },
  { title: 'Chrono Ricochet3D(WIP)', stack: ['UE', 'C++', 'シューティング'], thumb: 'source/chrono3.png', url: '#', desc: 'Chrono RicochetのUE版　開発中' }
];

const W = document.getElementById('works-grid');
if (W) {
  works.forEach((w) => {
    const clickable = w.url && w.url !== '#';
    const el = document.createElement('article');
    el.className = 'card' + (clickable ? ' clickable' : '');

    const inner = `
      <div class="thumb">
        ${w.thumb ? `<img src="${w.thumb}" alt="${w.title}">` : `<span style="opacity:.6">(screenshot later)</span>`}
      </div>
      <div class="body">
        <h3>${w.title}</h3>
        <div class="stack">${w.stack.map((s) => `<span class='pill'>${s}</span>`).join(' ')}</div>
        <p style="margin:.5rem 0 0; color:var(--muted)">${w.desc || ''}</p>
      </div>
    `;

    el.innerHTML = clickable ? `<a href="${w.url}" target="_blank" rel="noopener">${inner}</a>` : inner;

    if (clickable) {
      el.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        window.open(w.url, '_blank', 'noopener');
      });
    }

    W.appendChild(el);
  });
}

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
