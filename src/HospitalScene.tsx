import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCcw, MousePointer2, LoaderCircle } from 'lucide-react';
import { signal } from './waveforms';
import type { SceneState, ViewMode } from './types';

type Props = { state: SceneState; view: ViewMode; onInspect: (item: string) => void };
export default function HospitalScene({ state, view, onInspect }: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state); stateRef.current = state;
  const viewRef = useRef(view); viewRef.current = view;
  const inspectRef = useRef(onInspect); inspectRef.current = onInspect;
  const resetRef = useRef<() => void>(() => {});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    const host = mount.current!;
    const preop = Boolean(stateRef.current.preop);
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#15262c');
    scene.fog = new THREE.Fog('#15262c', 12, 25);
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); }
    catch { setError(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
    host.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-label', 'Etkileşimli üç boyutlu ameliyathane: hasta, hemşire, yatak ve tıbbi ekipmanlar');
    renderer.domElement.setAttribute('role', 'img');
    const camera = new THREE.PerspectiveCamera(42, 1, .1, 50);
    camera.position.set(3.7, 2.9, 4.8);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(-.15, 1.35, -.30); controls.enableDamping = true;
    controls.minDistance = 3.5; controls.maxDistance = 11;
    controls.minPolarAngle = .45; controls.maxPolarAngle = Math.PI / 2 - .04;
    controls.minAzimuthAngle = -.8; controls.maxAzimuthAngle = 1.35;
    controls.enablePan = false; controls.rotateSpeed = .45;
    const mats: THREE.Material[] = [], textures: THREE.Texture[] = [];
    const mat = (color: string, metalness = 0, roughness = .55, extra = {}) => {
      const m = new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra }); mats.push(m); return m;
    };
    const white = mat('#d6e4e3', .12, .38), enamel = mat('#6e9297', .2), steel = mat('#9aadb2', .8, .25);
    const dark = mat('#20353d', .35, .35), black = mat('#102027', .15, .45), teal = mat('#42978f', .05, .7);
    const cloth = mat('#66aeb0', 0, .95), linen = mat('#ccd9d1', 0, .95), blue = mat('#245d70', 0, .85);
    const skin = mat('#be8e76', 0, .73), nurseSkin = mat('#bc896b', 0, .7), glove = mat('#b1d3df', 0, .6);
    const lightMat = mat('#c7faff', .1, .25, { emissive: '#a2eaff', emissiveIntensity: 3 });
    const glass = mat('#86cbd1', .2, .1, { transparent: true, opacity: .25 });
    const redMat = mat('#9d242c', .05, .3, { emissive: '#ff183b', emissiveIntensity: .1 });
    function mesh(geo: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = scene) {
      const obj = new THREE.Mesh(geo, material); obj.position.set(x, y, z); obj.castShadow = true; obj.receiveShadow = true; parent.add(obj); return obj;
    }
    function box(w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = scene, radius = .025) {
      return mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(radius, w / 3, h / 3, d / 3)), material, x, y, z, parent);
    }
    function sphere(w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = scene) {
      const obj = mesh(new THREE.SphereGeometry(1, 28, 20), material, x, y, z, parent); obj.scale.set(w, h, d); return obj;
    }
    function cylinder(r: number, h: number, material: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = scene) {
      return mesh(new THREE.CylinderGeometry(r, r, h, 24), material, x, y, z, parent);
    }
    function rod(a: number[], b: number[], radius: number, material: THREE.Material, parent: THREE.Object3D = scene) {
      const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), delta = end.clone().sub(start);
      const m = mesh(new THREE.CylinderGeometry(radius, radius, delta.length(), 14), material, 0, 0, 0, parent);
      m.position.copy(start.add(end).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()); return m;
    }
    function tube(points: number[][], radius: number, material: THREE.Material, parent: THREE.Object3D = scene) {
      return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 48, radius, 8, false), material, 0, 0, 0, parent);
    }
    function textureCanvas(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
      const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!);
      const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; textures.push(tx); return tx;
    }
    function label(text: string, w: number, h: number, x: number, y: number, z: number, color = '#c6e0df', bg = '#203940', parent: THREE.Object3D = scene) {
      const tx = textureCanvas(512, 128, ctx => { ctx.fillStyle = bg; ctx.fillRect(0, 0, 512, 128); ctx.font = '600 44px Arial'; ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.fillText(text, 256, 80); });
      const m = new THREE.MeshBasicMaterial({ map: tx }); mats.push(m);
      return mesh(new THREE.PlaneGeometry(w, h), m, x, y, z, parent);
    }
    const fabricTx = textureCanvas(128, 128, ctx => {
      ctx.fillStyle = '#aeb4b0'; ctx.fillRect(0, 0, 128, 128);
      for (let y = 0; y < 128; y += 2) { ctx.fillStyle = y % 4 ? '#b8c0b9' : '#909e97'; ctx.fillRect(0, y, 128, 1); }
      for (let x = 0; x < 128; x += 2) { ctx.fillStyle = '#b5c3b150'; ctx.fillRect(x, 0, 1, 128); }
    }); fabricTx.wrapS = fabricTx.wrapT = THREE.RepeatWrapping; fabricTx.repeat.set(5, 5);
    for (const material of [cloth, blue, linen, teal]) { material.bumpMap = fabricTx; material.bumpScale = .008; }
    // Room shell, tiled floor and medical wall panel.
    const floorTx = textureCanvas(512, 512, ctx => {
      ctx.fillStyle = '#667d80'; ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 11000; i++) { const v = 80 + Math.random() * 90; ctx.fillStyle = `rgba(${v},${v + 15},${v + 20},.12)`; ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2); }
      ctx.strokeStyle = '#4d646a'; ctx.lineWidth = 2; ctx.strokeRect(0, 0, 512, 512);
    }); floorTx.wrapS = floorTx.wrapT = THREE.RepeatWrapping; floorTx.repeat.set(10, 10);
    const floor = mat('#98abad', .08, .4, { map: floorTx }); box(16, .12, 16, floor, 0, -.08, 0);
    const wall = mat('#839da0', .05, .7);
    box(12, 4.4, .18, wall, 0, 2.1, -3.3); box(.18, 4.4, 12, wall, -4.7, 2.1, 0);
    box(12, 1, .12, enamel, 0, .45, -3.17); box(12, .055, .12, steel, 0, .96, -3.08);
    box(7.7, .08, .3, lightMat, -.5, 3.5, -3.05);
    box(2.9, .72, .13, white, -.9, 1.62, -3.1);
    [-1.95, -1.35, -.75, -.15].forEach((x, i) => {
      box(.35, .30, .11, dark, x, 1.66, -3.0);
      const outlet = cylinder(.07, .035, mat(['#82c586', '#f5d173', '#70aeda', '#d6d9de'][i]), x, 1.67, -2.91); outlet.rotation.x = Math.PI / 2;
      label(['O₂', 'AIR', 'VAC', 'N₂O'][i], .27, .07, x, 1.44, -2.9, '#23474c', '#d6e4e3');
    });
    label('AMELİYATHANE  /  03', 2.55, .42, -.8, 2.65, -3.17);
    label('STERİL ALAN', 1.1, .2, 3.15, 2.8, -3.18, '#a8c9c7');
    // Window and hallway glow.
    box(1.8, 1.55, .07, dark, -3.25, 2.2, -3.12);
    box(1.64, 1.39, .06, mat('#255368', .3, .1, { emissive: '#173d54', emissiveIntensity: .5 }), -3.25, 2.2, -3.05);
    for (let i = 0; i < 10; i++) box(1.64, .03, .025, enamel, -3.25, 1.61 + i * .13, -2.98);
    // A wall clock, surgical checklist and ceiling service strips complete the theatre.
    const clockTexture = textureCanvas(256, 256, ctx => {
      ctx.fillStyle = '#dae1dd'; ctx.fillRect(0, 0, 256, 256);
      ctx.translate(128, 128); ctx.strokeStyle = '#29424c'; ctx.lineWidth = 3;
      for (let i = 0; i < 60; i++) { ctx.save(); ctx.rotate(i * Math.PI / 30); ctx.beginPath(); ctx.moveTo(0, -100); ctx.lineTo(0, i % 5 ? -95 : -87); ctx.stroke(); ctx.restore(); }
      ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-33, -55); ctx.stroke();
      ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(62, -39); ctx.stroke();
      ctx.fillStyle = '#255a5b'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
    });
    const clockM = new THREE.MeshBasicMaterial({ map: clockTexture }); mats.push(clockM);
    cylinder(.22, .07, steel, 1.15, 2.78, -3.1).rotation.x = Math.PI / 2;
    mesh(new THREE.CircleGeometry(.201, 48), clockM, 1.15, 2.78, -3.058);
    box(.44, .59, .04, white, 1.4, 1.9, -3.15);
    label('GÜVENLİ CERRAHİ', .38, .09, 1.4, 2.10, -3.12, '#2b5656', '#d6e4e3');
    for (let i = 0; i < 5; i++) {
      box(.24, .009, .007, enamel, 1.44, 1.99 - i * .068, -3.116);
      box(.028, .025, .008, teal, 1.27, 1.99 - i * .068, -3.11);
    }
    box(2.2, .06, .38, white, 2.1, 3.6, -1.6);
    box(2.0, .015, .24, lightMat, 2.1, 3.559, -1.6);
    // Overhead privacy rail and gathered hospital curtain.
    rod([-3.9, 3.25, -2.7], [-3.9, 3.25, 2.3], .023, steel);
    const curtainMat = mat('#438c8b', 0, 1);
    const curtainGeo = new THREE.PlaneGeometry(1.4, 2.3, 50, 12);
    const curtainPositions = curtainGeo.attributes.position;
    for (let i = 0; i < curtainPositions.count; i++) curtainPositions.setZ(i, Math.sin(curtainPositions.getX(i) * 29) * .075);
    curtainGeo.computeVertexNormals(); curtainMat.side = THREE.DoubleSide;
    const curtain = mesh(curtainGeo, curtainMat, -3.8, 1.9, -1.9); curtain.rotation.y = Math.PI / 2;
    for (let i = 0; i < 9; i++) rod([-3.9, 3.25, -2.6 + i * .17], [-3.8, 3.05, -2.6 + i * .17], .01, steel);
    // Supply cabinet.
    box(1.65, 2.25, .6, white, 2.9, 1.16, -2.8);
    for (let i = 0; i < 3; i++) {
      box(1.51, .39, .045, enamel, 2.9, .31 + i * .43, -2.475);
      box(.36, .035, .065, steel, 2.9, .39 + i * .43, -2.43);
    }
    box(1.48, .77, .05, glass, 2.9, 1.82, -2.45);
    box(.024, .8, .09, steel, 2.9, 1.82, -2.39);
    for (let i = 0; i < 7; i++) {
      cylinder(.045, .21 + (i % 2) * .07, i % 2 ? white : teal, 2.35 + i * .17, 1.67, -2.63);
      cylinder(.046, .035, dark, 2.35 + i * .17, 1.79 + (i % 2) * .035, -2.63);
    }
    // Hospital bed with actuators, side rails and casters.
    const bed = new THREE.Group(); scene.add(bed); bed.position.set(-.45, 0, .15);
    box(.88, .18, 1.85, dark, 0, .24, .1, bed);
    cylinder(.12, .46, steel, 0, .48, -.2, bed);
    box(1.1, .12, 2.7, steel, 0, .7, .15, bed);
    box(1.1, .20, 2.65, white, 0, .84, .15, bed, .065);
    box(1.02, .14, 2.50, linen, 0, 1.0, .15, bed, .065);
    for (const x of [-.44, .44]) for (const z of [-.84, 1.0]) {
      rod([x, .28, z], [x * 1.35, .15, z + .06], .055, steel, bed);
      const wheel = cylinder(.095, .075, black, x * 1.35, .1, z + .06, bed); wheel.rotation.z = Math.PI / 2;
      cylinder(.035, .075, steel, x * 1.35, .1, z + .06, bed).rotation.z = Math.PI / 2;
    }
    for (const x of [-.6, .6]) {
      for (const z of [-.7, .15, .7]) rod([x, .84, z], [x, 1.23, z], .025, steel, bed);
      rod([x, 1.23, -.85], [x, 1.23, .83], .036, white, bed);
      rod([x, 1.06, -.85], [x, 1.06, .83], .021, steel, bed);
    }
    box(1.11, .47, .09, white, 0, 1.02, 1.52, bed, .04);
    box(.84, .22, .023, teal, 0, 1.07, 1.577, bed);
    label('03   •   HASTA', .5, .11, 0, 1.08, 1.594, '#e0ffff', '#42978f', bed);
    box(1.11, .4, .1, white, 0, 1.02, -1.24, bed);
    box(.65, .15, .47, linen, 0, 1.11, -.90, bed, .07).rotation.x = -.12;
    // Patient: anatomical volumes, face, nasal breathing apparatus, gown and blanket.
    const patient = new THREE.Group(); bed.add(patient); patient.position.set(0, 1.12, -.32);
    const chest = sphere(.33, .17, .47, cloth, 0, .06, .10, patient);
    sphere(.29, .13, .45, cloth, 0, .035, .61, patient);
    const blanket = sphere(.46, .17, .75, blue, 0, .055, 1.02, patient);
    box(.87, .07, .13, cloth, 0, .13, .44, patient, .025);
    for (let i = 0; i < 8; i++) {
      const fold = rod([-.36 + i * .1, .18, .55], [-.39 + i * .11, .16, 1.48], .008, blue, patient); fold.rotation.y = (i - 4) * .02;
    }
    const patientHead = new THREE.Group(); patient.add(patientHead); patientHead.position.set(0, .13, -.6); patientHead.rotation.x = -Math.PI / 2 + .16;
    sphere(.155, .195, .14, skin, 0, 0, 0, patientHead);
    const hair = mat('#51483e', 0, .95); sphere(.156, .1, .135, hair, 0, .13, -.025, patientHead);
    sphere(.03, .05, .045, skin, 0, -.015, .135, patientHead);
    for (const x of [-.157, .157]) sphere(.035, .065, .025, skin, x, 0, 0, patientHead);
    for (const x of [-.063, .063]) {
      if (preop) {
        sphere(.024, .011, .012, white, x, .044, .129, patientHead);
        sphere(.009, .010, .005, hair, x, .044, .14, patientHead);
      } else tube([[x - .025, .044, .13], [x, .039, .145], [x + .025, .044, .13]], .004, hair, patientHead);
      tube([[x - .029, .085, .117], [x, .091, .129], [x + .022, .085, .121]], .005, hair, patientHead);
    }
    tube([[-.038, -.08, .122], [0, -.085, .144], [.038, -.08, .122]], .005, mat('#935c55'), patientHead);
    const mask = sphere(.098, .096, .07, glass, 0, -.048, .15, patientHead);
    mask.visible = !preop;
    if (!preop) tube([[-.15, 0, 0], [-.11, -.08, .11], [0, -.1, .195], [.11, -.08, .11], [.15, 0, 0]], .008, white, patientHead);
    const armLeft = new THREE.Group(); patient.add(armLeft);
    for (const sign of [-1, 1]) {
      const armGroup = sign < 0 ? armLeft : patient;
      rod([sign * .27, .06, -.12], [sign * .39, -.015, .28], .071, skin, armGroup);
      rod([sign * .39, -.015, .28], [sign * .39, -.01, .66], .052, skin, armGroup);
      sphere(.065, .035, .12, skin, sign * .39, -.01, .72, armGroup);
      for (let f = 0; f < 4; f++) rod([sign * .36 + f * .018, -.01, .73], [sign * .36 + f * .018, -.015, .84 + Math.sin(f) * .015], .012, skin, armGroup);
    }
    box(.12, .02, .09, white, -.40, .04, .54, patient);
    box(.09, .035, .06, blue, .40, .025, .83, patient);
    for (const p of [[-.15, .206, -.08], [.12, .216, -.05], [.08, .211, .3]]) {
      sphere(.032, .012, .032, linen, p[0], p[1], p[2], patient);
      tube([p, [p[0] - .25, .24, p[2] - .05], [-.62, .01, -.32], [-.9, -.23, -.7]], .008, dark, patient);
    }
    // IV pole, pump, fluid bags and tubing.
    cylinder(.027, 2.42, steel, -1.41, 1.23, -.20);
    for (let i = 0; i < 5; i++) {
      const angle = i / 5 * Math.PI * 2;
      rod([-1.41, .14, -.2], [-1.41 + Math.cos(angle) * .31, .07, -.2 + Math.sin(angle) * .31], .025, steel);
      sphere(.045, .045, .045, black, -1.41 + Math.cos(angle) * .31, .055, -.2 + Math.sin(angle) * .31);
    }
    rod([-1.7, 2.41, -.2], [-1.14, 2.41, -.2], .025, steel);
    for (const x of [-1.64, -1.20]) {
      rod([x, 2.4, -.2], [x, 2.3, -.2], .012, steel);
      box(.18, .30, .07, glass, x, 2.15, -.2, scene, .03);
      box(.15, .18, .052, mat('#b0d2cf', .05, .2, { transparent: true, opacity: .6 }), x, 2.11, -.2);
      label('NaCl 0.9%', .13, .05, x, 2.17, -.152, '#263d48', '#d7e3da');
    }
    box(.30, .31, .18, white, -1.41, 1.46, -.17);
    box(.21, .15, .015, black, -1.41, 1.49, -.069);
    label('125 ml/h', .19, .065, -1.41, 1.50, -.053, '#75edc4', '#102027');
    cylinder(.026, .018, teal, -1.34, 1.36, -.06).rotation.x = Math.PI / 2;
    tube([[-1.64, 1.98, -.2], [-1.62, 1.74, -.2], [-1.50, 1.53, -.2], [-1.4, 1.2, -.1], [-1.25, .85, .12], [-.84, 1.18, .38]], .01, glass);
    const drop = sphere(.015, .025, .015, lightMat, -1.64, 1.9, -.2);
    // Bedside monitor. Screen is rendered with the exact live simulation values.
    const monitor = new THREE.Group(); scene.add(monitor); monitor.position.set(-1.43, 1.95, -1.5); monitor.rotation.y = .38;
    rod([-1.5, .1, -1.5], [-1.5, 1.95, -1.5], .042, steel);
    box(.75, .08, .55, dark, -1.5, .13, -1.5);
    box(1.04, .79, .16, white, 0, 0, 0, monitor, .06);
    box(.94, .66, .04, black, -.018, .023, .095, monitor);
    const screenCanvas = document.createElement('canvas'); screenCanvas.width = 640; screenCanvas.height = 420;
    const screenCtx = screenCanvas.getContext('2d')!;
    const screenTex = new THREE.CanvasTexture(screenCanvas); screenTex.colorSpace = THREE.SRGBColorSpace; textures.push(screenTex);
    const screenMat = new THREE.MeshBasicMaterial({ map: screenTex }); mats.push(screenMat);
    mesh(new THREE.PlaneGeometry(.88, .58), screenMat, -.024, .022, .119, monitor);
    for (let i = 0; i < 4; i++) cylinder(.018, .008, i === 0 ? teal : dark, .29 + i * .04, -.342, .096, monitor).rotation.x = Math.PI / 2;
    const alarmLamp = box(.50, .025, .075, redMat, 0, .409, .02, monitor);
    // Ventilator, gas cylinders and anesthesia trolley.
    box(.78, 1.04, .65, white, .69, .67, -1.94);
    box(.72, .12, .70, steel, .69, 1.20, -1.94);
    box(.64, .49, .17, dark, .69, 1.58, -2.06);
    label(preop ? 'VENT  •  BEKLEME' : 'VENT  •  14 / min', .54, .13, .69, 1.64, -1.968, '#67e1da', '#102027');
    label(preop ? 'PREOPERATİF' : 'PEEP  5    FiO₂  40', .54, .10, .69, 1.49, -1.967, '#9cd1d6', '#102027');
    for (const x of [.51, .70, .89]) cylinder(.055, .032, dark, x, 1.07, -1.60).rotation.x = Math.PI / 2;
    for (const x of [.49, .86]) {
      cylinder(.13, .70, x === .49 ? teal : white, x, .58, -2.38);
      sphere(.13, .1, .13, x === .49 ? teal : white, x, .93, -2.38);
      cylinder(.035, .15, steel, x, 1.03, -2.38);
    }
    tube(preop ? [[.68, 1.12, -1.59], [1.08, 1.06, -1.70], [1.13, .7, -1.70], [.91, .88, -1.61]] : [[.68, 1.12, -1.59], [.53, 1.40, -1.30], [.15, 1.50, -1.1], [-.37, 1.44, -.82]], .039, mat('#abbeb5', .08, .53));
    for (let i = 0; !preop && i < 12; i++) {
      const ring = mesh(new THREE.TorusGeometry(.041, .006, 6, 16), white, .5 - i * .067, 1.44 + Math.sin(i / 12 * Math.PI) * .045, -1.29 + i * .034); ring.rotation.y = Math.PI / 2 - .35;
    }
    const cart = new THREE.Group(); scene.add(cart); cart.position.set(2.35, 0, .05);
    box(.70, .73, .56, enamel, 0, .62, 0, cart);
    box(.80, .05, .65, steel, 0, 1.02, 0, cart);
    for (let i = 0; i < 3; i++) {
      box(.64, .18, .035, white, 0, .40 + i * .2, .3, cart);
      box(.20, .024, .03, dark, 0, .43 + i * .2, .33, cart);
    }
    for (const x of [-.29, .29]) for (const z of [-.22, .22]) { cylinder(.02, .20, steel, x, .19, z, cart); sphere(.05, .05, .05, dark, x, .08, z, cart); }
    box(.24, .12, .18, teal, -.14, 1.1, 0, cart);
    for (let i = 0; i < 3; i++) { cylinder(.027, .14, glass, .12 + i * .065, 1.11, -.03, cart); cylinder(.027, .024, blue, .12 + i * .065, 1.19, -.03, cart); }
    label('ACİL MÜDAHALE', .51, .095, 0, .80, .329, '#37565b', '#d6e4e3', cart);
    // Nurse: scrubs, folded seams, mask, badge, hands and jointed working arm.
    const nurse = new THREE.Group(); scene.add(nurse); nurse.position.set(.95, 0, .22); nurse.rotation.y = -.40;
    for (const x of [-.135, .135]) {
      box(.18, .48, .19, blue, x, .48, 0, nurse, .06);
      box(.20, .35, .23, blue, x, .80, 0, nurse, .07);
      sphere(.12, .07, .20, white, x, .09, .07, nurse);
      box(.21, .035, .34, dark, x, .045, .08, nurse);
    }
    const nurseTorso = new THREE.Group(); nurse.add(nurseTorso); nurseTorso.position.y = .94;
    sphere(.27, .37, .155, teal, 0, .33, 0, nurseTorso);
    box(.48, .34, .28, teal, 0, .20, 0, nurseTorso, .075);
    tube([[-.1, .67, .13], [0, .51, .159], [.1, .67, .13]], .013, blue, nurseTorso);
    box(.105, .11, .012, cloth, .13, .37, .154, nurseTorso, .006);
    box(.066, .083, .015, white, -.11, .49, .161, nurseTorso, .004);
    box(.048, .017, .004, blue, -.11, .51, .172, nurseTorso);
    cylinder(.07, .12, nurseSkin, 0, .73, 0, nurseTorso);
    const nurseHead = new THREE.Group(); nurseTorso.add(nurseHead); nurseHead.position.set(0, .88, 0);
    sphere(.138, .18, .134, nurseSkin, 0, 0, 0, nurseHead);
    sphere(.151, .12, .148, cloth, 0, .11, -.007, nurseHead);
    tube([[-.136, .095, .06], [0, .095, .141], [.136, .095, .06]], .012, linen, nurseHead);
    for (const x of [-.05, .05]) {
      sphere(.020, .011, .008, white, x, .026, .126, nurseHead);
      sphere(.008, .010, .005, dark, x - .004, .026, .133, nurseHead);
      rod([x - .022, .057, .127], [x + .022, .061, .123], .006, hair, nurseHead);
      sphere(.026, .045, .025, nurseSkin, Math.sign(x) * .136, -.015, 0, nurseHead);
    }
    const faceMask = box(.215, .102, .057, glove, 0, -.051, .127, nurseHead, .025); faceMask.rotation.x = -.08;
    for (let i = 0; i < 3; i++) rod([-.086, -.075 + i * .025, .158], [.086, -.075 + i * .025, .158], .002, white, nurseHead);
    tube([[-.12, -.03, .12], [-.15, .01, -.004], [-.12, -.074, .08]], .004, white, nurseHead);
    tube([[.12, -.03, .12], [.15, .01, -.004], [.12, -.074, .08]], .004, white, nurseHead);
    const workingArm = new THREE.Group(); workingArm.position.set(-.24, .51, 0); nurseTorso.add(workingArm);
    sphere(.11, .15, .115, teal, -.005, -.065, 0, workingArm);
    rod([-.015, -.1, 0], [-.17, -.3, .12], .067, nurseSkin, workingArm);
    sphere(.069, .069, .069, nurseSkin, -.17, -.3, .12, workingArm);
    rod([-.17, -.3, .12], [-.39, -.31, .23], .054, nurseSkin, workingArm);
    sphere(.072, .042, .085, glove, -.43, -.31, .25, workingArm);
    for (let i = 0; i < 4; i++) rod([-.45, -.325, .21 + i * .025], [-.53, -.33, .22 + i * .025], .012, glove, workingArm);
    const otherArm = new THREE.Group(); otherArm.position.set(.24, .52, 0); nurseTorso.add(otherArm);
    sphere(.105, .15, .11, teal, 0, -.065, 0, otherArm);
    rod([0, -.13, 0], [.08, -.32, .08], .063, nurseSkin, otherArm);
    rod([.08, -.32, .08], [-.02, -.43, .26], .048, nurseSkin, otherArm);
    sphere(.061, .047, .084, glove, -.04, -.43, .28, otherArm);
    box(.22, .035, .30, dark, -.04, -.43, .31, otherArm).rotation.x = -.3;
    // Ceiling mounted surgical luminaire with visible lamp optics.
    cylinder(.16, .16, white, -.1, 3.85, -1.3);
    rod([-.1, 3.85, -1.3], [-.1, 3.2, -1.3], .06, white);
    rod([-.1, 3.2, -1.3], [-.9, 3.2, -.2], .06, white);
    rod([-.9, 3.2, -.2], [-.9, 2.92, -.2], .05, steel);
    const surgical = new THREE.Group(); scene.add(surgical); surgical.position.set(-.9, 2.9, -.2); surgical.rotation.set(-.32, 0, -.25);
    cylinder(.49, .12, white, 0, 0, 0, surgical);
    cylinder(.44, .013, dark, 0, -.067, 0, surgical);
    for (let i = 0; i < 7; i++) {
      const a = i / 6 * Math.PI * 2, r = i === 6 ? 0 : .28;
      cylinder(.105, .018, lightMat, Math.cos(a) * r, -.082, Math.sin(a) * r, surgical);
    }
    cylinder(.035, .21, steel, 0, -.18, 0, surgical);
    // Lighting: soft clinical fill, focused operative light, cool window and red alarm bounce.
    scene.add(new THREE.HemisphereLight('#d2f7ff', '#2d4542', 1.55));
    const key = new THREE.DirectionalLight('#f1fbef', 2.7); key.position.set(1, 6, 4); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = -5; key.shadow.camera.right = 5; key.shadow.camera.top = 5; key.shadow.camera.bottom = -5; key.shadow.bias = -.0007; key.shadow.normalBias = .025; key.shadow.radius = 3; scene.add(key);
    const spot = new THREE.SpotLight('#d4faff', 16, 8, .6, .8, 1.5); spot.position.set(-.8, 2.75, -.2); spot.target.position.set(-.45, 1, .1); scene.add(spot, spot.target);
    const rim = new THREE.PointLight('#53c2d8', 12, 7, 2); rim.position.set(-3, 2.7, -1.7); scene.add(rim);
    const warm = new THREE.PointLight('#ffdfb8', 5, 6, 2); warm.position.set(3, 3, 2); scene.add(warm);
    const alarmLight = new THREE.PointLight('#ff2048', 0, 7, 1.4); alarmLight.position.set(-1.4, 2.45, -1.1); scene.add(alarmLight);
    const hitTargets = [
      { object: monitor, label: 'monitor' }, { object: patient, label: 'patient' },
      { object: cart, label: 'equipment' }, { object: nurse, label: 'nurse' },
    ];
    const raycaster = new THREE.Raycaster(); let downX = 0, downY = 0;
    const onDown = (e: PointerEvent) => { downX = e.clientX; downY = e.clientY; };
    const onUp = (e: PointerEvent) => {
      if (Math.abs(downX - e.clientX) + Math.abs(downY - e.clientY) > 7) return;
      const rect = renderer.domElement.getBoundingClientRect();
      raycaster.setFromCamera(new THREE.Vector2((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1), camera);
      const hits = raycaster.intersectObjects(hitTargets.map(t => t.object), true);
      if (hits.length) for (const target of hitTargets) {
        let object: THREE.Object3D | null = hits[0].object;
        while (object) { if (object === target.object) { inspectRef.current(target.label); return; } object = object.parent; }
      }
    };
    renderer.domElement.addEventListener('pointerdown', onDown); renderer.domElement.addEventListener('pointerup', onUp);
    const resize = () => { const { width, height } = host.getBoundingClientRect(); renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix(); };
    const ro = new ResizeObserver(resize); ro.observe(host); resize();
    const cameraViews = {
      room: { position: new THREE.Vector3(3.7, 2.9, 4.8), target: new THREE.Vector3(-.15, 1.35, -.30) },
      patient: { position: new THREE.Vector3(2.35, 2.9, 3.4), target: new THREE.Vector3(-.35, 1.19, -.1) },
      equipment: { position: new THREE.Vector3(.6, 2.65, 2.0), target: new THREE.Vector3(-1.2, 1.8, -1.1) },
    };
    let prevView: ViewMode = 'room', transitioning = true;
    resetRef.current = () => { transitioning = true; };
    controls.addEventListener('start', () => { transitioning = false; });
    let time = 8, previous = performance.now(), frame = 0, lastScreen = 0;
    function drawMonitor() {
      const { vitals, severity } = stateRef.current;
      screenCtx.fillStyle = '#06191b'; screenCtx.fillRect(0, 0, 640, 420);
      screenCtx.fillStyle = severity === 'critical' ? '#be2443' : '#1c4545'; screenCtx.fillRect(0, 0, 640, 40);
      screenCtx.font = 'bold 20px Arial'; screenCtx.fillStyle = '#efffff'; screenCtx.fillText(preop ? 'DERYA K.  •  PREOPERATİF' : severity === 'critical' ? 'KRİTİK ALARM' : 'NÖBET   •   HASTA 03', 18, 28);
      const rows = [
        { key: 'ecg', name: 'HR', value: Math.round(vitals.hr).toString(), color: '#61f3ac', y: 92 },
        { key: 'co2', name: 'ETCO₂', value: preop ? '—' : Math.round(vitals.co2).toString(), color: '#f5d57e', y: 198 },
        { key: 'pleth', name: 'SpO₂', value: Math.round(vitals.spo2).toString(), color: '#7ed9ff', y: 304 },
      ] as const;
      rows.forEach(row => {
        screenCtx.fillStyle = row.color; screenCtx.font = '18px Arial'; screenCtx.fillText(row.name, 470, row.y - 25);
        screenCtx.font = 'bold 58px monospace'; screenCtx.fillText(row.value, 470, row.y + 29);
        if (preop && row.key === 'co2') { screenCtx.font = '19px Arial'; screenCtx.fillStyle = '#779397'; screenCtx.fillText('ÖLÇÜM BAŞLATILMADI', 20, row.y + 15); return; }
        screenCtx.strokeStyle = row.color; screenCtx.lineWidth = 2.5; screenCtx.beginPath();
        for (let x = 12; x < 440; x++) {
          const period = row.key === 'co2' ? 3.5 : 60 / vitals.hr;
          const y = row.y + 20 - signal((time - (440 - x) / 90) / period, row.key) * 59;
          if (x === 12) screenCtx.moveTo(x, y); else screenCtx.lineTo(x, y);
        } screenCtx.stroke();
      });
      screenCtx.fillStyle = '#dce3d7'; screenCtx.font = '22px monospace';
      screenCtx.fillText(`TEMP ${vitals.temp.toFixed(1)}°C    NIBP ${Math.round(vitals.systolic)}/${Math.round(vitals.diastolic)}`, 20, 396);
      screenTex.needsUpdate = true;
    }
    const normalSkin = new THREE.Color('#be8e76'), sickSkin = new THREE.Color('#b35d56');
    function animate(now: number) {
      const dt = Math.min((now - previous) / 1000, .05); previous = now;
      const s = stateRef.current; if (!s.paused) time += dt;
      if (viewRef.current !== prevView) { prevView = viewRef.current; transitioning = true; }
      if (transitioning) {
        camera.position.lerp(cameraViews[prevView].position, .06); controls.target.lerp(cameraViews[prevView].target, .06);
        if (camera.position.distanceTo(cameraViews[prevView].position) < .015) transitioning = false;
      }
      const critical = s.severity === 'critical';
      const breath = Math.sin(time * s.vitals.rr / 60 * Math.PI * 2);
      chest.scale.y = .17 * (1 + breath * (critical ? .13 : .045));
      chest.position.y = .06 + breath * (critical ? .012 : .004);
      blanket.scale.y = .17 * (1 + breath * .016);
      armLeft.rotation.z = critical ? Math.sin(time * 23) * .018 : 0;
      patientHead.rotation.z = critical ? Math.sin(time * 18) * .015 : Math.sin(time * .5) * .009;
      mask.scale.z = .07 + Math.sin(time * 1.8) * .002;
      skin.color.lerp(critical ? sickSkin : normalSkin, .025);
      nurseTorso.rotation.z = Math.sin(time * .75) * .013 + (s.working ? -.085 : 0);
      nurseHead.rotation.y = -.35 + Math.sin(time * .5) * .17;
      nurseHead.rotation.x = .12 + Math.sin(time * .6) * .04;
      workingArm.rotation.z = s.working ? -.22 + Math.sin(time * 3) * .13 : Math.sin(time * 1.1) * .035;
      workingArm.rotation.y = s.working ? Math.sin(time * 2) * .16 : -.1;
      otherArm.rotation.x = Math.sin(time * .8) * .035;
      drop.position.y = 1.97 - (time * .3 % .20);
      const alarmPower = critical ? .4 + Math.pow(Math.max(0, Math.sin(time * 5)), 2) * .6 : 0;
      alarmLight.intensity = alarmPower * 9; redMat.emissiveIntensity = .06 + alarmPower * 4;
      alarmLamp.visible = critical || s.severity === 'warning';
      if (now - lastScreen > 65) { drawMonitor(); lastScreen = now; }
      controls.enabled = !s.paused; controls.update(); renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate); setReady(true);
    const onLost = (event: Event) => { event.preventDefault(); setError(true); };
    renderer.domElement.addEventListener('webglcontextlost', onLost);
    return () => {
      cancelAnimationFrame(frame); ro.disconnect(); controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', onDown); renderer.domElement.removeEventListener('pointerup', onUp); renderer.domElement.removeEventListener('webglcontextlost', onLost);
      scene.traverse(obj => { if (obj instanceof THREE.Mesh) obj.geometry.dispose(); });
      mats.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);
  return <>
    <div ref={mount} className="three-scene" />
    {!ready && !error && <div className="scene-loading"><LoaderCircle className="spin" size={28} /><span>Ameliyathane hazırlanıyor…</span></div>}
    {error && <div className="scene-loading"><strong>3B görüntü başlatılamadı</strong><p>Tarayıcıda donanım hızlandırmayı etkinleştirip sayfayı yenileyin.</p><button className="primary-btn" onClick={() => location.reload()}>Yeniden dene</button></div>}
    <div className="scene-navigation"><span><MousePointer2 size={13} /> Sürükle ve keşfet <i /> Kaydır ve yaklaş</span><button title="Kamera konumunu sıfırla" aria-label="Kamera konumunu sıfırla" onClick={() => resetRef.current()}><RotateCcw size={15} /></button></div>
  </>;
}
