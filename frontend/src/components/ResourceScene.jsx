"use client";
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, Float, OrbitControls, Edges } from "@react-three/drei";

function CartoonObjects({ paused }) {
  const group = useRef();
  useFrame((_, delta) => {
    if (group.current && !paused) {
      group.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group ref={group}>
      <Float
        speed={paused ? 0 : 1.8}
        rotationIntensity={0.3}
        floatIntensity={0.6}
      >
        {}
        <RoundedBox
          args={[2.8, 0.24, 1.6]}
          radius={0.1}
          position={[0, -0.2, 0]}
        >
          <meshToonMaterial color="#F8DC60" />
          <Edges color="#171915" />
        </RoundedBox>
        {[-1.1, 1.1].flatMap((x) =>
          [-0.6, 0.6].map((z) => (
            <RoundedBox
              key={`${x}${z}`}
              args={[0.18, 1.1, 0.18]}
              radius={0.05}
              position={[x, -0.85, z]}
            >
              <meshStandardMaterial color="#1E1E1E" roughness={0.8} />
            </RoundedBox>
          )),
        )}

        {}
        <group position={[-1.6, 0.7, -0.4]} rotation={[0.2, 0.4, -0.1]}>
          {}
          <RoundedBox
            args={[0.9, 0.14, 0.9]}
            radius={0.06}
            position={[0, 0, 0]}
          >
            <meshToonMaterial color="#79D9C5" />
            <Edges color="#171915" />
          </RoundedBox>
          {}
          <RoundedBox
            args={[0.9, 0.9, 0.12]}
            radius={0.06}
            position={[0, 0.5, -0.4]}
          >
            <meshToonMaterial color="#79D9C5" />
            <Edges color="#171915" />
          </RoundedBox>
          {}
          {[-0.35, 0.35].flatMap((cx) =>
            [-0.35, 0.35].map((cz) => (
              <RoundedBox
                key={`leg${cx}${cz}`}
                args={[0.08, 0.6, 0.08]}
                radius={0.03}
                position={[cx, -0.35, cz]}
              >
                <meshStandardMaterial color="#1E1E1E" />
              </RoundedBox>
            )),
          )}
        </group>

        {}
        <group position={[1.6, 0.6, 0.3]} rotation={[-0.1, -0.3, 0.15]}>
          <RoundedBox args={[1.0, 1.4, 0.8]} radius={0.1} position={[0, 0, 0]}>
            <meshToonMaterial color="#F7A7C2" />
            <Edges color="#171915" />
          </RoundedBox>
          {}
          <mesh position={[0, 0.3, 0.42]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.06, 24]} />
            <meshStandardMaterial color="#1E1E1E" />
          </mesh>
          <mesh position={[0, -0.3, 0.42]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 0.06, 24]} />
            <meshStandardMaterial color="#FFE66D" />
          </mesh>
        </group>

        {}
        <mesh position={[0.2, 1.6, 0.2]} rotation={[1.1, 0.5, 0]}>
          <torusGeometry args={[0.7, 0.2, 16, 36]} />
          <meshStandardMaterial color="#A6F420" roughness={0.25} />
        </mesh>

        {}
        <mesh position={[-0.4, 1.3, -0.5]} rotation={[0.4, 0.2, 0.8]}>
          <octahedronGeometry args={[0.65]} />
          <meshStandardMaterial
            color="#FFD13B"
            roughness={0.15}
            metalness={0.3}
            flatShading
          />
        </mesh>

        {}
        <mesh position={[0.9, -0.2, 1.2]}>
          <sphereGeometry args={[0.38, 24, 24]} />
          <meshStandardMaterial color="#C3B1E1" roughness={0.3} />
        </mesh>
      </Float>
    </group>
  );
}

export default function ResourceScene({ paused = false }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={paused ? "demand" : "always"}
      fallback={
        <div className="scene-placeholder">
          ✳<small>Shared resources. Real possibilities.</small>
        </div>
      }
      camera={{ position: [5.2, 3.6, 6.2], fov: 42 }}
      aria-label="Interactive 3D comic hospitality resources sculpture"
    >
      <ambientLight intensity={2.2} />
      <directionalLight position={[4, 6, 5]} intensity={3.5} />
      <directionalLight
        position={[-4, -2, -3]}
        intensity={1.2}
        color="#C3B1E1"
      />
      <CartoonObjects paused={paused} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={0.6}
        maxPolarAngle={1.5}
      />
    </Canvas>
  );
}
