import { ImageResponse } from "next/og"
import React from "react"
import fs from "fs"
import path from "path"

async function generate() {
  // Concert background photo
  const bgPhotoPath = path.join(process.cwd(), "public", "images", "galeria", "vendetta-banda-en-vivo-evento.jpg")
  const bgBase64 = fs.existsSync(bgPhotoPath)
    ? `data:image/jpeg;base64,${fs.readFileSync(bgPhotoPath).toString("base64")}`
    : ""

  // Logo horizontal
  const logoPath = path.join(process.cwd(), "public", "images", "logo-vendetta-horizontal.png")
  const logoBase64 = fs.existsSync(logoPath)
    ? `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`
    : ""

  const response = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "50px 64px",
          backgroundColor: "#08080a",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Foto de la banda en tarima con overlay cinematográfico */}
        {bgBase64 ? (
          <img
            src={bgBase64}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.32,
            }}
          />
        ) : null}

        {/* Viñeta oscura con gradiente para alto contraste */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, rgba(8,8,10,0.96) 0%, rgba(18,10,12,0.85) 50%, rgba(8,8,10,0.98) 100%)",
          }}
        />

        {/* Haz de luz de escenario rojo y ámbar en esquina superior derecha */}
        <div
          style={{
            position: "absolute",
            top: "-150px",
            right: "80px",
            width: "650px",
            height: "480px",
            background: "radial-gradient(circle, rgba(220, 38, 38, 0.45) 0%, rgba(245, 158, 11, 0.18) 45%, transparent 75%)",
            borderRadius: "50%",
          }}
        />

        {/* Borde perimetral VIP */}
        <div
          style={{
            position: "absolute",
            top: 22,
            left: 22,
            right: 22,
            bottom: 22,
            border: "2px solid rgba(239, 68, 68, 0.4)",
            borderRadius: 24,
          }}
        />

        {/* 1. Header con Logo y Badge */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {logoBase64 ? (
              <img
                src={logoBase64}
                style={{
                  height: 48,
                  objectFit: "contain",
                }}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 30, fontWeight: 900, letterSpacing: "0.15em", color: "#ffffff" }}>
                  VENDETTA
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.25em", color: "#ef4444" }}>
                  LIVE MUSIC & PRODUCCIÓN
                </span>
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 24px",
              background: "rgba(220, 38, 38, 0.25)",
              border: "2px solid rgba(239, 68, 68, 0.8)",
              borderRadius: 100,
              fontSize: 13,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            DISPONIBILIDAD INMEDIATA
          </div>
        </div>

        {/* 2. Bloque Central: LEYENDA "COTIZAR SHOW" / "COTIZACIÓN EN LÍNEA" */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            width: "100%",
            margin: "auto 0",
          }}
        >
          {/* Badge superior */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 22px",
              background: "#dc2626",
              borderRadius: 8,
              marginBottom: 16,
              boxShadow: "0 4px 18px rgba(220, 38, 38, 0.6)",
            }}
          >
            <span
              style={{
                fontSize: 15,
                fontWeight: 900,
                letterSpacing: "0.25em",
                color: "#ffffff",
                textTransform: "uppercase",
              }}
            >
              COTIZADOR EN LÍNEA EN TIEMPO REAL
            </span>
          </div>

          {/* LEYENDA PRINCIPAL: COTIZA TU SHOW */}
          <div
            style={{
              fontSize: 98,
              fontWeight: 900,
              letterSpacing: "0.06em",
              color: "#ffffff",
              lineHeight: 0.95,
              textTransform: "uppercase",
              textShadow: "0 4px 30px rgba(220, 38, 38, 0.85), 0 0 80px rgba(239, 68, 68, 0.4)",
              display: "flex",
            }}
          >
            COTIZAR EVENTO
          </div>

          {/* Subtítulo descriptivo */}
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "#cbd5e1",
              marginTop: 18,
              letterSpacing: "0.02em",
              maxWidth: 960,
              lineHeight: 1.35,
            }}
          >
            Personaliza tu paquete musical • Elige fecha, aforo y recibe tu cotización formal al instante por WhatsApp
          </div>
        </div>

        {/* 3. Footer: Sellos de Confianza y URL */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            paddingTop: 20,
            borderTop: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 32,
              fontSize: 15,
              fontWeight: 800,
              color: "#e2e8f0",
              letterSpacing: "0.05em",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", color: "#f87171" }}>
              Cotización Automática 24/7
            </span>
            <span style={{ display: "flex", alignItems: "center", color: "#fbbf24" }}>
              Audio, Luces & Backline
            </span>
            <span style={{ display: "flex", alignItems: "center", color: "#34d399" }}>
              Sin Compromiso
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 14,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "0.22em",
              fontFamily: "monospace",
              background: "rgba(255, 255, 255, 0.1)",
              padding: "9px 20px",
              borderRadius: 8,
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            ||||| | |||| ||| | ||| VENDETTA.MX/COTIZAR
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )

  const buffer = Buffer.from(await response.arrayBuffer())
  const outPathPng = path.join(process.cwd(), "public", "images", "opengraph-cotizar.png")
  fs.writeFileSync(outPathPng, buffer)
  console.log(`Generated: ${outPathPng} (${buffer.length} bytes / ${(buffer.length / 1024).toFixed(1)} KB)`)
}

generate().catch(console.error)
