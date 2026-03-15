// TAROUDANT HERITAGE SHIELD — 3D Hero Scene
// Historical reference: Almoravid/Saadian pisé ramparts
// Camera: cinematic low-angle slow orbit
// For use as: full-screen background behind hero text

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const RampartScene: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // SCENE
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0d0905');
    scene.fog = new THREE.Fog('#1a0d06', 30, 85);

    // CAMERA
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 7, 36);
    camera.lookAt(0, 4, 0);

    // RENDERER
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
    });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(new THREE.Color('#0d0905'), 1);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // ORBIT CONTROLS
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.18; // very slow cinematic pan
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI / 2.05; // don't go underground
    controls.minPolarAngle = Math.PI / 5; // don't go straight overhead
    controls.target.set(0, 4, 0);

    // LIGHTING
    const ambientLight = new THREE.AmbientLight('#ffddaa', 0.35);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight('#ff9944', 2.8);
    mainLight.position.set(-25, 35, 20);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.left = -50;
    mainLight.shadow.camera.right = 50;
    mainLight.shadow.camera.top = 35;
    mainLight.shadow.camera.bottom = -5;
    mainLight.shadow.bias = -0.0008;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight('#ff6622', 0.5);
    fillLight.position.set(30, 10, 15);
    scene.add(fillLight);

    const backLight = new THREE.DirectionalLight('#334466', 0.12);
    backLight.position.set(0, 20, -30);
    scene.add(backLight);

    // GROUND
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1a1005'),
      roughness: 1.0,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, -25);
    ground.receiveShadow = true;
    scene.add(ground);

    // BACKGROUND: Silhouette layer
    const silhouetteMat = new THREE.MeshBasicMaterial({ color: '#2a1a0a' });
    const bgTowers = 5;
    for (let i = 0; i < bgTowers; i++) {
      const w = 4 + Math.random() * 4;
      const h = 10 + Math.random() * 8;
      const x = -35 + Math.random() * 70;
      const silGeo = new THREE.BoxGeometry(w, h, w);
      const sil = new THREE.Mesh(silGeo, silhouetteMat);
      sil.position.set(x, h / 2, -45 - Math.random() * 10);
      scene.add(sil);
    }

    const piseMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#8B5E3C'),
      roughness: 0.94,
      metalness: 0.0,
    });

    // MIDGROUND: Towers
    // Left tower
    const towerL = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 14, 32), piseMat);
    towerL.position.set(-18, 7, -20);
    towerL.castShadow = true;
    towerL.receiveShadow = true;
    scene.add(towerL);

    // Right tower
    const towerR = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 14, 32), piseMat);
    towerR.position.set(18, 7, -20);
    towerR.castShadow = true;
    towerR.receiveShadow = true;
    scene.add(towerR);

    // Center gate tower
    const gateTower = new THREE.Mesh(new THREE.BoxGeometry(7, 16, 7), piseMat);
    gateTower.position.set(0, 8, -20);
    gateTower.castShadow = true;
    gateTower.receiveShadow = true;
    scene.add(gateTower);

    // Arch opening simulation
    const archMat = new THREE.MeshBasicMaterial({ color: '#0d0905' });
    const archPlane = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), archMat);
    archPlane.position.set(0, 1.5, -16.49);
    scene.add(archPlane);

    const horseshoeGeo = new THREE.CylinderGeometry(1.5, 1.5, 3, 32, 1, false, 0, Math.PI);
    const horseshoe = new THREE.Mesh(horseshoeGeo, archMat);
    horseshoe.rotation.x = Math.PI / 2;
    horseshoe.position.set(0, 3, -16.49);
    // scale to look a bit like horseshoe
    horseshoe.scale.set(1.2, 1, 1);
    scene.add(horseshoe);

    // Tower merlons
    for (const tx of [-18, 18]) {
      for (let m = 0; m < 5; m++) {
        const merlon = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), piseMat);
        const angle = (Math.PI / 4) * m;
        // half circle along the front of the cylinder
        merlon.position.set(tx + Math.cos(angle) * 3.5, 14.75, -20 + Math.sin(angle) * 3.5);
        merlon.castShadow = true;
        scene.add(merlon);
      }
    }

    // Gate Tower Merlons
    for (let m = 0; m < 3; m++) {
      const merlon = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), piseMat);
      merlon.position.set(-2.5 + m * 2.5, 16.75, -17);
      merlon.castShadow = true;
      scene.add(merlon);
    }

    // FOREGROUND WALL
    const wallGroup = new THREE.Group();
    const WALL_WIDTH = 80;
    const BRICK_W = 2.6;
    const BRICK_H = 0.9;
    const BRICK_D = 3.8;
    const COURSES = 11; // gives ~9.9 height

    for (let course = 0; course < COURSES; course++) {
      const offset = course % 2 === 0 ? 0 : BRICK_W / 2; // running bond pattern
      for (let x = -WALL_WIDTH / 2; x < WALL_WIDTH / 2; x += BRICK_W + 0.04) {
        const brick = new THREE.Mesh(
          new THREE.BoxGeometry(
            BRICK_W + (Math.random() - 0.5) * 0.15,
            BRICK_H + (Math.random() - 0.5) * 0.08,
            BRICK_D + (Math.random() - 0.5) * 0.3,
          ),
          piseMat
        );
        brick.position.set(
          x + offset + (Math.random() - 0.5) * 0.05,
          course * (BRICK_H + 0.03) + (Math.random() - 0.5) * 0.02 + BRICK_H / 2,
          (Math.random() - 0.5) * 0.18 // slight z variation for depth
        );
        brick.castShadow = true;
        brick.receiveShadow = true;
        wallGroup.add(brick);
      }
    }

    // Merlons on top
    const merlon_y = COURSES * (BRICK_H + 0.03);
    for (let x = -WALL_WIDTH / 2 + 1; x < WALL_WIDTH / 2; x += 4.0) {
      const merlon = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 2.0, BRICK_D + 0.2),
        piseMat
      );
      merlon.position.set(x, merlon_y + 1.0, 0);
      merlon.castShadow = true;
      wallGroup.add(merlon);
    }

    wallGroup.position.set(0, 0, 0);
    scene.add(wallGroup);

    // PARTICLES (ambient dust / atmosphere)
    const particleCount = 220;
    const particleGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 100; // x: -50 to +50
      posArray[i + 1] = -1 + Math.random() * 19; // y: -1 to +18
      posArray[i + 2] = -50 + Math.random() * 60; // z: -50 to +10
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particleMat = new THREE.PointsMaterial({
      color: new THREE.Color('#c8845a'),
      size: 0.07,
      opacity: 0.45,
      transparent: true,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ANIMATION LOOP
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Slow particle drift
      particles.rotation.y = elapsed * 0.00008 * 60;
      particles.position.y = Math.sin(elapsed * 0.15) * 0.4;

      // Very subtle wall breathing (imperceptible scale pulse)
      wallGroup.position.y = Math.sin(elapsed * 0.08) * 0.03;

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      controls.dispose();
    };

  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
      }}
    />
  );
};

export default RampartScene;
