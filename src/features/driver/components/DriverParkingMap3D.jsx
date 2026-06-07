import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Html, OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

const ZONE_META = {
  A: { label: "Khu A", title: "Cổng vào", color: "#dbeafe", accent: "#2563eb", position: [-5.35, 0.38, -3.8] },
  B: { label: "Khu B", title: "Trung tâm", color: "#ede9fe", accent: "#7c3aed", position: [1.15, 0.38, -3.8] },
  C: { label: "Khu C", title: "Thang máy", color: "#dcfce7", accent: "#16a34a", position: [-5.35, 0.38, 1.7] },
  D: { label: "Khu D", title: "Cổng ra", color: "#fef3c7", accent: "#d97706", position: [1.15, 0.38, 1.7] },
};

const SLOT_META = {
  AVAILABLE: { color: "#bbf7d0", car: null, emissive: "#34d399" },
  OCCUPIED: { color: "#fecdd3", car: "#fb7185", emissive: "#ef4444" },
  RESERVED: { color: "#fde68a", car: "#f59e0b", emissive: "#f59e0b" },
};

function buildSlots(zone, summary) {
  const seed = zone.charCodeAt(0) * 13 + summary.capacity;
  const occupiedRatio = summary.capacity ? summary.occupied / summary.capacity : 0;
  const reservedRatio = summary.capacity ? summary.reserved / summary.capacity : 0;
  return Array.from({ length: 10 }, (_, index) => {
    const score = ((seed + index * 17) % 100) / 100;
    let status = "AVAILABLE";
    if (score < occupiedRatio) status = "OCCUPIED";
    else if (score < occupiedRatio + reservedRatio) status = "RESERVED";
    return { id: `${zone}-${index + 1}`, status };
  });
}

export default function DriverParkingMap3D({ floor, summary }) {
  const zoneStats = useMemo(() => {
    return (floor?.zones || ["A", "B", "C", "D"]).map((zone) => {
      const slots = buildSlots(zone, summary);
      const free = slots.filter((slot) => slot.status === "AVAILABLE").length;
      return { zone, slots, free };
    });
  }, [floor, summary]);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.18),_transparent_32%),linear-gradient(135deg,_#021226,_#031a38_45%,_#07203f_80%,_#04101f)] p-4 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] bg-white/8 px-4 py-3 text-white backdrop-blur">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-100/75">Mô hình 3D thật</p>
          <h3 className="mt-1 text-xl font-black">Bãi xe {floor?.name}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-black uppercase tracking-[0.18em] text-slate-200">
          <Legend tone="available" label="Còn trống" />
          <Legend tone="occupied" label="Có xe" />
          <Legend tone="reserved" label="Đã đặt" />
        </div>
      </div>

      <div className="relative h-[560px] overflow-hidden rounded-[1.7rem] border border-white/10 bg-[#03101f] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <Canvas shadows camera={{ position: [11, 10, 12], fov: 36 }} dpr={[1, 1.75]}>
          <color attach="background" args={["#04101f"]} />
          <fog attach="fog" args={["#04101f", 20, 32]} />
          <Suspense fallback={null}>
            <Scene floor={floor} summary={summary} />
            <Environment preset="city" />
          </Suspense>
          <OrbitControls
            enablePan={false}
            minDistance={10}
            maxDistance={20}
            minPolarAngle={0.85}
            maxPolarAngle={1.2}
            autoRotate
            autoRotateSpeed={0.45}
            target={[0, 0.8, 0]}
          />
        </Canvas>

        <div className="pointer-events-none absolute left-4 top-4 rounded-2xl bg-white/10 px-4 py-3 text-xs font-bold leading-6 text-slate-100 backdrop-blur">
          <p>• Kéo chuột để xoay nhẹ mô hình</p>
          <p>• Cuộn chuột để zoom in / zoom out</p>
          <p>• Mô hình có auto rotate để tạo cảm giác thật hơn</p>
        </div>

        <div className="pointer-events-none absolute bottom-4 left-4 right-4 grid gap-3 md:grid-cols-4">
          {zoneStats.map((item) => (
            <div key={item.zone} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-300">Khu {item.zone}</p>
              <p className="mt-1 text-3xl font-black">{item.free}/10</p>
              <p className="text-xs font-semibold text-slate-300">slot mô phỏng còn trống</p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 text-sm font-semibold leading-6 text-slate-600">
        Đây là sơ đồ 3D dùng ThreeJS thật: có camera phối cảnh, ánh sáng, bóng đổ, góc nhìn isometric,
        chuyển động quay nhẹ, và người dùng có thể xoay / zoom mô hình để nhìn rõ làn xe, cổng vào ra và các khu A/B/C/D.
      </p>
    </div>
  );
}

function Scene({ floor, summary }) {
  return (
    <>
      <ambientLight intensity={0.9} />
      <hemisphereLight intensity={0.8} groundColor="#071426" color="#dbeafe" />
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <spotLight position={[-8, 14, 8]} intensity={0.8} angle={0.35} penumbra={0.4} color="#a5f3fc" />

      <group position={[0, -1.6, 0]}>
        <Ground />
        <ParkingPlatform />
        <CrossRoad />
        <CenterCore />
        <LaneMarkings />
        <GateLabel position={[-8.1, 1.4, -5.6]} label="Lối vào" color="#6ee7b7" />
        <GateLabel position={[8.1, 1.4, 5.5]} label="Cổng ra" color="#93c5fd" />

        {(floor?.zones || ["A", "B", "C", "D"]).map((zone, index) => (
          <ZoneIsland key={zone} zone={zone} slots={buildSlots(zone, summary)} index={index} />
        ))}

        <ArrowDecal position={[-6.8, 0.52, 4.7]} rotation={[0, 0, Math.PI * 0.08]} />
        <ArrowDecal position={[6.8, 0.52, -4.5]} rotation={[0, Math.PI, Math.PI * 0.08]} />
        <ContactShadows position={[0, -0.98, 0]} opacity={0.45} scale={28} blur={2.8} far={8} />
      </group>
    </>
  );
}

function Ground() {
  return (
    <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, -0.92, 0]}>
      <planeGeometry args={[34, 34]} />
      <meshStandardMaterial color="#07111e" metalness={0.2} roughness={0.95} />
    </mesh>
  );
}

