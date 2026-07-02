import { Element } from "@/types/elements";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

type AsideProps = {
  searchResults: Record<string, Element[]>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  expandedCategories: Record<string, boolean>;
  setExpandedCategories: (expanded: Record<string, boolean>) => void;
  handleDragStart: (
    e: React.DragEvent<HTMLDivElement>,
    elementId: string,
  ) => void;
  wireColor: string;
  showLeftArrow: boolean;
  scrollColors: (direction: "left" | "right") => void;
  colorContainerRef: any;
  checkScrollLimits: () => void;
  setWireColor: (color: string) => void;
  setHoveredColor: (
    color: {
      hex: string;
      label: string;
      desc: string;
      x: number;
      y: number;
    } | null,
  ) => void;
  showRightArrow: boolean;
  hoveredColor: {
    hex: string;
    label: string;
    desc: string;
    x: number;
    y: number;
  } | null;
  timelineEvents: {
    id: string;
    label: string;
    icon: React.ReactNode;
    timestamp: string;
  }[];
  currentTimelineIndex: number;
  MAX_TIMELINE_HISTORY: number;
};

export default function Aside({
  searchResults,
  searchQuery,
  setSearchQuery,
  expandedCategories,
  setExpandedCategories,
  handleDragStart,
  wireColor,
  showLeftArrow,
  scrollColors,
  colorContainerRef,
  checkScrollLimits,
  setWireColor,
  setHoveredColor,
  showRightArrow,
  hoveredColor,
  timelineEvents,
  currentTimelineIndex,
  MAX_TIMELINE_HISTORY,
}: AsideProps) {
  return (
    <aside className="w-60 border-r border-[#2b2b2b] bg-[#181818] z-10">
      <div className="flex flex-col bg-[#181818]">
        <div className="px-2 py-1 flex items-center justify-between">
          <div className="flex items-center gap-1 font-normal text-[11.5px] uppercase tracking-wider text-[#aaaaaa]">
            Categories
          </div>
          <span className="text-[10px] bg-[#252526] px-1.5 py-0.25 rounded text-[#666666] border border-[#2b2b2b]">
            {Object.values(searchResults).reduce(
              (acc, list) => acc + list.length,
              0,
            )}
          </span>
        </div>
        <div className="flex flex-col">
          {/* Search bar */}
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            className="w-full h-8 bg-[#222222] ring-inset border-y border-[#2b2b2b] px-2.5 text-[11px] text-white placeholder-[#666666] focus:outline-none focus:ring-1 focus:ring-[#555555] transition-colors"
          />
          <div className="flex flex-col mt-2 mx-1">
            {Object.entries(searchResults).map(([category, list]) => {
              const isExpanded = expandedCategories[category] ?? true;
              return (
                <div key={category} className="flex flex-col">
                  <button
                    onClick={() =>
                      setExpandedCategories({
                        ...expandedCategories,
                        [category]: !isExpanded,
                      })
                    }
                    className="flex gap-0.5 group cursor-pointer items-center justify-start w-full font-semibold text-[11.5px] uppercase tracking-wider text-[#aaaaaa] mb-2 hover:text-[#dddddd] transition-colors"
                  >
                    <span className="text-[#aaaaaa] group-hover:text-[#dddddd] transition-colors">
                      {isExpanded ? (
                        <ChevronDown size={15} />
                      ) : (
                        <ChevronRight size={15} />
                      )}
                    </span>
                    <span>{category}</span>
                  </button>
                  {isExpanded && (
                    <div className="px-1 space-y-1 mb-2">
                      {list.map((el: Element) => (
                        <div
                          key={el.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, el.id)}
                          className="w-full h-12 bg-[#222222]/60 hover:bg-[#2a2a2a] rounded border border-[#2b2b2b] hover:border-[#444444] flex items-center gap-3 px-2 cursor-grab active:cursor-grabbing select-none transition-all"
                        >
                          <div className="w-10 h-8 bg-[#1a1a1a] border border-[#333333] rounded flex items-center justify-center overflow-hidden shrink-0">
                            <svg
                              width="100%"
                              height="100%"
                              viewBox={`-5 -5 ${(el.ui?.width || 50) + 10} ${(el.ui?.height || 50) + 10}`}
                              className="pointer-events-none"
                            >
                              <el.renderIcon
                                el={el}
                                isDragging={false}
                                isHovered={false}
                              />
                            </svg>
                          </div>
                          <span className="text-white text-[10px] capitalize font-medium tracking-wide truncate">
                            {el.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {Object.keys(searchResults).length === 0 && (
              <div className="text-center text-[#555555] text-xs py-4 italic">
                No components found
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col border-t border-[#2b2b2b] bg-[#181818]">
        <div className="px-2 py-1 border-b border-[#2b2b2b] flex items-center justify-between">
          <div className="flex items-center gap-1 font-semibold text-[11.5px] uppercase tracking-wider text-[#aaaaaa]">
            Wire color
          </div>
          <span className="text-[10px] bg-[#252526] px-1.5 py-0.25 rounded text-[#666666] border border-[#2b2b2b]">
            {wireColor.toUpperCase()}
          </span>
        </div>
        <div className="relative flex items-center group/panel w-full z-50">
          {showLeftArrow && (
            <button
              type="button"
              onClick={() => scrollColors("left")}
              className="absolute left-1 z-50 bg-[#1e1e1f] border border-[#2b2b2b] hover:bg-[#2d2d30] text-white w-4.5 h-4.5 rounded flex items-center justify-center text-[10px] shadow-xl transition-all active:scale-95"
            >
              <ChevronLeft />
            </button>
          )}
          <div
            ref={colorContainerRef}
            onScroll={checkScrollLimits}
            className="flex flex-row overflow-x-auto px-2 pt-2 pb-0.5 gap-2 items-center scroll-smooth select-none scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden w-full"
          >
            {[
              {
                hex: "#ff4444",
                label: "VCC / VDD",
                desc: "Positive DC Voltage Supply Line",
              },
              {
                hex: "#111111",
                label: "GND / VSS",
                desc: "Ground / Reference Zero Potential",
              },
              {
                hex: "#ff9f1c",
                label: "GPIO / SGL",
                desc: "General Purpose Input/Output Signal Line",
              },
              {
                hex: "#00b4d8",
                label: "AC LINE",
                desc: "Alternating Current Power Line",
              },
              {
                hex: "#4caf50",
                label: "TXD",
                desc: "Transmit Data (Serial UART)",
              },
              {
                hex: "#9c27b0",
                label: "RXD",
                desc: "Receive Data (Serial UART)",
              },
              {
                hex: "#e91e63",
                label: "SCL",
                desc: "Serial Clock Line (I2C Bus)",
              },
              {
                hex: "#3f51b5",
                label: "SDA",
                desc: "Serial Data Line (I2C Bus)",
              },
              {
                hex: "#ffeb3b",
                label: "MOSI / SDO",
                desc: "Master Out Slave In / Serial Data Out (SPI)",
              },
              {
                hex: "#006d77",
                label: "MISO / SDI",
                desc: "Master In Slave Out / Serial Data In (SPI)",
              },
              {
                hex: "#795548",
                label: "RST / MCLR",
                desc: "Hardware Reset / Master Clear (Active-Low)",
              },
              {
                hex: "#00b4d7",
                label: "CS / SS",
                desc: "Chip Select / Slave Select (SPI Active-Low)",
              },
              {
                hex: "#f48c06",
                label: "SCK / CLK",
                desc: "Serial Clock (SPI Bus Clock)",
              },
              {
                hex: "#06d6a0",
                label: "INT / IRQ",
                desc: "External Interrupt Request Line",
              },
              {
                hex: "#d62828",
                label: "VIN / RAW",
                desc: "Unregulated Raw Voltage Input (Before Regulator)",
              },
            ].map((c) => (
              <div key={c.hex} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setWireColor(c.hex)}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredColor({
                      ...c,
                      x: rect.left + rect.width / 2,
                      y: rect.top - 8,
                    });
                  }}
                  onMouseLeave={() => setHoveredColor(null)}
                  style={{ backgroundColor: c.hex }}
                  className={`w-6 h-6 rounded-full transition-all duration-150 relative ${
                    wireColor === c.hex
                      ? "scale-110 ring-2 ring-white shadow-lg"
                      : "opacity-75 hover:opacity-100 hover:scale-110 active:scale-95"
                  }`}
                />
              </div>
            ))}
          </div>
          {showRightArrow && (
            <button
              type="button"
              onClick={() => scrollColors("right")}
              className="absolute right-1 z-50 bg-[#1e1e1f] border border-[#2b2b2b] hover:bg-[#2d2d30] text-white w-4.5 h-4.5 rounded flex items-center justify-center text-[10px] shadow-xl transition-all active:scale-95"
            >
              <ChevronRight />
            </button>
          )}
        </div>
        {hoveredColor &&
          (() => {
            const tooltipWidth = 170;
            const halfWidth = tooltipWidth / 2;
            const padding = 55;
            let computedLeft = hoveredColor.x;
            if (computedLeft - halfWidth < padding) {
              computedLeft = halfWidth + padding;
            } else if (computedLeft + halfWidth > window.innerWidth - padding) {
              computedLeft = window.innerWidth - halfWidth - padding;
            }
            const arrowOffset = hoveredColor.x - computedLeft;
            return (
              <div
                style={{
                  position: "fixed",
                  left: `${computedLeft}px`,
                  top: `${hoveredColor.y}px`,
                  transform: "translate(-50%, -100%)",
                  zIndex: 99999,
                }}
                className="flex flex-col w-[170px] bg-[#1e1e1f] border border-[#2b2b2b] p-2 rounded shadow-2xl pointer-events-none transition-opacity duration-150 animate-in fade-in zoom-in-95"
              >
                <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: hoveredColor.hex }}
                  />
                  {hoveredColor.label}
                </span>
                <span className="text-[11px] text-[#999999] mt-0.5 leading-normal whitespace-normal">
                  {hoveredColor.desc}
                </span>
                <div
                  style={{
                    left: `calc(50% + ${arrowOffset}px)`,
                    transform: "translateX(-50%)",
                  }}
                  className="absolute top-full w-3 h-3 overflow-hidden pointer-events-none"
                >
                  <div className="w-2 h-2 bg-[#1e1e1f] border border-[#2b2b2b] rotate-45 mx-auto -mt-1 shadow-2xl" />
                </div>
              </div>
            );
          })()}
      </div>
      <div className="hidden --flex flex-col border-t border-[#2b2b2b] bg-[#181818]">
        <div className="px-2 py-1 border-b border-[#2b2b2b] flex items-center justify-between">
          <div className="flex items-center gap-1 font-semibold text-[11.5px] uppercase tracking-wider text-[#aaaaaa]">
            Timeline
          </div>
          <span className="text-[10px] bg-[#252526] px-1.5 py-0.25 rounded text-[#666666] border border-[#2b2b2b]">
            {timelineEvents.length}/{MAX_TIMELINE_HISTORY} max
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
          {timelineEvents.length === 0 ? (
            <div className="text-center text-[#555555] text-xs py-8 italic">
              No actions performed yet
            </div>
          ) : (
            timelineEvents
              .slice()
              .reverse()
              .map((event, reverseIndex) => {
                const originalIndex = timelineEvents.length - 1 - reverseIndex;
                const isPast = originalIndex > currentTimelineIndex;
                return (
                  <div
                    key={event.id}
                    className={`flex items-center justify-between p-2 rounded text-xs transition-all duration-150 ${
                      originalIndex === currentTimelineIndex
                        ? "bg-[#00b4d8]/10 border border-[#00b4d8]/30 text-white font-medium"
                        : isPast
                          ? "opacity-30 bg-transparent text-[#555555]"
                          : "bg-[#1f1f1f]/50 hover:bg-[#1f1f1f] text-[#cccccc]"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className={`text-[11px] ${originalIndex === currentTimelineIndex ? "text-[#00b4d8]" : "text-[#888888]"}`}
                      >
                        {event.icon}
                      </span>
                      <span className="truncate">{event.label}</span>
                    </div>
                    <span className="text-[9px] text-[#555555] font-mono shrink-0 ml-2">
                      {event.timestamp}
                    </span>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </aside>
  );
}
