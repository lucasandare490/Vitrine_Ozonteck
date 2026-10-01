'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import styles from './badge.module.css';

export default function JaspeCoin({ paused }: { paused: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    let cleanup = () => {};

    async function mount() {
      const THREE = await import('three');
      if (disposed || !container) return;
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio, 2), 3));
      renderer.setClearColor(0x000000, 0);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 20);
      camera.position.z = 4;
      const coin = new THREE.Group();
      scene.add(coin);
      scene.add(new THREE.AmbientLight(0xffffff, 1.8));
      const light = new THREE.DirectionalLight(0xfff3cf, 3);
      light.position.set(-3, 4, 5);
      scene.add(light);
      const rimLight = new THREE.DirectionalLight(0xffffff, 2);
      rimLight.position.set(3, -1, -3);
      scene.add(rimLight);

      // The artwork occupies a 158px circle inside its original 300px frame.
      const bodyGeometry = new THREE.CylinderGeometry(0.52, 0.52, 0.12, 96);
      bodyGeometry.rotateX(Math.PI / 2);
      const gold = new THREE.MeshStandardMaterial({ color: 0xc68a31, metalness: 0.45, roughness: 0.55 });
      coin.add(new THREE.Mesh(bodyGeometry, gold));
      const rimGeometry = new THREE.TorusGeometry(0.515, 0.012, 8, 96);
      for (const z of [-0.057, 0.057]) {
        const rim = new THREE.Mesh(rimGeometry, gold);
        rim.position.z = z;
        coin.add(rim);
      }
      // Clip the transparent frame to the coin: no square edges at grazing angles.
      const faceGeometry = new THREE.CircleGeometry(0.52, 96);
      const uv = faceGeometry.getAttribute('uv');
      for (let i = 0; i < uv.count; i++) {
        uv.setXY(i, 0.24 + uv.getX(i) * 0.5267, 0.24 + uv.getY(i) * 0.5267);
      }
      const texture = new THREE.TextureLoader().load('/jaspe-front.png', () => {
        if (disposed) return;
        render();
        container.dataset.ready = 'true';
      }, undefined, () => {
        if (!disposed) delete container.dataset.ready;
      });
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
      const faceMaterial = new THREE.MeshBasicMaterial({ map: texture, alphaTest: 0.5 });
      for (const direction of [1, -1]) {
        const face = new THREE.Mesh(faceGeometry, faceMaterial);
        face.position.z = direction * 0.062;
        face.rotation.y = direction === 1 ? 0 : Math.PI;
        coin.add(face);
      }

      const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
      let visible = true;
      let lastTime = 0;
      let elapsed = 0;
      function render() {
        renderer.render(scene, camera);
      }
      function updateMotion() {
        renderer.setAnimationLoop(null);
        lastTime = 0;
        if (paused || motion.matches) {
          coin.rotation.y = 0;
          render();
          return;
        }
        if (!visible || document.hidden) return;
        renderer.setAnimationLoop((time) => {
          if (lastTime) elapsed += Math.min(time - lastTime, 100);
          lastTime = time;
          coin.rotation.y = (elapsed / 6900) * Math.PI * 2;
          render();
        });
      }
      const resize = new ResizeObserver(() => {
        const { width, height } = container.getBoundingClientRect();
        renderer.setSize(Math.max(width, 1), Math.max(height, 1));
        camera.aspect = width / Math.max(height, 1);
        camera.updateProjectionMatrix();
        render();
      });
      const intersection = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        updateMotion();
      });
      const contextLost = () => { delete container.dataset.ready; };
      renderer.domElement.addEventListener('webglcontextlost', contextLost);
      container.appendChild(renderer.domElement);
      resize.observe(container);
      intersection.observe(container);
      motion.addEventListener('change', updateMotion);
      document.addEventListener('visibilitychange', updateMotion);
      updateMotion();

      cleanup = () => {
        renderer.setAnimationLoop(null);
        resize.disconnect();
        intersection.disconnect();
        motion.removeEventListener('change', updateMotion);
        document.removeEventListener('visibilitychange', updateMotion);
        renderer.domElement.removeEventListener('webglcontextlost', contextLost);
        renderer.domElement.remove();
        delete container.dataset.ready;
        bodyGeometry.dispose();
        rimGeometry.dispose();
        faceGeometry.dispose();
        gold.dispose();
        faceMaterial.dispose();
        texture.dispose();
        renderer.dispose();
      };
    }

    // Retain the static artwork if WebGL or the lazy-loaded renderer is unavailable.
    void mount().catch(() => cleanup());
    return () => {
      disposed = true;
      cleanup();
    };
  }, [paused]);

  return (
    <div ref={containerRef} className={styles.scene} aria-hidden="true">
      <Image src="/jaspe-front.png" alt="" width={220} height={220} sizes="(min-width: 1024px) 220px, 192px" className={styles.fallback} />
    </div>
  );
}
