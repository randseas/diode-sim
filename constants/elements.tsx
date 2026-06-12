import SevenSegmentDisplay from "@/components/sevenSegmentDisplay";
import { Element } from "@/types/elements";

export const GENERIC_ELEMENTS: Array<Element> = [
  {
    id: "generic:silicon_diode:1n4007",
    name: "1N4007 Diode",
    description: "Standard Silicon Rectifier Diode (1000V, 1A)",
    type: "diode",
    position: { x: 0, y: 0 },
    rotation: 0,
    runtime: { voltage: 0, current: 0 },
    properties: {
      forwardVoltage: 0.7, // volts
      reverseLeakage: 0.000005,
      isPolarized: true,
      maxVoltage: 1000, // volts
      maxCurrent: 1.0, // amps
      maxPowerDissipation: 3.0, // watts
    },
    pins: [
      {
        id: "anode",
        name: "A",
        color: "#ff4444", // Positive
        relX: -35,
        relY: 0,
        nodeId: null,
      },
      {
        id: "cathode",
        name: "C",
        color: "#777777", // Ground
        relX: 35,
        relY: 0,
        nodeId: null,
      },
    ],
    ui: {},
    renderIcon: (el: Element, isDragging: boolean, isHovered: boolean) => {
      let bodyFill = "fill-[#141414]";
      let bodyStroke = "stroke-[#333333]";
      if (isDragging) {
        bodyFill = "fill-[#2d2d2d]";
        bodyStroke = "stroke-[#444444]";
      } else if (isHovered) {
        bodyFill = "fill-[#222222]";
        bodyStroke = "stroke-[#444444]";
      }
      return (
        <g>
          {/* Sol bacak */}
          <line
            x1={-25}
            y1={0}
            x2={-35}
            y2={0}
            stroke="#555555"
            strokeWidth={1.5}
            className="transition-all duration-200"
          />
          {/* Sağ bacak (Hatalı x1 koordinatı 25 olarak düzeltildi) */}
          <line
            x1={25}
            y1={0}
            x2={35}
            y2={0}
            stroke="#555555"
            strokeWidth={1.5}
            className="transition-all duration-200"
          />
          {/* Diyot Gövdesi */}
          <rect
            x={-25}
            y={-10}
            width={50}
            height={20}
            rx={2}
            strokeWidth={1.5}
            className={`${bodyFill} ${bodyStroke} transition-all duration-200 ease-in-out`}
          />
          {/* Katot Çizgisi (Gri Şerit) */}
          <rect
            x={16}
            y={-9.2}
            width={4}
            height={18.5}
            className="fill-[#aaaaaa] transition-all duration-200"
          />
          {/* Komponent Kodu */}
          <text
            textAnchor="middle"
            x={-3}
            y={3}
            className={`font-bold font-mono pointer-events-none select-none tracking-wide text-[9px] transition-all duration-200 ${
              isHovered || isDragging ? "fill-[#eeeeee]" : "fill-[#aaaaaa]"
            }`}
          >
            1N4007
          </text>
        </g>
      );
    },
  },
  {
    id: "generic:power:dc_source_5v",
    name: "5V DC Power Source",
    description: "Regulated DC Power Supply (5V)",
    type: "battery",
    position: { x: 0, y: 0 },
    rotation: 0,
    runtime: { voltage: 5.0, current: 0 },
    properties: {
      nominalVoltage: 5.0,
      isPolarized: true,
      maxCurrent: 3.0,
    },
    pins: [
      {
        id: "positive",
        name: "+",
        color: "#ff4444",
        relX: -35,
        relY: 0,
        nodeId: null,
      },
      {
        id: "negative",
        name: "-",
        color: "#454545",
        relX: 35,
        relY: 0,
        nodeId: null,
      },
    ],
    ui: {},
    renderIcon: (el: Element, isDragging: boolean, isHovered: boolean) => {
      let bodyFill = "fill-[#141414]";
      let bodyStroke = "stroke-[#333333]";
      if (isDragging) {
        bodyFill = "fill-[#2d2d2d]";
        bodyStroke = "stroke-[#444444]";
      } else if (isHovered) {
        bodyFill = "fill-[#222222]";
        bodyStroke = "stroke-[#444444]";
      }
      return (
        <g>
          {/* Sol bağlantı hattı */}
          <line
            x1={-20}
            y1={0}
            x2={-35}
            y2={0}
            stroke="#555555"
            strokeWidth={1.5}
            className="transition-all duration-200"
          />
          {/* Sağ bağlantı hattı */}
          <line
            x1={20}
            y1={0}
            x2={35}
            y2={0}
            stroke="#555555"
            strokeWidth={1.5}
            className="transition-all duration-200"
          />
          {/* Laboratuvar Tipi Güç Bloğu Gövdesi */}
          <rect
            x={-20}
            y={-15}
            width={40}
            height={30}
            rx={3}
            strokeWidth={1.5}
            className={`${bodyFill} ${bodyStroke} transition-all duration-200 ease-in-out`}
          />
          {/* Voltaj Göstergesi (7 Segment/LCD simülasyonu) */}
          <rect
            x={-12}
            y={-11}
            width={32}
            height={24}
            rx={1}
            className="fill-[#0d0d0d] stroke-[#222222] stroke-[0.5]"
          />
          <g transform="translate(-15, -4)">
            <SevenSegmentDisplay
              value="5"
              color="#ff9f1c"
              size={0.5}
              showDp={true}
            />
          </g>
          <g transform="translate(-3, -4)">
            <SevenSegmentDisplay value="0" color="#ff9f1c" size={0.5} />
          </g>
          <g transform="translate(9, -4)">
            <SevenSegmentDisplay value="5" color="#ff9f1c" size={0.5} />
          </g>
        </g>
      );
    },
  },
];
