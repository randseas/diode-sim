"use client";
import { useState, useRef, useEffect } from "react";
import { Element, Node, Pin } from "@/types/elements";
import { GENERIC_ELEMENTS } from "@/constants/elements";

export default function Home() {
  const [elements, setElements] = useState<Element[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    elementId: string;
  } | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);

  const [wires, setWires] = useState<
    Array<{
      id: string;
      from: { elementId: string; pinId: string };
      to: { elementId: string; pinId: string };
      color: string;
    }>
  >([]);

  const [activePin, setActivePin] = useState<{
    elementId: string;
    pinId: string;
  } | null>(null);
  const [wireColor, setWireColor] = useState<string>("#ff9f1c"); // Varsayılan endüstriyel turuncu
  const [mouseCanvasPos, setMouseCanvasPos] = useState({ x: 0, y: 0 });

  // Sağ tık menüsünü kablolar için de genişletiyoruz
  const [wireContextMenu, setWireContextMenu] = useState<{
    x: number;
    y: number;
    wireId: string;
  } | null>(null);

  // --- PAN & ZOOM STATE YAPISI ---
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.0); // Başlangıç değeri tam %100 (1.0) yapıldı
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // --- FARE KOORDİNATLARINI ZOOM VE PAN DEĞERLERİNE GÖRE DÜZELTEN FONKSİYON ---
  function getLocalCoordinates(clientX: number, clientY: number) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };

    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    return { x, y };
  }

  // --- GÜNCELLENEN DOĞRUSAL ZOOM TETİKLEYİCİ (WHEEL) ---
  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    // JavaScript float problemlerini (0.1 + 0.2 = 0.300000004) engellemek için tam sayılarla hesaplama
    const currentZoomPercent = Math.round(zoom * 100);

    // 10'ar puanlık doğrusal adım (0.10)
    const zoomStep = 10;
    let nextZoomPercent =
      e.deltaY < 0
        ? currentZoomPercent + zoomStep
        : currentZoomPercent - zoomStep;

    // Sınırlar: %20 ile %400 arası (Tam 10'un katları olarak kalır)
    nextZoomPercent = Math.max(20, Math.min(400, nextZoomPercent));
    const nextZoom = nextZoomPercent / 100;

    // Eğer zoom oranı değişmediyse hesaplama yapma (Sınırlara dayandıysa)
    if (nextZoom === zoom) return;

    // Odak noktasını farenin olduğu yere sabitleyen pan matrisi düzeltmesi
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setPan((prev) => ({
      x: mouseX - (mouseX - prev.x) * (nextZoom / zoom),
      y: mouseY - (mouseY - prev.y) * (nextZoom / zoom),
    }));
    setZoom(nextZoom);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const templateId = e.dataTransfer.getData("templateId");
    const template = GENERIC_ELEMENTS.find((p) => p.id === templateId);
    if (!template) return;

    const { x, y } = getLocalCoordinates(e.clientX, e.clientY);

    const newElement: Element = {
      ...template,
      id: crypto.randomUUID(),
      position: { x, y },
    };

    setElements((prev) => [...prev, newElement]);
  }

  function handleMouseDown(e: React.MouseEvent, el: Element) {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    setDraggingId(el.id);

    // Elemanın ui.isDragging durumunu true yap
    setElements((prev) =>
      prev.map((item) =>
        item.id === el.id
          ? { ...item, ui: { ...item.ui, isDragging: true } }
          : item,
      ),
    );

    const { x, y } = getLocalCoordinates(e.clientX, e.clientY);
    dragOffset.current = {
      x: x - el.position.x,
      y: y - el.position.y,
    };
  }

  function handleSvgMouseDown(e: React.MouseEvent) {
    // Sol tık (0) sadece boş alanda pan yapar, Orta tık (1) ise her yerde pan yapar
    if (e.button === 1 || e.button === 0) {
      setIsPanning(true);
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  }

  function handleMouseMove(e: React.MouseEvent) {
    const currentPos = getLocalCoordinates(e.clientX, e.clientY);
    setMouseCanvasPos(currentPos); // Canlı kablo çizimi için takip

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      });
      return;
    }

    if (!draggingId) return;

    const { x, y } = getLocalCoordinates(e.clientX, e.clientY);
    const newX = x - dragOffset.current.x;
    const newY = y - dragOffset.current.y;

    setElements((prev) =>
      prev.map((el) =>
        el.id === draggingId ? { ...el, position: { x: newX, y: newY } } : el,
      ),
    );
  }

  const handleMouseUp = () => {
    // Sürüklenen elemanın ui.isDragging durumunu sıfırla
    if (draggingId) {
      setElements((prev) =>
        prev.map((item) =>
          item.id === draggingId
            ? { ...item, ui: { ...item.ui, isDragging: false } }
            : item,
        ),
      );
    }
    setDraggingId(null);
    setIsPanning(false);
  };

  function handleMouseEnterElement(id: string) {
    setElements((prev) =>
      prev.map((el) =>
        el.id === id ? { ...el, ui: { ...el.ui, isHovered: true } } : el,
      ),
    );
  }

  function handleMouseLeaveElement(id: string) {
    setElements((prev) =>
      prev.map((el) =>
        el.id === id ? { ...el, ui: { ...el.ui, isHovered: false } } : el,
      ),
    );
  }

  function handleDragStart(e: React.DragEvent, templateId: string) {
    e.dataTransfer.setData("templateId", templateId);
    const dragTarget = e.currentTarget as HTMLElement;
    e.dataTransfer.setDragImage(dragTarget, 40, 20);
  }

  const handleContextMenu = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      elementId,
    });
  };

  const deleteElement = (id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    setContextMenu(null);
  };

  const handleWireContextMenu = (e: React.MouseEvent, wireId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setWireContextMenu({ x: e.clientX, y: e.clientY, wireId });
  };

  const deleteWire = (id: string) => {
    setWires((prev) => prev.filter((w) => w.id !== id));
    setWireContextMenu(null);
  };

  // Mevcut closeContextMenu fonksiyonunu güncelle
  const closeContextMenu = () => {
    if (contextMenu) setContextMenu(null);
    if (wireContextMenu) setWireContextMenu(null);
    if (activePin) setActivePin(null); // Boşluğa tıklanırsa kablo çizimini iptal et
  };

  function getPinAbsoluteCoordinates(elementId: string, pinId: string) {
    const el = elements.find((e) => e.id === elementId);
    if (!el) return { x: 0, y: 0 };
    const pin = el.pins.find((p) => p.id === pinId);
    if (!pin) return { x: 0, y: 0 };

    // Dereceyi radyana çevir
    const angleRad = ((el.rotation || 0) * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    // Pin koordinatlarını elemanın merkezindeki rotasyon matrisine göre döndür
    const rotatedX = pin.relX * cos - pin.relY * sin;
    const rotatedY = pin.relX * sin + pin.relY * cos;

    // Elemanın dünya pozisyonuna ekle
    return {
      x: el.position.x + rotatedX,
      y: el.position.y + rotatedY,
    };
  }

  function handlePinClick(
    e: React.MouseEvent,
    elementId: string,
    pinId: string,
  ) {
    e.stopPropagation();
    if (e.button !== 0) return; // Sadece sol tık

    if (!activePin) {
      // İlk pine basıldı, kablo çizimini başlat
      setActivePin({ elementId, pinId });
    } else {
      // Kendisine bağlanmasını engelle
      if (activePin.elementId === elementId && activePin.pinId === pinId) {
        setActivePin(null);
        return;
      }
      // İkinci pine basıldı, kabloyu kaydet
      const newWire = {
        id: crypto.randomUUID(),
        from: activePin,
        to: { elementId, pinId },
        color: wireColor,
      };
      setWires((prev) => [...prev, newWire]);
      setActivePin(null);
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Eğer bir eleman sürükleniyorsa ve Space tuşuna basıldıysa
      if (e.code === "Space" && draggingId) {
        e.preventDefault(); // Sayfanın aşağı kaymasını engelle

        setElements((prev) =>
          prev.map((el) =>
            el.id === draggingId
              ? { ...el, rotation: ((el.rotation || 0) + 90) % 360 }
              : el,
          ),
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [draggingId]);
  return (
    <main className="flex flex-col h-screen overflow-hidden select-none [*_*]:select-none [*_*]:user-select-none bg-[#181818] text-[#cccccc]">
      {/* header */}
      <header className="h-[35px] border-b border-[#2b2b2b] flex items-center px-2 font-medium text-sm bg-[#181818]">
        DiodeSim - Untitled Circuit
      </header>
      {/* main */}
      <div className="flex flex-1">
        {/* navbar */}
        <aside className="w-12 border-r border-[#2b2b2b] bg-[#181818] p-2">
          <div>Tab</div>
        </aside>
        {/* toolbar */}
        <aside className="w-48 border-r border-[#2b2b2b] bg-[#181818] p-2 z-10">
          <h2 className="text-[11px] uppercase tracking-wider text-[#bbbbbb] mb-4 font-bold">
            Components
          </h2>
          <div className="space-y-3">
            {GENERIC_ELEMENTS.map((el: Element) => (
              <div
                key={el.id}
                draggable
                onDragStart={(e) => handleDragStart(e, el.id)}
                className="w-full h-10 bg-[#333333] hover:bg-[#444444] rounded border border-[#444444] flex items-center justify-center cursor-grab active:cursor-grabbing select-none transition-colors"
              >
                <span className="text-white text-[10px] capitalize font-medium tracking-wide">
                  {el.name}
                </span>
              </div>
            ))}
          </div>
          <h2 className="text-[11px] uppercase tracking-wider text-[#bbbbbb] mt-8 mb-3 font-bold">
            Wire Color
          </h2>
          <div className="flex gap-2 bg-[#222222] p-2 rounded border border-[#2b2b2b]">
            {[
              { hex: "#ff9f1c", label: "Signal" },
              { hex: "#ff4444", label: "VCC" },
              { hex: "#454545", label: "GND" },
              { hex: "#00b4d8", label: "AC" },
            ].map((c) => (
              <button
                key={c.hex}
                onClick={() => setWireColor(c.hex)}
                style={{ backgroundColor: c.hex }}
                title={c.label}
                className={`w-6 h-6 rounded-full transition-transform ${
                  wireColor === c.hex
                    ? "scale-125 ring-2 ring-white"
                    : "hover:scale-110"
                }`}
              />
            ))}
          </div>
        </aside>
        {/* editor */}
        <main
          className="flex-1 bg-[#1f1f1f] relative overflow-hidden select-none"
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg
            ref={svgRef}
            className={`w-full h-full select-none ${
              draggingId
                ? "cursor-grabbing"
                : isPanning
                  ? "cursor-grabbing"
                  : "cursor-default"
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onMouseMove={handleMouseMove}
            onWheel={handleWheel}
            onMouseDown={handleSvgMouseDown}
            onClick={closeContextMenu}
            onContextMenu={(e) => e.preventDefault()}
          >
            <defs>
              <pattern
                id="grid"
                width={20}
                height={20}
                patternUnits="userSpaceOnUse"
              >
                <circle cx={1} cy={1} r={1} fill="#2f2f2f" />
              </pattern>
            </defs>

            {/* Boş alan tıklamalarını yakalamak için pan dışında kalan görünmez tabaka */}
            <rect width="100%" height="100%" fill="transparent" />

            {/* TÜM CANVAS DEĞİŞİMİNİ YÖNETEN ANA MATRİS GRUBU */}
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Izgara artık bu grubun içinde olduğu için pan ve zoom ile senkronize hareket edecek */}
              {/* Çok uzak koordinatlara kaydırma ihtimaline karşı geniş bir alan kaplaması rasyoneldir */}
              <rect
                x="-10000"
                y="-10000"
                width="20000"
                height="20000"
                fill="url(#grid)"
                pointerEvents="none"
              />

              {wires.map((wire) => {
                const p1 = getPinAbsoluteCoordinates(
                  wire.from.elementId,
                  wire.from.pinId,
                );
                const p2 = getPinAbsoluteCoordinates(
                  wire.to.elementId,
                  wire.to.pinId,
                );
                return (
                  <g key={wire.id}>
                    {/* Algılama kolaylığı için kalın görünmez hat */}
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke="transparent"
                      strokeWidth={8}
                      className="cursor-pointer"
                      onContextMenu={(e) => handleWireContextMenu(e, wire.id)}
                    />
                    {/* Gerçek İnce Kablo Hattı */}
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={wire.color}
                      strokeWidth={2}
                      strokeLinecap="round"
                      className="pointer-events-none transition-all duration-200"
                    />
                  </g>
                );
              })}

              {activePin &&
                (() => {
                  const p1 = getPinAbsoluteCoordinates(
                    activePin.elementId,
                    activePin.pinId,
                  );
                  return (
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={mouseCanvasPos.x}
                      y2={mouseCanvasPos.y}
                      stroke={wireColor}
                      strokeWidth={1.5}
                      strokeDasharray="4,4"
                      className="pointer-events-none"
                    />
                  );
                })()}

              {elements.map((el: Element) => (
                <g
                  key={el.id}
                  transform={`translate(${el.position.x}, ${el.position.y}) rotate(${el.rotation || 0})`}
                  onMouseDown={(e: React.MouseEvent) => handleMouseDown(e, el)}
                  onMouseEnter={() => handleMouseEnterElement(el.id)}
                  onMouseLeave={() => handleMouseLeaveElement(el.id)}
                  onContextMenu={(e) => handleContextMenu(e, el.id)}
                  className="group/element cursor-grab active:cursor-grabbing"
                >
                  {el.renderIcon(
                    el,
                    el.ui?.isDragging || false,
                    el.ui?.isHovered || false,
                  )}
                  <text
                    textAnchor="middle"
                    y="-14"
                    className="fill-transparent transition-colors group-hover/element:fill-[#888888] text-[8px] pointer-events-none select-none font-mono"
                  >
                    {el.name}
                  </text>
                  {el.pins.map((pin: Pin) => {
                    const currentRotation = el.rotation || 0;

                    // Dereceyi radyana çevir
                    const rad = (currentRotation * Math.PI) / 180;
                    const textDist = 14; // Pinden olan standart uzaklık mesafesi

                    // --- AKILLI GÖVDE KAÇIŞ MOTORU ---
                    // Eğer eleman 90 veya 270 derece dönmüşse (Dikey konumdaysa)
                    // yazıları gövdeden uzaklaştırmak için X ekseninde, değilse Y ekseninde öteleriz.
                    let textX = 0;
                    let textY = 0;

                    if (currentRotation === 90 || currentRotation === 270) {
                      // Dikey pozisyonda yazıları pinin sağına/soluna güvenli mesafeye iter
                      textX = pin.relX > 0 ? textDist : -textDist;
                      textY = 0;
                    } else {
                      // Yatay pozisyonda (0 ve 180 derece) yazıyı her zaman net şekilde alt tarafa kilitler
                      textX = 0;
                      textY = textDist;
                    }

                    return (
                      <g
                        key={pin.id}
                        transform={`translate(${pin.relX}, ${pin.relY})`}
                        className="group"
                      >
                        {/* GÖRSEL PİN */}
                        <circle
                          r="4"
                          style={
                            {
                              "--pin-hover": pin.color,
                            } as React.CSSProperties
                          }
                          className="fill-[#181818] stroke-[#555555] group-hover:stroke-[var(--pin-hover)] stroke-2 pointer-events-none transition-colors duration-150"
                        />

                        {/* TIKLAMA ALANI (Görünmez Hitbox) */}
                        <circle
                          r="10"
                          fill="transparent"
                          className="cursor-pointer"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => handlePinClick(e, el.id, pin.id)}
                        />

                        {/* PİN İSMİ (Gövdeye asla basmayan, her zaman düz bakan metin) */}
                        <text
                          x={textX}
                          y={textY}
                          transform={`rotate(${-currentRotation}, ${textX}, ${textY})`}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-[#666666] group-hover:fill-[#bbbbbb] text-[8px] pointer-events-none select-none font-mono transition-colors duration-150"
                        >
                          {pin.name}
                        </text>
                      </g>
                    );
                  })}
                </g>
              ))}
            </g>
          </svg>

          {/* Net %10'luk adımlarla güncellenen gösterge */}
          <div className="absolute bottom-3 right-3 bg-[#181818]/80 border border-[#2b2b2b] text-[10px] px-2 py-1 rounded text-[#888888] font-mono pointer-events-none">
            Zoom: {Math.round(zoom * 100)}%
          </div>

          {contextMenu && (
            <div
              style={{ top: contextMenu.y, left: contextMenu.x }}
              className="fixed z-50 bg-[#252526] border border-[#2b2b2b] shadow-2xl rounded py-1 w-36 text-xs text-[#cccccc]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => deleteElement(contextMenu.elementId)}
                className="w-full text-left px-3 py-2 hover:bg-[#ff4444] hover:text-white transition-colors font-medium flex items-center gap-2"
              >
                <span className="text-[10px]">✕</span> Delete
              </button>
            </div>
          )}

          {wireContextMenu && (
            <div
              style={{ top: wireContextMenu.y, left: wireContextMenu.x }}
              className="fixed z-50 bg-[#252526] border border-[#2b2b2b] shadow-2xl rounded py-1 w-36 text-xs text-[#cccccc]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => deleteWire(wireContextMenu.wireId)}
                className="w-full text-left px-3 py-2 hover:bg-[#ff4444] hover:text-white transition-colors font-medium flex items-center gap-2"
              >
                <span className="text-[10px]">✕</span> Delete Wire
              </button>
            </div>
          )}
        </main>
      </div>
      {/* statusbar */}
      <footer className="h-[22.5px] border-t border-[#2b2b2b] bg-[#181818] text-[11px] flex items-center text-white">
        <span className="w-12 border-r border-[#2b2b2b] px-1">Ready</span>
      </footer>
    </main>
  );
}
