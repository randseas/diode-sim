"use client";
import { useState, useRef, useEffect, DragEventHandler } from "react";
import { Element, Pin } from "@/types/elements";
import { GENERIC_ELEMENTS } from "@/constants/elements";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

export default function Home() {
  const hasSavedDragHistory = useRef<boolean>(false);
  const [elements, setElements] = useState<Element[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    elementId: string;
  } | null>(null);
  const [clipboard, setClipboard] = useState<{
    elements: Element[];
    isCut: boolean;
  } | null>(null);
  const MAX_TIMELINE_HISTORY = 50;

  interface TimelineEvent {
    id: string;
    label: string;
    icon: string;
    timestamp: string;
    type: "undo" | "redo" | "action";
  }

  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [currentTimelineIndex, setCurrentTimelineIndex] = useState<number>(-1);
  const [activePin, setActivePin] = useState<{
    elementId: string;
    pinId: string;
  } | null>(null);
  const [wireColor, setWireColor] = useState<string>("#ff9f1c");
  const [mouseCanvasPos, setMouseCanvasPos] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] =
    useState<Record<string, Element[]>>(GENERIC_ELEMENTS);

  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    Components: true,
    Sources: true,
  });

  const [wireContextMenu, setWireContextMenu] = useState<{
    x: number;
    y: number;
    wireId: string;
  } | null>(null);

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.0);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const undoStack = useRef<Element[][]>([]);
  const redoStack = useRef<Element[][]>([]);

  const saveHistory = (
    currentElements: Element[],
    actionLabel: string,
    actionIcon: string,
  ) => {
    const snapshot = currentElements.map((el) => ({
      ...el,
      pins: el.pins.map((p) => ({ ...p })),
    }));
    undoStack.current.push(snapshot);
    redoStack.current = [];

    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const newEvent: TimelineEvent = {
      id: crypto.randomUUID(),
      label: actionLabel,
      icon: actionIcon,
      timestamp: now,
      type: "action",
    };

    setTimelineEvents((prev) => {
      const sliced = prev.slice(0, currentTimelineIndex + 1);
      const updated = [...sliced, newEvent];

      if (updated.length > MAX_TIMELINE_HISTORY) {
        updated.shift();
      }
      return updated;
    });

    setCurrentTimelineIndex((prev) =>
      Math.min(prev + 1, MAX_TIMELINE_HISTORY - 1),
    );
  };

  function getLocalCoordinates(clientX: number, clientY: number) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    return { x, y };
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const currentZoomPercent = Math.round(zoom * 100);
    const zoomStep = 10;
    let nextZoomPercent =
      e.deltaY < 0
        ? currentZoomPercent + zoomStep
        : currentZoomPercent - zoomStep;

    // Clamp zoom between 20% and 400%
    nextZoomPercent = Math.max(20, Math.min(400, nextZoomPercent));
    const nextZoom = nextZoomPercent / 100;
    if (nextZoom === zoom) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setPan((prev) => ({
      x: mouseX - (mouseX - prev.x) * (nextZoom / zoom),
      y: mouseY - (mouseY - prev.y) * (nextZoom / zoom),
    }));
    setZoom(nextZoom);
  }
  function handleDrop(e: DragEventHandler<SVGSVGElement> | any) {
    e.preventDefault();
    const templateId = e.dataTransfer?.getData("templateId");

    const template = Object.values(GENERIC_ELEMENTS)
      .flat()
      .find((p) => p.id === templateId);

    if (!template) return;
    const { x, y } = getLocalCoordinates(e.clientX, e.clientY);

    const newElement: Element = {
      ...template,
      id: crypto.randomUUID(),
      position: {
        x: Math.round(x / 13) * 13,
        y: Math.round(y / 13) * 13,
      },
    };
    setElements((prev) => [...prev, newElement]);
  }
  function handleMouseDown(e: React.MouseEvent, el: Element) {
    if (e.button !== 0) return;
    const target = e.target as SVGElement;
    if (target.closest('[data-pin="true"]')) return;
    e.stopPropagation();
    e.preventDefault();
    let newSelected = [...selectedItems];
    const isAlreadySelected = selectedItems.some(
      (item) => item.type === "element" && item.id === el.id,
    );

    if (e.ctrlKey || e.shiftKey) {
      if (isAlreadySelected) {
        newSelected = selectedItems.filter(
          (item) => !(item.type === "element" && item.id === el.id),
        );
      } else {
        newSelected = [...selectedItems, { type: "element", id: el.id }];
      }
    } else {
      if (!isAlreadySelected) {
        newSelected = [{ type: "element", id: el.id }];
      }
    }
    setSelectedItems(newSelected);
    setDraggingId(el.id);

    const posRecords: Record<string, { x: number; y: number }> = {};
    elements.forEach((item) => {
      if (
        newSelected.some((si) => si.type === "element" && si.id === item.id)
      ) {
        posRecords[item.id] = { ...item.position };
      }
    });
    wires.forEach((w) => {
      w.nodes.forEach((n) => {
        if (
          newSelected.some((si) => si.type === "node" && si.nodeId === n.id)
        ) {
          posRecords[n.id] = { x: n.x, y: n.y };
        }
      });
    });
    initialPositions.current = posRecords;

    const { x, y } = getLocalCoordinates(e.clientX, e.clientY);
    dragOffset.current = { x, y };

    hasSavedDragHistory.current = false;
  }

  function handleSvgMouseDown(e: React.MouseEvent) {
    svgRef.current?.focus();
    if (e.button === 1) {
      setIsPanning(true);
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }

    if (e.button === 0) {
      const target = e.target as SVGElement;
      if (
        target.tagName === "svg" ||
        target.getAttribute("fill") === "transparent"
      ) {
        setSelectedItems([]);
        const localPos = getLocalCoordinates(e.clientX, e.clientY);
        setSelectionBox({
          startX: localPos.x,
          startY: localPos.y,
          currentX: localPos.x,
          currentY: localPos.y,
        });
      }
    }
  }
  function handleMouseMove(e: React.MouseEvent) {
    const currentPos = getLocalCoordinates(e.clientX, e.clientY);
    setMouseCanvasPos(currentPos);

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      });
      return;
    }

    if (draggingWireNode) {
      if (dragStartPos.current) {
        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > 3) {
          dragStartPos.current = null;
        }
      }

      const snappedX = Math.round(currentPos.x / 13) * 13;
      const snappedY = Math.round(currentPos.y / 13) * 13;

      setWires((prev) =>
        prev.map((w) => {
          if (w.id !== draggingWireNode.wireId) return w;
          return {
            ...w,
            nodes: w.nodes.map((n) =>
              n.id === draggingWireNode.nodeId
                ? { ...n, x: snappedX, y: snappedY }
                : n,
            ),
          };
        }),
      );
      return;
    }

    if (selectionBox) {
      const localPos = getLocalCoordinates(e.clientX, e.clientY);
      setSelectionBox((prev) =>
        prev ? { ...prev, currentX: localPos.x, currentY: localPos.y } : null,
      );

      const minX = Math.min(selectionBox.startX, localPos.x);
      const maxX = Math.max(selectionBox.startX, localPos.x);
      const minY = Math.min(selectionBox.startY, localPos.y);
      const maxY = Math.max(selectionBox.startY, localPos.y);

      const hitElements = elements
        .filter(
          (el) =>
            el.position.x >= minX &&
            el.position.x <= maxX &&
            el.position.y >= minY &&
            el.position.y <= maxY,
        )
        .map((el) => ({ type: "element" as const, id: el.id }));

      const hitNodes: Array<{ type: "node"; wireId: string; nodeId: string }> =
        [];
      wires.forEach((wire) => {
        wire.nodes.forEach((node) => {
          if (
            node.x >= minX &&
            node.x <= maxX &&
            node.y >= minY &&
            node.y <= maxY
          ) {
            hitNodes.push({ type: "node", wireId: wire.id, nodeId: node.id });
          }
        });
      });

      setSelectedItems([...hitElements, ...hitNodes]);
      return;
    }

    if (!draggingId && !draggingWireNode) return;

    const { x, y } = getLocalCoordinates(e.clientX, e.clientY);
    const deltaX = x - dragOffset.current.x;
    const deltaY = y - dragOffset.current.y;

    if (
      (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) &&
      !hasSavedDragHistory.current
    ) {
      saveHistory(elements, "Move Component", "✛");
      hasSavedDragHistory.current = true;
    }
    setElements((prev) =>
      prev.map((el) => {
        const isSelected = selectedItems.some(
          (item) => item.type === "element" && item.id === el.id,
        );
        if (isSelected && initialPositions.current[el.id]) {
          const targetX = initialPositions.current[el.id].x + deltaX;
          const targetY = initialPositions.current[el.id].y + deltaY;
          return {
            ...el,
            position: {
              x: targetX,
              y: targetY,
            },
          };
        }
        return el;
      }),
    );
    setWires((prev) =>
      prev.map((w) => {
        return {
          ...w,
          nodes: w.nodes.map((n) => {
            const isSelected = selectedItems.some(
              (item) => item.type === "node" && item.nodeId === n.id,
            );
            if (isSelected && initialPositions.current[n.id]) {
              const targetX = initialPositions.current[n.id].x + deltaX;
              const targetY = initialPositions.current[n.id].y + deltaY;
              return {
                ...n,
                x: Math.round(targetX / 13) * 13,
                y: Math.round(targetY / 13) * 13,
              };
            }
            return n;
          }),
        };
      }),
    );
  }
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const handleMouseUp = (e: React.MouseEvent) => {
    if (e.button !== 0 && e.button !== 1) return;

    dragStartPos.current = null;
    setDraggingId(null);
    setDraggingWireNode(null);
    setIsPanning(false);
    setSelectionBox(null);

    hasSavedDragHistory.current = false;
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
  const handleWireContextMenu = (e: React.MouseEvent, wireId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setWireContextMenu({ x: e.clientX, y: e.clientY, wireId });
  };
  const deleteWire = (id: string) => {
    setWires((prev) => prev.filter((w) => w.id !== id));
    setWireContextMenu(null);
  };
  const closeContextMenu = () => {
    if (contextMenu) setContextMenu(null);
    if (wireContextMenu) setWireContextMenu(null);
    setSelectedWireId(null);
    setSelectedWireNode(null);
  };
  function getPinAbsoluteCoordinates(elementId: string, pinId: string) {
    if (elementId.startsWith("WIRE-")) {
      const parentWireId = elementId.replace("WIRE-", "");
      const parentWire = wires.find((w) => w.id === parentWireId);
      const targetNode = parentWire?.nodes.find((n) => n.id === pinId);
      if (targetNode) {
        return { x: targetNode.x, y: targetNode.y };
      }
    }
    const el = elements.find((e) => e.id === elementId);
    if (!el) return { x: 0, y: 0 };
    const pin = el.pins.find((p) => p.id === pinId);
    if (!pin) return { x: 0, y: 0 };
    // Convert rotation to radians
    const angleRad = ((el.rotation || 0) * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    // Rotate pin coordinates by element rotation matrix
    const rotatedX = pin.relX * cos - pin.relY * sin;
    const rotatedY = pin.relX * sin + pin.relY * cos;
    // Add element world position
    return {
      x: el.position.x + rotatedX,
      y: el.position.y + rotatedY,
    };
  }
  useEffect(() => {
    const handler = setTimeout(() => {
      if (!searchQuery.trim()) {
        setSearchResults(GENERIC_ELEMENTS);
        return;
      }

      const filtered: Record<string, Element[]> = {};
      Object.entries(GENERIC_ELEMENTS).forEach(([category, list]) => {
        const matches = list.filter((el) =>
          el.name.toLowerCase().includes(searchQuery.toLowerCase()),
        );
        if (matches.length > 0) {
          filtered[category] = matches;
        }
      });
      setSearchResults(filtered);
    }, 150);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const [selectedItems, setSelectedItems] = useState<
    Array<
      | { type: "element"; id: string }
      | { type: "node"; wireId: string; nodeId: string }
    >
  >([]);
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const initialPositions = useRef<Record<string, { x: number; y: number }>>({});

  const deleteSelectedElements = () => {
    if (selectedItems.length === 0) return;

    if (selectedItems.length === 1) {
      saveHistory(elements, "Element Deleted", "✕");
    } else {
      saveHistory(elements, `${selectedItems.length} Elements Deleted`, "✕");
    }

    const elementIdsToDelete = selectedItems
      .filter((i) => i.type === "element")
      .map((i) => i.id);
    const nodeIdsToDelete = selectedItems
      .filter((i) => i.type === "node")
      .map((i) => (i as any).nodeId);

    if (elementIdsToDelete.length > 0) {
      setElements((prev) =>
        prev.filter((el) => !elementIdsToDelete.includes(el.id)),
      );
      setWires((prev) =>
        prev.filter(
          (wire) =>
            !elementIdsToDelete.includes(wire.from.elementId) &&
            !elementIdsToDelete.includes(wire.to.elementId),
        ),
      );
    }

    if (nodeIdsToDelete.length > 0) {
      setWires((prev) =>
        prev.map((w) => ({
          ...w,
          nodes: w.nodes.filter((n) => !nodeIdsToDelete.includes(n.id)),
        })),
      );
    }

    setSelectedItems([]);
    setContextMenu(null);
  };

  const deleteElement = (id: string) => {
    saveHistory(elements, "Element Deleted", "✕");
    setElements((prev) => prev.filter((el) => el.id !== id));
    setWires((prev) =>
      prev.filter((w) => w.from.elementId !== id && w.to.elementId !== id),
    );
    setSelectedItems((prev) =>
      prev.filter((item) => item.type !== "element" || item.id !== id),
    );
    setContextMenu(null);
  };

  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [hoveredWireId, setHoveredWireId] = useState<string | null>(null);
  const [selectedWireNode, setSelectedWireNode] = useState<{
    wireId: string;
    nodeId: string;
  } | null>(null);
  const [draggingWireNode, setDraggingWireNode] = useState<{
    wireId: string;
    nodeId: string;
  } | null>(null);

  const [wires, setWires] = useState<
    Array<{
      id: string;
      from: { elementId: string; pinId: string };
      to: { elementId: string; pinId: string };
      color: string;
      nodes: Array<{ id: string; x: number; y: number }>;
    }>
  >([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.getAttribute("contenteditable") === "true")
      ) {
        return;
      }
      const isCtrl = e.ctrlKey || e.metaKey;

      if (isCtrl && e.code === "KeyA") {
        e.preventDefault();
        const allElements = elements.map((el) => ({
          type: "element" as const,
          id: el.id,
        }));
        setSelectedItems(allElements);
        return;
      }

      if (isCtrl && (e.code === "KeyC" || e.code === "KeyX")) {
        const selectedElementIds = selectedItems
          .filter((item) => item.type === "element")
          .map((item) => item.id);

        if (selectedElementIds.length === 0) return;
        e.preventDefault();

        const isCutMode = e.code === "KeyX";
        const copiedElements: Element[] = [];

        selectedElementIds.forEach((id) => {
          const found = elements.find((el) => el.id === id);
          if (found) {
            const { renderIcon, ui, pins, ...pureData } = found;

            const cleanedPins = pins.map((pin) => ({
              ...pin,
              nodeId: null,
            }));

            const cleanedUi = {
              isHovered: false,
              isClicked: false,
              isSelected: false,
              isDragging: false,
              isRotating: false,
              isBlown: found.ui?.isBlown || false,
            };

            copiedElements.push({
              ...(JSON.parse(JSON.stringify(pureData)) as Element),
              pins: JSON.parse(JSON.stringify(cleanedPins)),
              ui: cleanedUi,
              renderIcon: found.renderIcon,
            });
          }
        });

        setClipboard({ elements: copiedElements, isCut: isCutMode });

        if (isCutMode) {
          deleteSelectedElements();
        }
        return;
      }

      if (isCtrl && e.code === "KeyV") {
        if (!clipboard || clipboard.elements.length === 0) return;
        e.preventDefault();

        if (clipboard.elements.length > 1) {
          saveHistory(
            elements,
            `Paste ${clipboard.elements.length} Components`,
            "📋",
          );
        } else {
          saveHistory(elements, "Paste Component", "📋");
        }

        const currentClipboard = clipboard;
        const offset = 40;

        const newElements: Element[] = currentClipboard.elements.map((el) => {
          const newId = crypto.randomUUID();

          const renewedPins = el.pins.map((p) => ({
            ...p,
            id: crypto.randomUUID(),
            nodeId: null,
          }));

          return {
            ...el,
            id: newId,
            position: {
              x: el.position.x + offset,
              y: el.position.y + offset,
            },
            pins: renewedPins,
          };
        });
        setElements((prev) => [...prev, ...newElements]);
        setSelectedItems(
          newElements.map((el) => ({ type: "element", id: el.id })),
        );
        if (clipboard.isCut) {
          setClipboard(null);
        } else {
          setClipboard({
            isCut: false,
            elements: currentClipboard.elements.map((el) => ({
              ...el,
              position: {
                x: el.position.x + offset,
                y: el.position.y + offset,
              },
            })),
          });
        }
        return;
      }
      if (isCtrl && e.code === "KeyD") {
        const selectedElementIds = selectedItems
          .filter((item) => item.type === "element")
          .map((item) => item.id);

        if (selectedElementIds.length === 0) return;
        e.preventDefault();

        if (selectedElementIds.length > 1) {
          saveHistory(
            elements,
            `Duplicate ${selectedElementIds.length} Elements`,
            "🗐",
          );
        } else {
          saveHistory(elements, "Element Duplicated", "🗐");
        }
        const tempElements: Element[] = [];
        selectedElementIds.forEach((id) => {
          const found = elements.find((el) => el.id === id);
          if (found) {
            const { renderIcon, ui, pins, ...pureData } = found;

            const cleanedPins = pins.map((pin) => ({
              ...pin,
              nodeId: null,
            }));

            const cleanedUi = {
              isHovered: false,
              isClicked: false,
              isSelected: false,
              isDragging: false,
              isRotating: false,
              isBlown: found.ui?.isBlown || false,
            };

            tempElements.push({
              ...(JSON.parse(JSON.stringify(pureData)) as Element),
              id: crypto.randomUUID(),
              position: { x: found.position.x + 20, y: found.position.y + 20 },
              pins: cleanedPins.map((p) => ({ ...p, id: crypto.randomUUID() })),
              ui: cleanedUi,
              renderIcon: found.renderIcon,
            });
          }
        });

        setElements((prev) => [...prev, ...tempElements]);
        setSelectedItems(
          tempElements.map((el) => ({ type: "element", id: el.id })),
        );
        return;
      }

      if (e.code === "Delete") {
        if (selectedItems.length > 0) {
          deleteSelectedElements();
        }
        return;
      }

      if (e.code === "Escape") {
        if (activePin) setActivePin(null);
        setSelectedItems([]);
        return;
      }

      if (e.code === "Space") {
        const targetElementIds = selectedItems
          .filter((i) => i.type === "element")
          .map((i) => i.id);
        const targets =
          targetElementIds.length > 0
            ? targetElementIds
            : draggingId
              ? [draggingId]
              : [];
        if (targets.length === 0) return;
        e.preventDefault();
        setElements((prev) =>
          prev.map((el) =>
            targets.includes(el.id)
              ? { ...el, rotation: ((el.rotation || 0) + 90) % 360 }
              : el,
          ),
        );
      }

      if (isCtrl && !e.shiftKey && e.code === "KeyZ") {
        e.preventDefault();
        if (undoStack.current.length === 0) return;

        const currentSnapshot = elements.map((el) => ({
          ...el,
          pins: el.pins.map((p) => ({ ...p })),
        }));
        redoStack.current.push(currentSnapshot);

        const previousState = undoStack.current.pop()!;
        setElements(previousState);
        setSelectedItems([]);

        setCurrentTimelineIndex((prev) => Math.max(prev - 1, -1));
        return;
      }

      if (
        (isCtrl && e.code === "KeyY") ||
        (isCtrl && e.shiftKey && e.code === "KeyZ")
      ) {
        e.preventDefault();
        if (redoStack.current.length === 0) return;

        const currentSnapshot = elements.map((el) => ({
          ...el,
          pins: el.pins.map((p) => ({ ...p })),
        }));
        undoStack.current.push(currentSnapshot);

        const nextState = redoStack.current.pop()!;
        setElements(nextState);
        setSelectedItems([]);

        setCurrentTimelineIndex((prev) =>
          Math.min(prev + 1, timelineEvents.length - 1),
        );
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItems, draggingId, activePin, elements, clipboard]);

  function handlePinMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
  }

  function handlePinMouseUp(
    e: React.MouseEvent,
    elementId: string,
    pinId: string,
  ) {
    e.stopPropagation();
    if (e.button !== 0 || !dragStartPos.current) return;

    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 3) {
      dragStartPos.current = null;
      return;
    }
    dragStartPos.current = null;

    if (!activePin) {
      setActivePin({ elementId, pinId });
    } else {
      if (activePin.elementId === elementId && activePin.pinId === pinId) {
        setActivePin(null);
        return;
      }
      const newWire = {
        id: crypto.randomUUID(),
        from: { ...activePin },
        to: { elementId, pinId },
        color: wireColor,
        nodes: [],
      };
      setWires((prev) => [...prev, newWire]);
      setActivePin(null);
    }
  }

  const colorContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScrollLimits = () => {
    const container = colorContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftArrow(scrollLeft > 2);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 2);
    }
  };

  const scrollColors = (direction: "left" | "right") => {
    const container = colorContainerRef.current;
    if (container) {
      const scrollAmount = 120;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    checkScrollLimits();
    window.addEventListener("resize", checkScrollLimits);
    return () => window.removeEventListener("resize", checkScrollLimits);
  }, []);

  const [hoveredColor, setHoveredColor] = useState<{
    hex: string;
    label: string;
    desc: string;
    x: number;
    y: number;
  } | null>(null);

  return (
    <main className="flex flex-col h-screen overflow-hidden select-none [*_*]:select-none [*_*]:user-select-none bg-[#181818] text-[#cccccc]">
      <header className="h-[35px] border-b border-[#2b2b2b] flex items-center px-2 font-medium text-sm bg-[#181818]">
        DiodeSim - Untitled Circuit
      </header>
      <div className="flex flex-1">
        <aside className="w-12 border-r border-[#2b2b2b] bg-[#181818] p-2">
          <div>Tab</div>
        </aside>
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
                          setExpandedCategories((prev) => ({
                            ...prev,
                            [category]: !isExpanded,
                          }))
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
                                  {el.renderIcon(el, false, false)}
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
                } else if (
                  computedLeft + halfWidth >
                  window.innerWidth - padding
                ) {
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
                    const originalIndex =
                      timelineEvents.length - 1 - reverseIndex;
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
        <main
          className="flex-1 bg-[#1f1f1f] relative overflow-hidden select-none"
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg
            ref={svgRef}
            tabIndex={0}
            className={`w-full h-full select-none outline-none ${
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
            onMouseUp={handleMouseUp}
            onClick={closeContextMenu}
            onContextMenu={(e) => e.preventDefault()}
          >
            <rect width="100%" height="100%" fill="transparent" />
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              <rect
                x="-10000"
                y="-10000"
                width="20000"
                height="20000"
                fill="url(#grid)"
                pointerEvents="none"
              />
              {selectionBox && (
                <rect
                  x={Math.min(selectionBox.startX, selectionBox.currentX)}
                  y={Math.min(selectionBox.startY, selectionBox.currentY)}
                  width={Math.abs(selectionBox.currentX - selectionBox.startX)}
                  height={Math.abs(selectionBox.currentY - selectionBox.startY)}
                  fill="rgba(0, 180, 216, 0.04)"
                  stroke="#00b4d8"
                  strokeWidth={1 / zoom}
                  strokeDasharray={`${3 / zoom},${3 / zoom}`}
                  pointerEvents="none"
                />
              )}
              {wires.map((wire) => {
                const pStart = getPinAbsoluteCoordinates(
                  wire.from.elementId,
                  wire.from.pinId,
                );
                const pEnd = getPinAbsoluteCoordinates(
                  wire.to.elementId,
                  wire.to.pinId,
                );
                const points = [pStart, ...wire.nodes, pEnd];
                const isWireSelected = selectedWireId === wire.id;
                const isWireHovered = hoveredWireId === wire.id;

                return (
                  <g
                    key={`wire-lines-${wire.id}`}
                    onMouseEnter={() => setHoveredWireId(wire.id)}
                    onMouseLeave={() => setHoveredWireId(null)}
                  >
                    {points.map((pt, index) => {
                      if (index === points.length - 1) return null;
                      const nextPt = points[index + 1];

                      return (
                        <g key={`${wire.id}-seg-${index}`}>
                          <line
                            x1={pt.x}
                            y1={pt.y}
                            x2={nextPt.x}
                            y2={nextPt.y}
                            stroke="transparent"
                            strokeWidth={10}
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedWireId(wire.id);
                              setSelectedWireNode(null);
                            }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              const localClick = getLocalCoordinates(
                                e.clientX,
                                e.clientY,
                              );
                              const newNode = {
                                id: crypto.randomUUID(),
                                x: localClick.x,
                                y: localClick.y,
                              };
                              setWires((prev) =>
                                prev.map((w) => {
                                  if (w.id !== wire.id) return w;
                                  const updatedNodes = [...w.nodes];
                                  updatedNodes.splice(index, 0, newNode);
                                  return { ...w, nodes: updatedNodes };
                                }),
                              );
                            }}
                            onContextMenu={(e) => {
                              setSelectedWireId(wire.id);
                              handleWireContextMenu(e, wire.id);
                            }}
                          />

                          {(isWireSelected || isWireHovered) && (
                            <line
                              x1={pt.x}
                              y1={pt.y}
                              x2={nextPt.x}
                              y2={nextPt.y}
                              stroke={
                                isWireSelected
                                  ? "#00b4d8"
                                  : "rgba(255,255,255,0.25)"
                              }
                              strokeWidth={isWireSelected ? 5 : 4}
                              strokeLinecap="round"
                              className="pointer-events-none transition-all duration-150"
                            />
                          )}
                          <line
                            x1={pt.x}
                            y1={pt.y}
                            x2={nextPt.x}
                            y2={nextPt.y}
                            stroke={wire.color}
                            strokeWidth={2}
                            strokeLinecap="round"
                            className="pointer-events-none"
                          />
                        </g>
                      );
                    })}
                  </g>
                );
              })}

              {wires.map((wire) => (
                <g key={`wire-nodes-group-${wire.id}`}>
                  {wire.nodes.map((node) => {
                    const isNodeSelected = selectedItems.some(
                      (item) => item.type === "node" && item.nodeId === node.id,
                    );
                    return (
                      <g
                        key={node.id}
                        transform={`translate(${node.x}, ${node.y})`}
                        data-pin="true"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          if (e.button !== 0) return;
                          handlePinMouseDown(e);
                          setDraggingWireNode({
                            wireId: wire.id,
                            nodeId: node.id,
                          });

                          let newSelected = [...selectedItems];
                          if (e.ctrlKey || e.shiftKey) {
                            if (isNodeSelected) {
                              newSelected = selectedItems.filter(
                                (item) =>
                                  !(
                                    item.type === "node" &&
                                    item.nodeId === node.id
                                  ),
                              );
                            } else {
                              newSelected = [
                                ...selectedItems,
                                {
                                  type: "node",
                                  wireId: wire.id,
                                  nodeId: node.id,
                                },
                              ];
                            }
                          } else {
                            if (!isNodeSelected) {
                              newSelected = [
                                {
                                  type: "node",
                                  wireId: wire.id,
                                  nodeId: node.id,
                                },
                              ];
                            }
                          }
                          setSelectedItems(newSelected);

                          const posRecords: Record<
                            string,
                            { x: number; y: number }
                          > = {};
                          elements.forEach((item) => {
                            if (
                              newSelected.some(
                                (si) =>
                                  si.type === "element" && si.id === item.id,
                              )
                            ) {
                              posRecords[item.id] = { ...item.position };
                            }
                          });
                          wires.forEach((w) => {
                            w.nodes.forEach((n) => {
                              if (
                                newSelected.some(
                                  (si) =>
                                    si.type === "node" && si.nodeId === n.id,
                                )
                              ) {
                                posRecords[n.id] = { x: n.x, y: n.y };
                              }
                            });
                          });
                          initialPositions.current = posRecords;

                          const { x, y } = getLocalCoordinates(
                            e.clientX,
                            e.clientY,
                          );
                          dragOffset.current = { x, y };
                        }}
                        onMouseUp={(e) => {
                          e.stopPropagation();
                          if (e.button !== 0) return;
                          setDraggingWireNode(null);
                          handlePinMouseUp(e, `WIRE-${wire.id}`, node.id);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();

                          setSelectedItems([
                            { type: "node", wireId: wire.id, nodeId: node.id },
                          ]);

                          setContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            elementId: `NODE-${node.id}`,
                          });
                        }}
                      >
                        <circle
                          r={7}
                          className="fill-transparent hover:fill-white/10 cursor-move"
                        />
                        <circle
                          r={4}
                          fill={isNodeSelected ? "#00b4d8" : "#181818"}
                          stroke={isNodeSelected ? "#ffffff" : wire.color}
                          strokeWidth={1.5}
                          className="transition-colors duration-150 cursor-pointer"
                        />
                      </g>
                    );
                  })}
                </g>
              ))}
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
              {elements.map((el: Element) => {
                const isSelected = selectedItems.some(
                  (item) => item.type === "element" && item.id === el.id,
                );
                const zeroPointX = el.ui?.zeroPoint?.x || 0;
                const zeroPointY = el.ui?.zeroPoint?.y || 0;
                return (
                  <g
                    key={el.id}
                    transform={`translate(${el.position.x - zeroPointX}, ${el.position.y - zeroPointY}) rotate(${el.rotation || 0})`}
                    onMouseDown={(e: React.MouseEvent) =>
                      handleMouseDown(e, el)
                    }
                    onMouseEnter={() => handleMouseEnterElement(el.id)}
                    onMouseLeave={() => handleMouseLeaveElement(el.id)}
                    onContextMenu={(e) => handleContextMenu(e, el.id)}
                    className="group/element cursor-grab active:cursor-grabbing z-100"
                  >
                    {isSelected && (
                      <rect
                        x="-1"
                        y="-1"
                        width={el.ui?.width ? el.ui?.width + 2 : 50}
                        height={el.ui?.height ? el.ui?.height + 2 : 50}
                        fill="transparent"
                        stroke="#00b4d8"
                        strokeWidth={1.25}
                        strokeDasharray="4,2"
                        className="pointer-events-none z-100"
                      />
                    )}
                    {el.renderIcon(
                      el,
                      el.ui?.isDragging || false,
                      el.ui?.isHovered || false,
                    )}
                    <text
                      textAnchor="middle"
                      y="-5"
                      x={el.ui?.width ? el.ui.width / 2 : 25}
                      className="fill-transparent transition-colors group-hover/element:fill-[#888888] text-[8px] pointer-events-none select-none font-mono"
                    >
                      {el.name}
                    </text>
                    {/* Debug: zeroPoint dot */}
                    <rect
                      x={zeroPointX - 1.5}
                      y={zeroPointY - 1.5}
                      width="3"
                      height="3"
                      fill="red"
                      className="pointer-events-none opacity-50"
                    />
                    {el.pins.map((pin: Pin) => {
                      const dist = 14;
                      const fixing = 0.5;
                      let textAnchor: "start" | "middle" | "end" = "middle";
                      let dominantBaseline:
                        | "auto"
                        | "middle"
                        | "hanging"
                        | "baseline" = "middle";
                      let textX = 0;
                      let textY = 0;

                      switch (pin.orientation) {
                        case "top":
                          textX = -fixing;
                          textY = -(dist - (fixing * 8));
                          if (pin.rotation == 90 || pin.rotation == 180) {
                            textAnchor = "end";
                            dominantBaseline = "middle";
                          } else {
                            textAnchor = "middle";
                            dominantBaseline = "hanging";
                          }
                          break;
                        case "bottom":
                          textX = -fixing;
                          textY = dist;
                          if (pin.rotation == 90 || pin.rotation == 180) {
                            textAnchor = "start";
                            dominantBaseline = "middle";
                          } else {
                            textAnchor = "middle";
                            dominantBaseline = "hanging";
                          }
                          break;
                        case "left":
                          textX = -dist;
                          textY = fixing;
                          textAnchor = "end";
                          dominantBaseline = "middle";
                          break;
                        case "right":
                          textX = dist;
                          textY = fixing;
                          textAnchor = "start";
                          dominantBaseline = "middle";
                          break;
                      }
                      return (
                        <g
                          key={pin.id}
                          transform={`translate(${pin.relX}, ${pin.relY})`}
                          className="group"
                          data-pin="true"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handlePinMouseDown(e);
                          }}
                          onMouseUp={(e) => {
                            e.stopPropagation();
                            handlePinMouseUp(e, el.id, pin.id);
                          }}
                        >
                          <circle
                            r="3"
                            style={
                              {
                                "--pin-hover": pin.color,
                              } as React.CSSProperties
                            }
                            className="fill-[#1f1f1f] stroke-[#555555] group-hover:stroke-[var(--pin-hover)] stroke-[1.8] pointer-events-none transition-colors duration-150"
                          />
                          <circle
                            r="6"
                            fill="transparent"
                            className="cursor-pointer"
                          />
                          <text
                            x={textX}
                            y={textY}
                            textAnchor={textAnchor}
                            /* @ts-ignore */
                            dominantBaseline={dominantBaseline}
                            style={
                              {
                                "--pin-hover": pin.color,
                              } as React.CSSProperties
                            }
                            transform={`rotate(${pin.rotation || 0}, ${textX}, ${textY})`}
                            className="fill-[#aaaaaa] transition-colors group-hover:fill-[var(--pin-hover)] text-[6px] pointer-events-none select-none font-mono"
                          >
                            {pin.name}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </g>
          </svg>
          <div className="absolute text-start bottom-3 right-3 bg-[#181818]/80 border border-[#2b2b2b] text-[10px] px-2 py-1 rounded text-[#888888] font-mono pointer-events-none flex flex-col items-start gap-0.5">
            <div>Pins: 2.54 mm</div>
            <div>Zoom: {Math.round(zoom * 100)}%</div>
          </div>
          {contextMenu && (
            <div
              style={{ top: contextMenu.y, left: contextMenu.x }}
              className="fixed z-50 bg-[#252526] border border-[#2b2b2b] shadow-2xl rounded py-1 w-44 text-xs text-[#cccccc]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={
                  selectedItems.length > 1 ||
                  contextMenu.elementId.startsWith("NODE-")
                    ? deleteSelectedElements
                    : () => deleteElement(contextMenu.elementId)
                }
                className="w-full text-left px-3 py-2 hover:bg-[#ff4444] hover:text-white transition-colors font-medium flex items-center gap-2"
              >
                <span className="text-[10px]">✕</span>
                {selectedItems.length > 1
                  ? `Delete Selected (${selectedItems.length})`
                  : contextMenu.elementId.startsWith("NODE-")
                    ? "Delete Node"
                    : "Delete Element"}
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
      <footer className="h-[22.5px] border-t border-[#2b2b2b] bg-[#181818] text-[11px] flex items-center text-white">
        <span className="w-12 border-r border-[#2b2b2b] px-1">Ready</span>
      </footer>
    </main>
  );
}