function ParkingPlatform() {
  return (
    <RoundedBox args={[18, 0.55, 14]} radius={0.5} smoothness={4} position={[0, 0, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#b9c7da" roughness={0.78} metalness={0.06} />
    </RoundedBox>
  );
}

function CrossRoad() {
  return (
    <group>
      <RoundedBox args={[3.1, 0.08, 12.3]} radius={0.12} smoothness={4} position={[0, 0.35, 0]} receiveShadow>
        <meshStandardMaterial color="#41536e" roughness={0.95} />
      </RoundedBox>
      <RoundedBox args={[15.2, 0.08, 2.8]} radius={0.12} smoothness={4} position={[0, 0.35, 0]} receiveShadow>
        <meshStandardMaterial color="#41536e" roughness={0.95} />
      </RoundedBox>
    </group>
  );
}

function CenterCore() {
  return (
    <group position={[0, 0.62, 0]}>
      <RoundedBox args={[2.4, 1.15, 2.4]} radius={0.28} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color="#e2e8f0" roughness={0.45} metalness={0.08} />
      </RoundedBox>
      <Html transform position={[0, 0.85, 0]} distanceFactor={10} style={{ pointerEvents: "none" }}>
        <div style={{
          padding: "6px 10px",
          borderRadius: 14,
          background: "rgba(255,255,255,0.92)",
          color: "#0f172a",
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.16)"
        }}>
          Lõi thang máy
        </div>
      </Html>
    </group>
  );
}

function LaneMarkings() {
  const markings = [];
  for (let i = -5; i <= 5; i += 2) {
    markings.push(
      <mesh key={`v-${i}`} position={[0, 0.41, i]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.16, 0.9]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.92} />
      </mesh>
    );
  }
  for (let i = -6; i <= 6; i += 2) {
    markings.push(
      <mesh key={`h-${i}`} position={[i, 0.41, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.9, 0.16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.92} />
      </mesh>
    );
  }
  return <group>{markings}</group>;
}

function ZoneIsland({ zone, slots }) {
  const meta = ZONE_META[zone];
  const rootRef = useRef();

  useFrame((state) => {
    if (!rootRef.current) return;
    rootRef.current.position.y = meta.position[1] + Math.sin(state.clock.elapsedTime * 1.1 + meta.position[0]) * 0.025;
  });

  return (
    <group ref={rootRef} position={meta.position}>
      <RoundedBox args={[5.4, 0.34, 4.15]} radius={0.34} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={meta.color} roughness={0.62} metalness={0.05} />
      </RoundedBox>

      <RoundedBox args={[4.65, 0.06, 0.55]} radius={0.08} smoothness={4} position={[0, 0.2, 0.98]} receiveShadow>
        <meshStandardMaterial color="#4b5563" roughness={0.94} />
      </RoundedBox>

      <ZoneHeader meta={meta} />

      <group position={[-1.85, 0.25, -0.7]}>
        {slots.map((slot, index) => {
          const column = index % 5;
          const row = Math.floor(index / 5);
          return (
            <SlotTile
              key={slot.id}
              slot={slot}
              position={[column * 0.9, 0, row * 1.45]}
              label={index + 1}
            />
          );
        })}
      </group>

      <Html transform position={[1.72, 0.38, -1.4]} distanceFactor={10} style={{ pointerEvents: "none" }}>
        <div style={{
          minWidth: 112,
          borderRadius: 16,
          background: "rgba(255,255,255,0.92)",
          padding: "8px 12px",
          boxShadow: "0 14px 28px rgba(15,23,42,0.14)"
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: meta.accent, opacity: 0.72 }}>
            {meta.label}
          </div>
          <div style={{ marginTop: 4, fontSize: 15, fontWeight: 900, color: "#0f172a" }}>{meta.title}</div>
        </div>
      </Html>
    </group>
  );
}

function ZoneHeader({ meta }) {
  return (
    <group position={[1.86, 0.24, 1.34]}>
      <RoundedBox args={[0.9, 0.26, 0.8]} radius={0.18} smoothness={4} castShadow>
        <meshStandardMaterial color={meta.accent} roughness={0.32} metalness={0.08} />
      </RoundedBox>
      <Html transform position={[0, 0.24, 0]} distanceFactor={10} style={{ pointerEvents: "none" }}>
        <div style={{ color: "white", fontWeight: 900, fontSize: 15, letterSpacing: "0.08em" }}>{meta.label.replace("Khu ", "")}</div>
      </Html>
    </group>
  );
}

function SlotTile({ slot, position, label }) {
  const meta = SLOT_META[slot.status];
  return (
    <group position={position}>
      <RoundedBox args={[0.72, 0.09, 1.1]} radius={0.12} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={meta.color} roughness={0.5} metalness={0.04} />
      </RoundedBox>
      <mesh position={[0, 0.055, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.32, 0.7]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>
      {meta.car ? <MiniVehicle color={meta.car} /> : <SlotBeacon color={meta.emissive} />}
      <Html transform position={[0.28, 0.1, 0.36]} distanceFactor={18} style={{ pointerEvents: "none" }}>
        <div style={{ fontSize: 7, fontWeight: 900, color: "#475569" }}>{label}</div>
      </Html>
    </group>
  );
}

function MiniVehicle({ color }) {
  return (
    <group position={[0, 0.16, 0]}>
      <RoundedBox args={[0.42, 0.16, 0.72]} radius={0.08} smoothness={4} castShadow>
        <meshStandardMaterial color={color} roughness={0.32} metalness={0.18} />
      </RoundedBox>
      <RoundedBox args={[0.3, 0.1, 0.36]} radius={0.06} smoothness={4} position={[0, 0.1, -0.03]} castShadow>
        <meshStandardMaterial color="#e2e8f0" roughness={0.15} metalness={0.4} />
      </RoundedBox>
      {[-0.15, 0.15].map((x) => (
        <mesh key={`front-${x}`} position={[x, -0.04, 0.24]}>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 20]} />
          <meshStandardMaterial color="#0f172a" roughness={0.65} />
        </mesh>
      ))}
      {[-0.15, 0.15].map((x) => (
        <mesh key={`rear-${x}`} position={[x, -0.04, -0.24]}>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 20]} />
          <meshStandardMaterial color="#0f172a" roughness={0.65} />
        </mesh>
      ))}
    </group>
  );
}

