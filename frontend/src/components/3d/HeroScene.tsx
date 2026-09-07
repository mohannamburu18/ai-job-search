"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export function HeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);

  useEffect(() => {
    if (!containerRef.current) return;

    // Check WebGL support
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setHasWebGL(false);
        return;
      }
    } catch {
      setHasWebGL(false);
      return;
    }

    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 24;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Group for entire constellation
    const group = new THREE.Group();
    scene.add(group);

    // Starfield / ambient particle dust
    const particleCount = 200;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 40;
      particlePositions[i + 1] = (Math.random() - 0.5) * 25;
      particlePositions[i + 2] = (Math.random() - 0.5) * 25;
    }

    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x818cf8,
      size: 0.12,
      transparent: true,
      opacity: 0.5,
    });
    const starField = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(starField);

    // Central Quantum AI Core Sphere (Icosahedron wireframe + inner glowing sphere)
    const coreGeom = new THREE.IcosahedronGeometry(2.4, 2);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    group.add(coreMesh);

    const innerCoreGeom = new THREE.SphereGeometry(1.5, 32, 32);
    const innerCoreMat = new THREE.MeshBasicMaterial({
      color: 0x00f5d4,
      transparent: true,
      opacity: 0.18,
    });
    const innerCoreMesh = new THREE.Mesh(innerCoreGeom, innerCoreMat);
    group.add(innerCoreMesh);

    // Satellite Nodes (Representing Profile, Aggregator, Matcher, ATS Verifier)
    interface NodeInfo {
      mesh: THREE.Mesh;
      angle: number;
      radius: number;
      speed: number;
      yOffset: number;
      color: number;
    }

    const nodeColors = [0x00f5d4, 0x6366f1, 0x38bdf8, 0x10b981];
    const nodes: NodeInfo[] = [];

    for (let i = 0; i < 4; i++) {
      const radius = 6.5 + i * 0.8;
      const angle = (i * Math.PI * 2) / 4;
      const geom = new THREE.OctahedronGeometry(0.7, 0);
      const mat = new THREE.MeshBasicMaterial({
        color: nodeColors[i],
        wireframe: true,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 2, Math.sin(angle) * radius);
      group.add(mesh);

      nodes.push({
        mesh,
        angle,
        radius,
        speed: 0.008 + i * 0.002,
        yOffset: (Math.random() - 0.5) * 1.5,
        color: nodeColors[i],
      });
    }

    // Dynamic Connecting Lines between center and nodes
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x6366f1,
      transparent: true,
      opacity: 0.25,
    });

    const lineGeometries: THREE.BufferGeometry[] = [];
    const lineObjects: THREE.Line[] = [];

    nodes.forEach(() => {
      const lineGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0),
      ]);
      const lineObj = new THREE.Line(lineGeom, lineMat);
      group.add(lineObj);
      lineGeometries.push(lineGeom);
      lineObjects.push(lineObj);
    });

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse parallax
      targetX += (mouseX * 0.5 - targetX) * 0.05;
      targetY += (mouseY * 0.5 - targetY) * 0.05;

      group.rotation.y = elapsedTime * 0.15 + targetX;
      group.rotation.x = Math.sin(elapsedTime * 0.1) * 0.15 + targetY * 0.5;

      coreMesh.rotation.x = elapsedTime * 0.2;
      coreMesh.rotation.y = elapsedTime * 0.3;

      // Update orbital nodes
      nodes.forEach((node, i) => {
        node.angle += node.speed;
        node.mesh.position.x = Math.cos(node.angle) * node.radius;
        node.mesh.position.z = Math.sin(node.angle) * node.radius;
        node.mesh.position.y = Math.sin(elapsedTime * 1.2 + i) * 0.8 + node.yOffset;
        node.mesh.rotation.x += 0.02;
        node.mesh.rotation.y += 0.03;

        // Update connecting lines
        const lineGeom = lineGeometries[i];
        lineGeom.setFromPoints([
          new THREE.Vector3(0, 0, 0),
          node.mesh.position,
        ]);
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  if (!hasWebGL) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-indigo-950/20 to-transparent rounded-3xl border border-white/5">
        <div className="text-center p-6">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/40">
            <span className="text-indigo-400 font-mono text-xl">AI</span>
          </div>
          <p className="text-sm text-slate-400">Autonomous Career Match Engine Active</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-[480px] md:h-[560px] relative select-none pointer-events-none"
    />
  );
}

