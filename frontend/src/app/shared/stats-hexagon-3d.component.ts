import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export interface Stats {
  physique: number;
  intelligence: number;
  spirituality: number;
  sociality: number;
  success: number;
  ego: number;
}

interface StatAxis {
  name: string;
  key: keyof Stats;
}

/**
 * 3D stats radar rendered with three.js. The six stats define a glowing
 * crystal "gem" whose equatorial vertices extend along six hexagonal axes,
 * sitting on a concentric hex grid. The scene auto-rotates and supports
 * mouse drag to orbit.
 */
@Component({
  selector: 'app-stats-hexagon-3d',
  standalone: true,
  imports: [CommonModule],
  template: `<div #host class="hexagon-3d-host"></div>`,
  styles: [
    `
      .hexagon-3d-host {
        width: 100%;
        height: 100%;
        min-height: 420px;
        display: block;
        cursor: grab;
      }

      .hexagon-3d-host:active {
        cursor: grabbing;
      }

      .hexagon-3d-host canvas {
        display: block;
        width: 100% !important;
        height: 100% !important;
      }
    `,
  ],
})
export class StatsHexagon3dComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @ViewChild('host', { static: true }) host!: ElementRef<HTMLDivElement>;

  @Input() stats: Stats = {
    physique: 0,
    intelligence: 0,
    spirituality: 0,
    sociality: 0,
    success: 0,
    ego: 0,
  };

  private readonly axes: StatAxis[] = [
    { name: 'Physique', key: 'physique' },
    { name: 'Intelligence', key: 'intelligence' },
    { name: 'Spirituality', key: 'spirituality' },
    { name: 'Sociality', key: 'sociality' },
    { name: 'Success', key: 'success' },
    { name: 'Ego', key: 'ego' },
  ];

  private readonly maxRadius = 4;
  private readonly accent = 0x00d4ff;
  private readonly accentBright = 0x00ffff;

  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private renderer?: THREE.WebGLRenderer;
  private controls?: OrbitControls;
  private rootGroup?: THREE.Group;
  private gemGroup?: THREE.Group;
  private frameId = 0;
  private resizeObserver?: ResizeObserver;
  private initialized = false;

  ngAfterViewInit(): void {
    this.initThree();
    this.buildStaticScene();
    this.rebuildGem();
    this.startLoop();
    this.initialized = true;
  }

  ngOnChanges(): void {
    if (this.initialized) {
      this.rebuildGem();
    }
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frameId);
    this.resizeObserver?.disconnect();
    this.controls?.dispose();
    this.scene?.traverse((obj) => this.disposeObject(obj));
    this.renderer?.dispose();
    const canvas = this.renderer?.domElement;
    if (canvas && canvas.parentElement) {
      canvas.parentElement.removeChild(canvas);
    }
  }

  private initThree(): void {
    const el = this.host.nativeElement;
    const width = el.clientWidth || 500;
    const height = el.clientHeight || 500;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 4.5, 12);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    el.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 20;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.8;
    this.controls.target.set(0, 0, 0);

    // Lights
    this.scene.add(new THREE.AmbientLight(0x4060a0, 1.2));
    const key = new THREE.PointLight(this.accentBright, 120, 60);
    key.position.set(6, 10, 8);
    this.scene.add(key);
    const fill = new THREE.PointLight(0xff3da6, 60, 60);
    fill.position.set(-8, -4, -6);
    this.scene.add(fill);

    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(el);
  }

  /** Builds the parts that never change: hex grid rings, axes and labels. */
  private buildStaticScene(): void {
    if (!this.rootGroup) {
      return;
    }

    const gridMat = new THREE.LineBasicMaterial({
      color: this.accent,
      transparent: true,
      opacity: 0.28,
    });

    // Concentric hex rings on the equatorial (XZ) plane.
    const rings = 5;
    for (let level = 1; level <= rings; level++) {
      const r = (this.maxRadius / rings) * level;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 6; i++) {
        const a = this.angleFor(i % 6);
        pts.push(new THREE.Vector3(r * Math.cos(a), 0, r * Math.sin(a)));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      this.rootGroup.add(new THREE.Line(geo, gridMat));
    }

    // Axis spokes from centre to each vertex.
    for (let i = 0; i < 6; i++) {
      const a = this.angleFor(i);
      const pts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(
          this.maxRadius * Math.cos(a),
          0,
          this.maxRadius * Math.sin(a)
        ),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      this.rootGroup.add(new THREE.Line(geo, gridMat));

      // Label sprite just beyond the axis tip.
      const labelDist = this.maxRadius + 1.1;
      const sprite = this.makeLabelSprite(this.axes[i].name);
      sprite.position.set(
        labelDist * Math.cos(a),
        0.15,
        labelDist * Math.sin(a)
      );
      this.rootGroup.add(sprite);
    }
  }

  /** (Re)creates the flat, extruded stat radar from the current stats. */
  private rebuildGem(): void {
    if (!this.scene || !this.rootGroup) {
      return;
    }

    if (this.gemGroup) {
      this.rootGroup.remove(this.gemGroup);
      this.gemGroup.traverse((obj) => this.disposeObject(obj));
    }

    this.gemGroup = new THREE.Group();

    // Keep the model 3D and turnable, but make it much flatter.
    const halfDepth = this.maxRadius * 0.08;

    const topRing: THREE.Vector3[] = [];
    const bottomRing: THREE.Vector3[] = [];
    for (let i = 0; i < 6; i++) {
      const a = this.angleFor(i);
      const value = this.clamp(this.stats[this.axes[i].key]);
      const r = Math.max(0.001, (value / 100) * this.maxRadius);
      const x = r * Math.cos(a);
      const z = r * Math.sin(a);
      topRing.push(new THREE.Vector3(x, halfDepth, z));
      bottomRing.push(new THREE.Vector3(x, -halfDepth, z));
    }

    const topCenter = new THREE.Vector3(0, halfDepth, 0);
    const bottomCenter = new THREE.Vector3(0, -halfDepth, 0);

    // Build a flat hexagonal prism: top face, bottom face and side walls.
    const positions: number[] = [];
    const pushTri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    };

    for (let i = 0; i < 6; i++) {
      const next = (i + 1) % 6;
      // Top face (fan from centre)
      pushTri(topCenter, topRing[i], topRing[next]);
      // Bottom face (reverse winding)
      pushTri(bottomCenter, bottomRing[next], bottomRing[i]);
      // Side wall (two triangles per edge)
      pushTri(topRing[i], bottomRing[i], bottomRing[next]);
      pushTri(topRing[i], bottomRing[next], topRing[next]);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geo.computeVertexNormals();

    const gemMat = new THREE.MeshStandardMaterial({
      color: this.accent,
      emissive: this.accent,
      emissiveIntensity: 0.25,
      metalness: 0.15,
      roughness: 0.45,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    });
    this.gemGroup.add(new THREE.Mesh(geo, gemMat));

    // Bright wireframe edges over the slab for the "tech" look.
    const edgeMat = new THREE.LineBasicMaterial({
      color: this.accentBright,
      transparent: true,
      opacity: 0.9,
    });
    const topLoop = [...topRing, topRing[0]];
    const bottomLoop = [...bottomRing, bottomRing[0]];
    this.gemGroup.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(topLoop),
        edgeMat
      )
    );
    this.gemGroup.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(bottomLoop),
        edgeMat
      )
    );
    for (let i = 0; i < 6; i++) {
      this.gemGroup.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([topRing[i], bottomRing[i]]),
          edgeMat
        )
      );
    }

    // Small glowing nodes at each stat vertex (top face).
    const nodeMat = new THREE.MeshBasicMaterial({ color: this.accentBright });
    const nodeGeo = new THREE.SphereGeometry(0.12, 12, 12);
    for (const p of topRing) {
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.copy(p);
      this.gemGroup.add(node);
    }

    this.rootGroup.add(this.gemGroup);
  }

  private startLoop(): void {
    const render = () => {
      this.frameId = requestAnimationFrame(render);
      this.controls?.update();
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };
    render();
  }

  private onResize(): void {
    const el = this.host.nativeElement;
    const width = el.clientWidth || 1;
    const height = el.clientHeight || 1;
    if (this.camera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
    this.renderer?.setSize(width, height);
  }

  private makeLabelSprite(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const size = 256;
    canvas.width = size;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 44px Rajdhani, Arial, sans-serif';
    ctx.fillStyle = '#00d4ff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 12;
    ctx.fillText(text.toUpperCase(), canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2.6, 1.3, 1);
    return sprite;
  }

  private angleFor(i: number): number {
    return (Math.PI / 3) * i - Math.PI / 2;
  }

  private clamp(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }
    return Math.min(100, Math.max(0, value));
  }

  private disposeObject(obj: THREE.Object3D): void {
    const mesh = obj as Partial<THREE.Mesh> & Partial<THREE.Line>;
    if (mesh.geometry) {
      (mesh.geometry as THREE.BufferGeometry).dispose();
    }
    const material = (mesh as { material?: THREE.Material | THREE.Material[] })
      .material;
    if (Array.isArray(material)) {
      material.forEach((m) => m.dispose());
    } else if (material) {
      material.dispose();
    }
  }
}