function SlotBeacon({ color }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const scale = 1 + Math.sin(state.clock.elapsedTime * 2.4) * 0.08;
    ref.current.scale.setScalar(scale);
  });

  return (
    <mesh ref={ref} position={[0, 0.13, 0]}>
      <sphereGeometry args={[0.11, 18, 18]} />
      <meshStandardMaterial color={color} emissive={new THREE.Color(color)} emissiveIntensity={0.65} roughness={0.2} />
    </mesh>
  );
}

function GateLabel({ position, label, color }) {
  return (
    <group position={position}>
      <RoundedBox args={[1.8, 0.3, 0.7]} radius={0.18} smoothness={4} castShadow>
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.08} />
      </RoundedBox>
      <Html transform position={[0, 0.2, 0]} distanceFactor={10} style={{ pointerEvents: "none" }}>
        <div style={{ color: "#05202b", fontWeight: 900, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</div>
      </Html>
    </group>
  );
}

function ArrowDecal({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.05, 0]}>
        <planeGeometry args={[1.25, 0.3]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.92} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0.56, 0.05, 0]}>
        <coneGeometry args={[0.22, 0.34, 3]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.92} />
      </mesh>
    </group>
  );
}

function Legend({ tone, label }) {
  const toneMap = {
    available: "bg-emerald-300",
    occupied: "bg-rose-300",
    reserved: "bg-amber-300",
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded-full ${toneMap[tone]}`} />
      <span>{label}</span>
    </div>
  );
}
