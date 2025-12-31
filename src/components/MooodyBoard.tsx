"use client";

import {
  CopyPlus,
  Hand,
  ImagePlus,
  Library,
  Link2,
  Lock,
  Menu,
  Minus,
  MousePointer2,
  Plus,
  Redo2,
  Share2,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";
import type { MouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState } from "react";
import PromptInput from "@/components/PromptInput";

type Tool = "select" | "hand" | "text" | "image";

type CanvasItem =
  | {
      id: string;
      type: "text";
      x: number;
      y: number;
      width: number;
      height: number;
      scaleX?: number;
      scaleY?: number;
      rotation?: number;
      flipX?: boolean;
      flipY?: boolean;
      link?: string;
      locked?: boolean;
      text: string;
    }
  | {
      id: string;
      type: "image";
      x: number;
      y: number;
      width: number;
      height: number;
      scaleX?: number;
      scaleY?: number;
      rotation?: number;
      flipX?: boolean;
      flipY?: boolean;
      link?: string;
      locked?: boolean;
      src: string;
    };

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const toRadians = (deg: number) => (deg * Math.PI) / 180;

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.round(Math.random() * 100000)}`;
};

const normalizeRect = (
  start: { x: number; y: number },
  end: { x: number; y: number },
) => {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  return { x, y, width, height };
};

const rectsIntersect = (
  a: { x: number; y: number; width: number; height: number },
  b: { minX: number; maxX: number; minY: number; maxY: number },
) =>
  a.x <= b.maxX &&
  a.x + a.width >= b.minX &&
  a.y <= b.maxY &&
  a.y + a.height >= b.minY;

export default function MooodyBoard() {
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [items, setItems] = useState<CanvasItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    targetIds: string[];
  } | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectionRect, setSelectionRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [historyIndex, setHistoryIndex] = useState(0);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const editingRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingImagePoint = useRef<{ x: number; y: number } | null>(null);
  const contextPointRef = useRef<{ x: number; y: number } | null>(null);
  const clipboardRef = useRef<CanvasItem[] | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const libraryRef = useRef<CanvasItem[]>([]);
  const resizeRef = useRef<{
    id: string;
    handle: "nw" | "ne" | "se" | "sw";
    startX: number;
    startY: number;
    startScaleX: number;
    startScaleY: number;
    startWidth: number;
    startHeight: number;
    startXPos: number;
    startYPos: number;
    rotation: number;
  } | null>(null);
  const rotateRef = useRef<{
    id: string;
    centerX: number;
    centerY: number;
    startAngle: number;
    startRotation: number;
  } | null>(null);
  const itemsRef = useRef<CanvasItem[]>([]);
  const historyRef = useRef<CanvasItem[][]>([[]]);
  const historyIndexRef = useRef(0);
  const dragRef = useRef<{
    ids: string[];
    startX: number;
    startY: number;
    origins: Record<string, { x: number; y: number }>;
  } | null>(null);
  const selectionRef = useRef<{
    startX: number;
    startY: number;
    pointerId: number;
  } | null>(null);
  const panRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const viewRef = useRef({ zoom: 1, pan: { x: 0, y: 0 } });
  const touchPointsRef = useRef<Map<number, { x: number; y: number }>>(
    new Map(),
  );
  const pinchRef = useRef<{
    distance: number;
    center: { x: number; y: number };
    zoom: number;
    pan: { x: number; y: number };
  } | null>(null);
  const hasCentered = useRef(false);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    viewRef.current = { zoom, pan };
  }, [zoom, pan]);

  useEffect(() => {
    if (!canvasRef.current || hasCentered.current) {
      return;
    }
    const rect = canvasRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return;
    }
    setZoom(1);
    setPan({
      x: rect.width / 2,
      y: rect.height / 2,
    });
    hasCentered.current = true;
  }, []);

  useEffect(() => {
    if (!editingId) {
      return;
    }
    const timeout = window.setTimeout(() => {
      editingRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [editingId]);

  const measureTextSize = (text: string) => {
    const measureEl = measureRef.current;
    if (!measureEl) {
      return { width: 140, height: 36 };
    }
    measureEl.textContent = text.trim() ? text : "Text";
    const rect = measureEl.getBoundingClientRect();
    return {
      width: Math.max(120, rect.width + 16),
      height: Math.max(32, rect.height + 12),
    };
  };

  useEffect(() => {
    if (!contextMenu) {
      return;
    }
    const handleClose = () => setContextMenu(null);
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setContextMenu(null);
      }
    };
    window.addEventListener("pointerdown", handleClose);
    window.addEventListener("scroll", handleClose, { passive: true });
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("pointerdown", handleClose);
      window.removeEventListener("scroll", handleClose);
      window.removeEventListener("keydown", handleKey);
    };
  }, [contextMenu]);

  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }
      const tag = target.tagName;
      return (
        target.isContentEditable ||
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT"
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target) || editingId) {
        return;
      }
      const modKey = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      if (modKey && key === "c") {
        event.preventDefault();
        handleCopy(getSelectedItems());
        return;
      }
      if (modKey && key === "x") {
        event.preventDefault();
        handleCut(getSelectedItems());
        return;
      }
      if (modKey && key === "v") {
        event.preventDefault();
        handlePaste();
        return;
      }
      if (modKey && key === "d") {
        event.preventDefault();
        handleDuplicate(getSelectedItems());
        return;
      }
      if (
        (event.key === "Backspace" || event.key === "Delete") &&
        selectedIds.length > 0
      ) {
        event.preventDefault();
        removeItems(getSelectedItems().filter((item) => !item.locked).map((item) => item.id));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editingId, selectedIds]);

  useEffect(() => {
    if (!contextMenu) {
      return;
    }
    const menuWidth = 280;
    const menuHeight = 420;
    const maxX = window.innerWidth - menuWidth;
    const maxY = window.innerHeight - menuHeight;
    setMenuPosition({
      x: Math.max(12, Math.min(contextMenu.x, maxX)),
      y: Math.max(12, Math.min(contextMenu.y, maxY)),
    });
  }, [contextMenu]);

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 2000);
  };

  const commitHistory = (nextItems: CanvasItem[]) => {
    const trimmed = historyRef.current.slice(0, historyIndexRef.current + 1);
    const updated = [...trimmed, nextItems];
    historyRef.current = updated;
    historyIndexRef.current = updated.length - 1;
    setHistoryIndex(historyIndexRef.current);
    itemsRef.current = nextItems;
    setItems(nextItems);
  };

  const handleUndo = () => {
    if (historyIndexRef.current === 0) {
      return;
    }
    historyIndexRef.current -= 1;
    setHistoryIndex(historyIndexRef.current);
    const nextItems = historyRef.current[historyIndexRef.current] ?? [];
    itemsRef.current = nextItems;
    setItems(nextItems);
    clearSelection();
    setEditingId(null);
  };

  const handleRedo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) {
      return;
    }
    historyIndexRef.current += 1;
    setHistoryIndex(historyIndexRef.current);
    const nextItems = historyRef.current[historyIndexRef.current] ?? [];
    itemsRef.current = nextItems;
    setItems(nextItems);
    clearSelection();
    setEditingId(null);
  };

  const getItemById = (id: string | null) =>
    itemsRef.current.find((item) => item.id === id) ?? null;

  const getSelectedItems = (ids = selectedIds) =>
    itemsRef.current.filter((item) => ids.includes(item.id));

  const getItemBounds = (item: CanvasItem) => {
    const scaleX = Math.abs(item.scaleX ?? 1);
    const scaleY = Math.abs(item.scaleY ?? 1);
    const width = item.width * scaleX;
    const height = item.height * scaleY;
    const centerX = item.x + width / 2;
    const centerY = item.y + height / 2;
    const rotation = toRadians(item.rotation ?? 0);
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const corners = [
      { x: -width / 2, y: -height / 2 },
      { x: width / 2, y: -height / 2 },
      { x: width / 2, y: height / 2 },
      { x: -width / 2, y: height / 2 },
    ].map((point) => ({
      x: centerX + point.x * cos - point.y * sin,
      y: centerY + point.x * sin + point.y * cos,
    }));
    const xs = corners.map((point) => point.x);
    const ys = corners.map((point) => point.y);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    };
  };

  const clearSelection = () => setSelectedIds([]);

  const selectOnly = (id: string | null) => {
    if (!id) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds([id]);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  };

  const updateItem = (id: string, update: Partial<CanvasItem>) => {
    const nextItems = itemsRef.current.map((item) =>
      item.id === id ? { ...item, ...update } : item,
    );
    commitHistory(nextItems);
  };

  const updateItemLive = (id: string, update: Partial<CanvasItem>) => {
    setItems((prev) => {
      const nextItems = prev.map((item) =>
        item.id === id ? { ...item, ...update } : item,
      );
      itemsRef.current = nextItems;
      return nextItems;
    });
  };

  const removeItems = (ids: string[]) => {
    if (ids.length === 0) {
      return;
    }
    const nextItems = itemsRef.current.filter(
      (item) => !ids.includes(item.id),
    );
    commitHistory(nextItems);
    setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    setEditingId(null);
  };

  const removeItem = (id: string) => {
    removeItems([id]);
  };

  const cloneItem = (item: CanvasItem) => ({
    ...item,
    id: createId(),
  });

  const handleCopy = (itemsToCopy: CanvasItem[]) => {
    if (itemsToCopy.length === 0) {
      return;
    }
    clipboardRef.current = itemsToCopy.map((item) => ({ ...item }));
    showToast("Copied");
  };

  const handleCut = (itemsToCut: CanvasItem[]) => {
    const unlocked = itemsToCut.filter((item) => !item.locked);
    if (unlocked.length === 0) {
      return;
    }
    clipboardRef.current = unlocked.map((item) => ({ ...item }));
    removeItems(unlocked.map((item) => item.id));
    showToast("Cut");
  };

  const handlePaste = () => {
    if (!clipboardRef.current || clipboardRef.current.length === 0) {
      return;
    }
    const itemsToPaste = clipboardRef.current;
    const bounds = itemsToPaste.reduce(
      (acc, item) => ({
        minX: Math.min(acc.minX, item.x),
        minY: Math.min(acc.minY, item.y),
      }),
      { minX: itemsToPaste[0].x, minY: itemsToPaste[0].y },
    );
    const rect = canvasRef.current?.getBoundingClientRect();
    const fallbackPoint = rect
      ? {
          x: (rect.width / 2 - pan.x) / zoom,
          y: (rect.height / 2 - pan.y) / zoom,
        }
      : { x: 0, y: 0 };
    const point = contextPointRef.current ?? fallbackPoint;
    const offsetX = point.x - bounds.minX + 24;
    const offsetY = point.y - bounds.minY + 24;
    const nextItems = [
      ...itemsRef.current,
      ...itemsToPaste.map((item) => ({
        ...cloneItem(item),
        x: item.x + offsetX,
        y: item.y + offsetY,
        locked: false,
      })),
    ];
    commitHistory(nextItems);
    const pastedIds = nextItems.slice(-itemsToPaste.length).map((item) => item.id);
    setSelectedIds(pastedIds);
    showToast("Pasted");
  };

  const handleDuplicate = (itemsToDuplicate: CanvasItem[]) => {
    if (itemsToDuplicate.length === 0) {
      return;
    }
    const nextItems = [
      ...itemsRef.current,
      ...itemsToDuplicate.map((item) => ({
        ...cloneItem(item),
        x: item.x + 24,
        y: item.y + 24,
        locked: false,
      })),
    ];
    commitHistory(nextItems);
    const duplicatedIds = nextItems
      .slice(-itemsToDuplicate.length)
      .map((item) => item.id);
    setSelectedIds(duplicatedIds);
  };

  const handleToggleLock = (itemsToToggle: CanvasItem[]) => {
    if (itemsToToggle.length === 0) {
      return;
    }
    const shouldLock = itemsToToggle.some((item) => !item.locked);
    const nextItems = itemsRef.current.map((item) =>
      itemsToToggle.some((target) => target.id === item.id)
        ? { ...item, locked: shouldLock }
        : item,
    );
    commitHistory(nextItems);
  };

  const handleFlip = (itemsToFlip: CanvasItem[], axis: "x" | "y") => {
    if (itemsToFlip.length === 0) {
      return;
    }
    const nextItems = itemsRef.current.map((item) => {
      const target = itemsToFlip.find((candidate) => candidate.id === item.id);
      if (!target || target.locked) {
        return item;
      }
      return axis === "x"
        ? { ...item, flipX: !item.flipX }
        : { ...item, flipY: !item.flipY };
    });
    commitHistory(nextItems);
  };

  const handleAddLink = (item: CanvasItem | null) => {
    if (!item || item.locked) {
      return;
    }
    const nextLink = window.prompt(
      "Add link (leave empty to remove)",
      item.link ?? "",
    );
    if (nextLink === null) {
      return;
    }
    updateItem(item.id, { link: nextLink.trim() || undefined });
  };

  const handleAddToLibrary = (itemsToAdd: CanvasItem[]) => {
    if (itemsToAdd.length === 0) {
      return;
    }
    libraryRef.current = [
      ...libraryRef.current,
      ...itemsToAdd.map((item) => ({ ...item, id: createId() })),
    ];
    showToast(`Added to library (${libraryRef.current.length})`);
  };

  const getCanvasPoint = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      return { x: 0, y: 0 };
    }
    const x = (event.clientX - rect.left - pan.x) / zoom;
    const y = (event.clientY - rect.top - pan.y) / zoom;
    return { x, y };
  };

  const handleCanvasPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (event.button !== 0) {
      return;
    }
    const isTouch = event.pointerType === "touch";
    if (isTouch) {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      touchPointsRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      if (touchPointsRef.current.size === 2) {
        const [first, second] = Array.from(
          touchPointsRef.current.values(),
        );
        const center = {
          x: (first.x + second.x) / 2,
          y: (first.y + second.y) / 2,
        };
        panRef.current = null;
        pinchRef.current = {
          distance: Math.hypot(first.x - second.x, first.y - second.y),
          center,
          zoom,
          pan,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
        return;
      }
    }

    const startPan = () => {
      panRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        originX: pan.x,
        originY: pan.y,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    };
    if (activeTool === "hand") {
      startPan();
      return;
    }
    if (isTouch && activeTool === "select") {
      startPan();
      return;
    }
    if (!isTouch && activeTool === "select") {
      const point = getCanvasPoint(event);
      selectionRef.current = {
        startX: point.x,
        startY: point.y,
        pointerId: event.pointerId,
      };
      setSelectionRect({ x: point.x, y: point.y, width: 0, height: 0 });
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    if (activeTool === "text") {
      const point = getCanvasPoint(event);
      const measured = measureTextSize("");
      const newItem: CanvasItem = {
        id: createId(),
        type: "text",
        x: point.x,
        y: point.y,
        width: measured.width,
        height: measured.height,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        text: "",
      };
      commitHistory([...itemsRef.current, newItem]);
      selectOnly(newItem.id);
      setEditingId(newItem.id);
      setActiveTool("select");
      return;
    }

    if (activeTool === "image") {
      pendingImagePoint.current = getCanvasPoint(event);
      fileInputRef.current?.click();
      return;
    }

    clearSelection();
    setEditingId(null);
  };

  const handleCanvasContextMenu = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    contextPointRef.current = {
      x: (event.clientX - rect.left - pan.x) / zoom,
      y: (event.clientY - rect.top - pan.y) / zoom,
    };
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      targetIds: [],
    });
    clearSelection();
    setEditingId(null);
  };

  const handleCanvasPointerMove = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (selectionRef.current && event.pointerType !== "touch") {
      const point = getCanvasPoint(event);
      const nextRect = normalizeRect(
        { x: selectionRef.current.startX, y: selectionRef.current.startY },
        point,
      );
      setSelectionRect(nextRect);
      return;
    }
    if (event.pointerType === "touch") {
      if (touchPointsRef.current.has(event.pointerId)) {
        touchPointsRef.current.set(event.pointerId, {
          x: event.clientX,
          y: event.clientY,
        });
      }
      if (pinchRef.current && touchPointsRef.current.size >= 2) {
        event.preventDefault();
        const [first, second] = Array.from(
          touchPointsRef.current.values(),
        );
        const nextCenter = {
          x: (first.x + second.x) / 2,
          y: (first.y + second.y) / 2,
        };
        const nextDistance = Math.hypot(first.x - second.x, first.y - second.y);
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) {
          return;
        }
        const state = pinchRef.current;
        const scale = nextDistance / state.distance;
        const nextZoom = clamp(state.zoom * scale, 0.25, 3);
        const worldX =
          (state.center.x - rect.left - state.pan.x) / state.zoom;
        const worldY =
          (state.center.y - rect.top - state.pan.y) / state.zoom;
        const nextPan = {
          x: nextCenter.x - rect.left - worldX * nextZoom,
          y: nextCenter.y - rect.top - worldY * nextZoom,
        };
        setZoom(nextZoom);
        setPan(nextPan);
        pinchRef.current = {
          distance: nextDistance,
          center: nextCenter,
          zoom: nextZoom,
          pan: nextPan,
        };
        return;
      }
    }
    if (!panRef.current) {
      return;
    }
    const deltaX = event.clientX - panRef.current.startX;
    const deltaY = event.clientY - panRef.current.startY;
    setPan({
      x: panRef.current.originX + deltaX,
      y: panRef.current.originY + deltaY,
    });
  };

  const handleCanvasPointerUp = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (event.pointerType === "touch") {
      touchPointsRef.current.delete(event.pointerId);
      if (touchPointsRef.current.size < 2) {
        pinchRef.current = null;
      }
    }
    if (selectionRef.current && event.pointerType !== "touch") {
      const point = getCanvasPoint(event);
      const rect = normalizeRect(
        { x: selectionRef.current.startX, y: selectionRef.current.startY },
        point,
      );
      selectionRef.current = null;
      setSelectionRect(null);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      if (rect.width < 4 && rect.height < 4) {
        clearSelection();
        return;
      }
      const nextSelected = itemsRef.current
        .filter((item) => rectsIntersect(rect, getItemBounds(item)))
        .map((item) => item.id);
      setSelectedIds(nextSelected);
      return;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (!panRef.current) {
      return;
    }
    panRef.current = null;
  };

  const handleItemContextMenu = (
    event: MouseEvent<HTMLDivElement>,
    itemId: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      contextPointRef.current = {
        x: (event.clientX - rect.left - pan.x) / zoom,
        y: (event.clientY - rect.top - pan.y) / zoom,
      };
    }
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      targetId: itemId,
    });
    setSelectedId(itemId);
    setEditingId(null);
  };

  const handleItemPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
    item: CanvasItem,
  ) => {
    event.stopPropagation();
    setSelectedId(item.id);
    if (activeTool !== "select" || editingId === item.id) {
      return;
    }
    if (item.locked) {
      return;
    }
    dragRef.current = {
      id: item.id,
      startX: event.clientX,
      startY: event.clientY,
      originX: item.x,
      originY: item.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleItemPointerMove = (
    event: ReactPointerEvent<HTMLDivElement>,
    itemId: string,
  ) => {
    const dragState = dragRef.current;
    if (!dragState || dragState.id !== itemId) {
      return;
    }
    const deltaX = (event.clientX - dragState.startX) / zoom;
    const deltaY = (event.clientY - dragState.startY) / zoom;
    setItems((prev) => {
      const nextItems = prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              x: dragState.originX + deltaX,
              y: dragState.originY + deltaY,
            }
          : item,
      );
      itemsRef.current = nextItems;
      return nextItems;
    });
  };

  const handleItemPointerUp = (
    event: ReactPointerEvent<HTMLDivElement>,
    itemId: string,
  ) => {
    if (!dragRef.current || dragRef.current.id !== itemId) {
      return;
    }
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
    commitHistory([...itemsRef.current]);
  };

  const handleResizeStart = (
    event: ReactPointerEvent<HTMLButtonElement>,
    itemId: string,
    handle: "nw" | "ne" | "se" | "sw",
  ) => {
    event.stopPropagation();
    event.preventDefault();
    const item = getItemById(itemId);
    if (!item || item.locked) {
      return;
    }
    resizeRef.current = {
      id: itemId,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      startScaleX: item.scaleX ?? 1,
      startScaleY: item.scaleY ?? 1,
      startWidth: item.width,
      startHeight: item.height,
      startXPos: item.x,
      startYPos: item.y,
      rotation: item.rotation ?? 0,
    };
    setSelectedId(itemId);
    setEditingId(null);
  };

  const handleRotateStart = (
    event: ReactPointerEvent<HTMLButtonElement>,
    itemId: string,
  ) => {
    event.stopPropagation();
    event.preventDefault();
    const item = getItemById(itemId);
    if (!item || item.locked) {
      return;
    }
    const scaleX = Math.abs(item.scaleX ?? 1);
    const scaleY = Math.abs(item.scaleY ?? 1);
    const centerX = item.x + (item.width * scaleX) / 2;
    const centerY = item.y + (item.height * scaleY) / 2;
    const angle = Math.atan2(event.clientY - centerY, event.clientX - centerX);
    rotateRef.current = {
      id: itemId,
      centerX,
      centerY,
      startAngle: angle,
      startRotation: item.rotation ?? 0,
    };
    setSelectedId(itemId);
    setEditingId(null);
  };

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (resizeRef.current) {
        event.preventDefault();
        const state = resizeRef.current;
        const item = getItemById(state.id);
        if (!item) {
          return;
        }
        const dx = event.clientX - state.startX;
        const dy = event.clientY - state.startY;
        const rad = toRadians(state.rotation);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const localX = dx * cos + dy * sin;
        const localY = -dx * sin + dy * cos;
        const signX = state.handle.includes("e") ? 1 : -1;
        const signY = state.handle.includes("s") ? 1 : -1;
        const nextScaleX = clamp(
          (state.startWidth * state.startScaleX + signX * localX) /
            state.startWidth,
          0.2,
          6,
        );
        const nextScaleY = clamp(
          (state.startHeight * state.startScaleY + signY * localY) /
            state.startHeight,
          0.2,
          6,
        );
        let scaleX = nextScaleX;
        let scaleY = nextScaleY;
        if (event.shiftKey) {
          const uniform = Math.max(scaleX, scaleY);
          scaleX = uniform;
          scaleY = uniform;
        }
        const deltaWidth =
          state.startWidth * (scaleX - state.startScaleX);
        const deltaHeight =
          state.startHeight * (scaleY - state.startScaleY);
        const offsetLocalX = state.handle.includes("w") ? -deltaWidth : 0;
        const offsetLocalY = state.handle.includes("n") ? -deltaHeight : 0;
        const offsetX =
          offsetLocalX * Math.cos(rad) - offsetLocalY * Math.sin(rad);
        const offsetY =
          offsetLocalX * Math.sin(rad) + offsetLocalY * Math.cos(rad);
        updateItemLive(state.id, {
          scaleX,
          scaleY,
          x: state.startXPos + offsetX,
          y: state.startYPos + offsetY,
        });
        return;
      }
      if (rotateRef.current) {
        event.preventDefault();
        const state = rotateRef.current;
        const angle = Math.atan2(
          event.clientY - state.centerY,
          event.clientX - state.centerX,
        );
        const delta = angle - state.startAngle;
        let nextRotation = state.startRotation + (delta * 180) / Math.PI;
        if (event.shiftKey) {
          nextRotation = Math.round(nextRotation / 15) * 15;
        }
        updateItemLive(state.id, { rotation: nextRotation });
      }
    };

    const handlePointerUp = () => {
      if (resizeRef.current || rotateRef.current) {
        resizeRef.current = null;
        rotateRef.current = null;
        commitHistory([...itemsRef.current]);
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  const handleTextDoubleClick = (itemId: string) => {
    const item = getItemById(itemId);
    if (item?.locked) {
      return;
    }
    setEditingId(itemId);
    setSelectedId(itemId);
    setActiveTool("text");
  };

  const handleTextBlur = (itemId: string, value: string) => {
    const nextText = value.trim();
    if (!nextText) {
      removeItem(itemId);
      return;
    }
    const measured = measureTextSize(nextText);
    const nextItems = itemsRef.current.map((item) =>
      item.id === itemId && item.type === "text"
        ? {
            ...item,
            text: nextText,
            width: measured.width,
            height: measured.height,
          }
        : item,
    );
    setEditingId(null);
    commitHistory(nextItems);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const point = pendingImagePoint.current;
    if (!file || !point) {
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const maxWidth = 360;
      const scale = Math.min(1, maxWidth / img.width);
      const width = img.width * scale;
      const height = img.height * scale;
      const newItem: CanvasItem = {
        id: createId(),
        type: "image",
        x: point.x,
        y: point.y,
        src: url,
        width,
        height,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
      };
      commitHistory([...itemsRef.current, newItem]);
      setSelectedId(newItem.id);
      pendingImagePoint.current = null;
    };
    img.src = url;
    event.target.value = "";
  };

  const zoomOut = () => setZoom((prev) => clamp(prev - 0.1, 0.3, 2.5));
  const zoomIn = () => setZoom((prev) => clamp(prev + 0.1, 0.3, 2.5));
  const applyWheel = ({
    deltaX,
    deltaY,
    clientX,
    clientY,
    isZoom,
  }: {
    deltaX: number;
    deltaY: number;
    clientX: number;
    clientY: number;
    isZoom: boolean;
  }) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    if (isZoom) {
      const pointerX = clientX - rect.left;
      const pointerY = clientY - rect.top;
      const { zoom: currentZoom, pan: currentPan } = viewRef.current;
      const delta = -deltaY * 0.01;
      const nextZoom = clamp(currentZoom + delta, 0.25, 3);
      const worldX = (pointerX - currentPan.x) / currentZoom;
      const worldY = (pointerY - currentPan.y) / currentZoom;
      const nextPan = {
        x: pointerX - worldX * nextZoom,
        y: pointerY - worldY * nextZoom,
      };
      setZoom(nextZoom);
      setPan(nextPan);
      return;
    }
    setPan((prev) => ({
      x: prev.x - deltaX,
      y: prev.y - deltaY,
    }));
  };

  useEffect(() => {
    const node = canvasRef.current;
    if (!node) {
      return;
    }
    const handleWheel = (event: WheelEvent) => {
      if (!node.contains(event.target as Node)) {
        return;
      }
      event.preventDefault();
      applyWheel({
        deltaX: event.deltaX,
        deltaY: event.deltaY,
        clientX: event.clientX,
        clientY: event.clientY,
        isZoom: event.ctrlKey || event.metaKey,
      });
    };
    node.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      node.removeEventListener("wheel", handleWheel);
    };
  }, []);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyRef.current.length - 1;

  const toolbarButtons = [
    { id: "select", icon: MousePointer2, label: "Select" },
    { id: "hand", icon: Hand, label: "Hand" },
    { id: "text", icon: Type, label: "Text" },
    { id: "image", icon: ImagePlus, label: "Image" },
  ] as const;
  const contextItem = contextMenu
    ? items.find((item) => item.id === contextMenu.targetId) ?? null
    : null;

  return (
    <div
      className="relative min-h-[100svh] bg-[#f4f5fa] text-[#111827]"
      style={{ colorScheme: "light" }}
    >
      <header className="fixed left-0 right-0 top-0 z-30">
        <div className="flex w-full items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <button
            type="button"
            aria-label="Open settings"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white shadow-sm transition hover:bg-white/80"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="pointer-events-none absolute left-[47%] top-3 -translate-x-1/2 sm:left-1/2 sm:top-4">
            <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-black/10 bg-white px-2 py-1.5 shadow-md sm:gap-2 sm:px-3 sm:py-2">
              {toolbarButtons.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    aria-label={tool.label}
                    aria-pressed={isActive}
                    onClick={() => setActiveTool(tool.id)}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                      isActive
                        ? "bg-indigo-500 text-white shadow-[0_8px_20px_rgba(79,70,229,0.35)]"
                        : "text-[#1f2937] hover:bg-black/5"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            className="flex items-center gap-2 rounded-full bg-indigo-500 px-3 py-2 text-[11px] font-semibold text-white shadow-[0_10px_24px_rgba(79,70,229,0.35)] transition hover:bg-indigo-400 sm:px-4 sm:text-xs"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>
      </header>

      <main className="relative flex min-h-[100svh] w-full flex-col pt-24 sm:pt-20">
        <div
          ref={canvasRef}
          className="relative flex-1 overflow-hidden bg-white touch-none overscroll-none"
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onPointerCancel={handleCanvasPointerUp}
          onContextMenu={handleCanvasContextMenu}
          style={{
            touchAction: "none",
            cursor:
              activeTool === "hand"
                ? panRef.current
                  ? "grabbing"
                  : "grab"
                : activeTool === "text"
                  ? "crosshair"
                  : activeTool === "image"
                    ? "crosshair"
                    : "default",
          }}
        >
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
          >
            <div className="relative min-h-[1px] min-w-[1px]">
              {items.map((item) => {
                const isSelected = selectedId === item.id;
                const isEditing = editingId === item.id;
                const scaleX = item.scaleX ?? 1;
                const scaleY = item.scaleY ?? 1;
                const rotation = item.rotation ?? 0;
                const flippedScaleX = scaleX * (item.flipX ? -1 : 1);
                const flippedScaleY = scaleY * (item.flipY ? -1 : 1);
                const handleScaleX = 1 / Math.max(0.2, Math.abs(scaleX));
                const handleScaleY = 1 / Math.max(0.2, Math.abs(scaleY));
                const baseStyle = {
                  left: item.x,
                  top: item.y,
                  width: item.width,
                  height: item.height,
                  transform: `rotate(${rotation}deg) scale(${flippedScaleX}, ${flippedScaleY})`,
                  transformOrigin: "center",
                };
                const baseEvents = {
                  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) =>
                    handleItemPointerDown(event, item),
                  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) =>
                    handleItemPointerMove(event, item.id),
                  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) =>
                    handleItemPointerUp(event, item.id),
                };

                if (item.type === "text") {
                  return (
                    <div
                      key={item.id}
                      {...baseEvents}
                      onContextMenu={(event) =>
                        handleItemContextMenu(event, item.id)
                      }
                      onDoubleClick={() => handleTextDoubleClick(item.id)}
                      className={`absolute select-none whitespace-nowrap rounded-md px-2 py-1 text-base font-semibold text-[#111827] ${
                        item.locked ? "cursor-not-allowed" : "cursor-text"
                      }`}
                      style={baseStyle}
                    >
                      <div
                        ref={isEditing ? editingRef : null}
                        contentEditable={isEditing}
                        suppressContentEditableWarning
                        onBlur={(event) =>
                          handleTextBlur(
                            item.id,
                            event.currentTarget.textContent ?? "",
                          )
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            event.currentTarget.blur();
                          }
                        }}
                        className={`outline-none ${isEditing ? "cursor-text" : ""}`}
                      >
                        {item.text}
                      </div>
                      {item.locked && (
                        <span className="absolute -right-2 -top-2 rounded-full bg-white p-1 shadow-md">
                          <Lock className="h-3 w-3 text-[#4b5563]" />
                        </span>
                      )}
                      {isSelected && !isEditing && (
                        <div className="absolute inset-0">
                          <div className="pointer-events-none absolute inset-0 rounded-md border border-indigo-400/80" />
                          <span className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2">
                            <button
                              type="button"
                              aria-label="Resize top left"
                              onPointerDown={(event) =>
                                handleResizeStart(event, item.id, "nw")
                              }
                              className="h-3 w-3 rounded-sm border border-indigo-400 bg-white"
                              style={{
                                transform: `scale(${handleScaleX}, ${handleScaleY})`,
                              }}
                            />
                          </span>
                          <span className="absolute right-0 top-0 translate-x-1/2 -translate-y-1/2">
                            <button
                              type="button"
                              aria-label="Resize top right"
                              onPointerDown={(event) =>
                                handleResizeStart(event, item.id, "ne")
                              }
                              className="h-3 w-3 rounded-sm border border-indigo-400 bg-white"
                              style={{
                                transform: `scale(${handleScaleX}, ${handleScaleY})`,
                              }}
                            />
                          </span>
                          <span className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2">
                            <button
                              type="button"
                              aria-label="Resize bottom left"
                              onPointerDown={(event) =>
                                handleResizeStart(event, item.id, "sw")
                              }
                              className="h-3 w-3 rounded-sm border border-indigo-400 bg-white"
                              style={{
                                transform: `scale(${handleScaleX}, ${handleScaleY})`,
                              }}
                            />
                          </span>
                          <span className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2">
                            <button
                              type="button"
                              aria-label="Resize bottom right"
                              onPointerDown={(event) =>
                                handleResizeStart(event, item.id, "se")
                              }
                              className="h-3 w-3 rounded-sm border border-indigo-400 bg-white"
                              style={{
                                transform: `scale(${handleScaleX}, ${handleScaleY})`,
                              }}
                            />
                          </span>
                          <div className="pointer-events-none absolute left-1/2 top-0 h-6 w-px -translate-x-1/2 -translate-y-full bg-indigo-400/70" />
                          <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[170%]">
                            <button
                              type="button"
                              aria-label="Rotate"
                              onPointerDown={(event) =>
                                handleRotateStart(event, item.id)
                              }
                              className="h-3 w-3 rounded-full border border-indigo-400 bg-white"
                              style={{
                                transform: `scale(${handleScaleX}, ${handleScaleY})`,
                              }}
                            />
                          </span>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    {...baseEvents}
                    onContextMenu={(event) =>
                      handleItemContextMenu(event, item.id)
                    }
                    className={`absolute select-none rounded-xl bg-white ${
                      item.locked ? "cursor-not-allowed" : "cursor-grab"
                    }`}
                    style={baseStyle}
                  >
                    <img
                      src={item.src}
                      alt="Uploaded"
                      className="h-full w-full rounded-xl object-cover"
                      draggable={false}
                    />
                    {item.locked && (
                      <span className="absolute -right-2 -top-2 rounded-full bg-white p-1 shadow-md">
                        <Lock className="h-3 w-3 text-[#4b5563]" />
                      </span>
                    )}
                    {isSelected && (
                      <div className="absolute inset-0">
                        <div className="pointer-events-none absolute inset-0 rounded-xl border border-indigo-400/80" />
                        <span className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2">
                          <button
                            type="button"
                            aria-label="Resize top left"
                            onPointerDown={(event) =>
                              handleResizeStart(event, item.id, "nw")
                            }
                            className="h-3 w-3 rounded-sm border border-indigo-400 bg-white"
                            style={{
                              transform: `scale(${handleScaleX}, ${handleScaleY})`,
                            }}
                          />
                        </span>
                        <span className="absolute right-0 top-0 translate-x-1/2 -translate-y-1/2">
                          <button
                            type="button"
                            aria-label="Resize top right"
                            onPointerDown={(event) =>
                              handleResizeStart(event, item.id, "ne")
                            }
                            className="h-3 w-3 rounded-sm border border-indigo-400 bg-white"
                            style={{
                              transform: `scale(${handleScaleX}, ${handleScaleY})`,
                            }}
                          />
                        </span>
                        <span className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2">
                          <button
                            type="button"
                            aria-label="Resize bottom left"
                            onPointerDown={(event) =>
                              handleResizeStart(event, item.id, "sw")
                            }
                            className="h-3 w-3 rounded-sm border border-indigo-400 bg-white"
                            style={{
                              transform: `scale(${handleScaleX}, ${handleScaleY})`,
                            }}
                          />
                        </span>
                        <span className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2">
                          <button
                            type="button"
                            aria-label="Resize bottom right"
                            onPointerDown={(event) =>
                              handleResizeStart(event, item.id, "se")
                            }
                            className="h-3 w-3 rounded-sm border border-indigo-400 bg-white"
                            style={{
                              transform: `scale(${handleScaleX}, ${handleScaleY})`,
                            }}
                          />
                        </span>
                        <div className="pointer-events-none absolute left-1/2 top-0 h-6 w-px -translate-x-1/2 -translate-y-full bg-indigo-400/70" />
                        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[170%]">
                          <button
                            type="button"
                            aria-label="Rotate"
                            onPointerDown={(event) =>
                              handleRotateStart(event, item.id)
                            }
                            className="h-3 w-3 rounded-full border border-indigo-400 bg-white"
                            style={{
                              transform: `scale(${handleScaleX}, ${handleScaleY})`,
                            }}
                          />
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-24 left-4 z-30 flex flex-col-reverse gap-4 sm:bottom-6 sm:left-6 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex w-fit items-center gap-2 self-start rounded-full border border-black/10 bg-white px-2 py-1 text-[11px] font-semibold text-[#111827] shadow-md sm:self-auto sm:px-3 sm:py-2 sm:text-xs">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={zoomOut}
            className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-black/5"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-[52px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={zoomIn}
            className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-black/5"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex w-fit items-center gap-8 self-start rounded-full border border-black/10 bg-white px-1.5 py-1 text-[11px] font-semibold text-[#111827] shadow-md sm:self-auto sm:gap-2 sm:px-3 sm:py-2 sm:text-xs">
          <button
            type="button"
            aria-label="Undo"
            onClick={handleUndo}
            disabled={!canUndo}
            className="flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-black/5 disabled:opacity-40 sm:h-7 sm:w-7"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Redo"
            onClick={handleRedo}
            disabled={!canRedo}
            className="flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-black/5 disabled:opacity-40 sm:h-7 sm:w-7"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="fixed bottom-6 left-1/2 z-30 w-[min(680px,92vw)] -translate-x-1/2">
        <PromptInput />
      </div>

      {contextMenu && (
        <div
          className="fixed z-[60] w-64 rounded-2xl border border-black/10 bg-white p-2 text-xs text-[#111827] shadow-[0_20px_60px_rgba(15,23,42,0.2)]"
          style={{
            left: menuPosition.x,
            top: menuPosition.y,
          }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => {
                handleCut(contextItem);
                setContextMenu(null);
              }}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-black/5 disabled:opacity-40"
              disabled={!contextMenu.targetId || contextItem?.locked}
            >
              <span>Cut</span>
              <span className="text-[10px] text-black/40">⌘X</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleCopy(contextItem);
                setContextMenu(null);
              }}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-black/5 disabled:opacity-40"
              disabled={!contextMenu.targetId}
            >
              <span>Copy</span>
              <span className="text-[10px] text-black/40">⌘C</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handlePaste();
                setContextMenu(null);
              }}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-black/5 disabled:opacity-40"
              disabled={!clipboardRef.current?.length}
            >
              <span>Paste</span>
              <span className="text-[10px] text-black/40">⌘V</span>
            </button>
            <div className="my-2 h-px bg-black/10" />
            <button
              type="button"
              onClick={() => {
                handleAddToLibrary(contextItem);
                setContextMenu(null);
              }}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-black/5 disabled:opacity-40"
              disabled={!contextMenu.targetId}
            >
              <span>Add to library</span>
              <Library className="h-3.5 w-3.5 text-black/40" />
            </button>
            <div className="my-2 h-px bg-black/10" />
            <button
              type="button"
              onClick={() => {
                handleFlip(contextItem, "x");
                setContextMenu(null);
              }}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-black/5 disabled:opacity-40"
              disabled={
                !contextMenu.targetId ||
                contextItem?.locked
              }
            >
              <span>Flip horizontal</span>
              <span className="text-[10px] text-black/40">⇧H</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleFlip(contextItem, "y");
                setContextMenu(null);
              }}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-black/5 disabled:opacity-40"
              disabled={
                !contextMenu.targetId ||
                contextItem?.locked
              }
            >
              <span>Flip vertical</span>
              <span className="text-[10px] text-black/40">⇧V</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleAddLink(contextItem);
                setContextMenu(null);
              }}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-black/5 disabled:opacity-40"
              disabled={
                !contextMenu.targetId ||
                contextItem?.locked
              }
            >
              <span>Add link</span>
              <Link2 className="h-3.5 w-3.5 text-black/40" />
            </button>
            <div className="my-2 h-px bg-black/10" />
            <button
              type="button"
              onClick={() => {
                handleDuplicate(contextItem);
                setContextMenu(null);
              }}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-black/5 disabled:opacity-40"
              disabled={!contextMenu.targetId}
            >
              <span>Duplicate</span>
              <CopyPlus className="h-3.5 w-3.5 text-black/40" />
            </button>
            <button
              type="button"
              onClick={() => {
                handleToggleLock(contextItem);
                setContextMenu(null);
              }}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-black/5 disabled:opacity-40"
              disabled={!contextMenu.targetId}
            >
              <span>{contextItem?.locked ? "Unlock" : "Lock"}</span>
              <Lock className="h-3.5 w-3.5 text-black/40" />
            </button>
            <div className="my-2 h-px bg-black/10" />
            <button
              type="button"
              onClick={() => {
                const item = contextItem;
                if (item) {
                  removeItem(item.id);
                }
                setContextMenu(null);
              }}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-left text-red-500 transition hover:bg-red-50 disabled:opacity-40"
              disabled={!contextMenu.targetId || contextItem?.locked}
            >
              <span>Delete</span>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed left-1/2 top-20 z-[60] -translate-x-1/2 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-[#111827] shadow-md">
          {toastMessage}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageChange}
      />

      <span
        ref={measureRef}
        className="pointer-events-none absolute -left-[9999px] -top-[9999px] whitespace-pre text-base font-semibold"
      >
        Measure
      </span>
    </div>
  );
}
