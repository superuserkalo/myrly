"use client";

import {
  CopyPlus,
  FolderOpen,
  Hand,
  ImagePlus,
  ImageDown,
  Library,
  Link2,
  Lock,
  Menu,
  Minus,
  Monitor,
  Moon,
  MousePointer2,
  Plus,
  Redo2,
  RotateCcw,
  Save,
  Search,
  Share2,
  Sun,
  Trash2,
  Type,
  Undo2,
  Users,
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

const IconX = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" />
  </svg>
);

const IconTikTok = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

const IconYouTube = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M23.498 6.186a3.013 3.013 0 0 0-2.121-2.13C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.556A3.013 3.013 0 0 0 .502 6.186 31.036 31.036 0 0 0 0 12a31.036 31.036 0 0 0 .502 5.814 3.013 3.013 0 0 0 2.121 2.13C4.495 20.5 12 20.5 12 20.5s7.505 0 9.377-.556a3.013 3.013 0 0 0 2.121-2.13A31.036 31.036 0 0 0 24 12a31.036 31.036 0 0 0-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

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
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [items, setItems] = useState<CanvasItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
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
    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem("mooody-board-theme")
        : null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem("mooody-board-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) {
        return;
      }
      if (menuButtonRef.current?.contains(target)) {
        return;
      }
      setIsMenuOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKey);
    };
  }, [isMenuOpen]);

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
      const nextSelected = itemsRef.current
        .filter((item) => rectsIntersect(nextRect, getItemBounds(item)))
        .map((item) => item.id);
      setSelectedIds(nextSelected);
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
    const isAlreadySelected = selectedIds.includes(itemId);
    const nextSelection = isAlreadySelected ? selectedIds : [itemId];
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      targetIds: nextSelection,
    });
    setSelectedIds(nextSelection);
    setEditingId(null);
  };

  const handleItemPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
    item: CanvasItem,
  ) => {
    event.stopPropagation();
    if (activeTool !== "select" || editingId === item.id) {
      return;
    }
    const toggleKey = event.shiftKey || event.metaKey || event.ctrlKey;
    if (toggleKey) {
      toggleSelection(item.id);
      setEditingId(null);
      return;
    }
    const isAlreadySelected = selectedIds.includes(item.id);
    const selectionForDrag = isAlreadySelected ? selectedIds : [item.id];
    if (!isAlreadySelected) {
      setSelectedIds(selectionForDrag);
    }
    const draggableIds = selectionForDrag.filter(
      (id) => !getItemById(id)?.locked,
    );
    if (draggableIds.length === 0) {
      return;
    }
    const origins = draggableIds.reduce(
      (acc, id) => {
        const target = getItemById(id);
        if (target) {
          acc[id] = { x: target.x, y: target.y };
        }
        return acc;
      },
      {} as Record<string, { x: number; y: number }>,
    );
    dragRef.current = {
      ids: draggableIds,
      startX: event.clientX,
      startY: event.clientY,
      origins,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleItemPointerMove = (
    event: ReactPointerEvent<HTMLDivElement>,
    itemId: string,
  ) => {
    const dragState = dragRef.current;
    if (!dragState || !dragState.ids.includes(itemId)) {
      return;
    }
    const deltaX = (event.clientX - dragState.startX) / zoom;
    const deltaY = (event.clientY - dragState.startY) / zoom;
    setItems((prev) => {
      const nextItems = prev.map((item) =>
        dragState.ids.includes(item.id)
          ? {
              ...item,
              x: (dragState.origins[item.id]?.x ?? item.x) + deltaX,
              y: (dragState.origins[item.id]?.y ?? item.y) + deltaY,
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
    if (!dragRef.current || !dragRef.current.ids.includes(itemId)) {
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
    selectOnly(itemId);
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
    selectOnly(itemId);
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
    selectOnly(itemId);
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
      selectOnly(newItem.id);
      pendingImagePoint.current = null;
    };
    img.src = url;
    event.target.value = "";
  };

  const zoomOut = () => setZoom((prev) => clamp(prev - 0.1, 0.3, 2.5));
  const zoomIn = () => setZoom((prev) => clamp(prev + 0.1, 0.3, 2.5));

  const handleResetCanvas = () => {
    historyRef.current = [[]];
    historyIndexRef.current = 0;
    setHistoryIndex(0);
    itemsRef.current = [];
    setItems([]);
    clearSelection();
    setEditingId(null);
    showToast("Canvas reset");
  };

  const handleOpenFile = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      pendingImagePoint.current = {
        x: (rect.width / 2 - pan.x) / zoom,
        y: (rect.height / 2 - pan.y) / zoom,
      };
    }
    fileInputRef.current?.click();
  };

  const handleFindOnCanvas = () => {
    const query = window.prompt("Find on canvas");
    if (!query) {
      return;
    }
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return;
    }
    const match = itemsRef.current.find(
      (item) =>
        item.type === "text" &&
        item.text.toLowerCase().includes(normalized),
    );
    if (!match) {
      showToast("No matches found");
      return;
    }
    selectOnly(match.id);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    const bounds = getItemBounds(match);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    setPan({
      x: rect.width / 2 - centerX * zoom,
      y: rect.height / 2 - centerY * zoom,
    });
  };

  const handleComingSoon = (message: string) => {
    showToast(message);
  };
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
  const contextItems = contextMenu
    ? items.filter((item) => contextMenu.targetIds.includes(item.id))
    : [];
  const contextItem = contextItems[0] ?? null;
  const selectedItems = items.filter((item) => selectedIds.includes(item.id));
  const groupBounds =
    selectedItems.length > 1
      ? (() => {
          const [first, ...rest] = selectedItems;
          let combined = getItemBounds(first);
          rest.forEach((item) => {
            const bounds = getItemBounds(item);
            combined = {
              minX: Math.min(combined.minX, bounds.minX),
              minY: Math.min(combined.minY, bounds.minY),
              maxX: Math.max(combined.maxX, bounds.maxX),
              maxY: Math.max(combined.maxY, bounds.maxY),
            };
          });
          return combined;
        })()
      : null;

  const colorScheme =
    theme === "dark" ? "dark" : theme === "light" ? "light" : "light dark";

  return (
    <div
      className="board-theme relative min-h-[100svh] bg-[color:var(--board-bg)] text-[color:var(--text-primary)]"
      data-theme={theme}
      style={{ colorScheme }}
    >
      <header className="fixed left-0 right-0 top-0 z-30">
        <div className="flex w-full items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <button
            type="button"
            aria-label="Open settings"
            ref={menuButtonRef}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={`flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm transition hover:bg-[color:var(--surface-hover)] ${
              isMenuOpen ? "ring-2 ring-indigo-400/60" : ""
            }`}
            aria-expanded={isMenuOpen}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="pointer-events-none absolute left-[47%] top-3 -translate-x-1/2 sm:left-1/2 sm:top-4">
            <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2 py-1.5 shadow-md sm:gap-2 sm:px-3 sm:py-2">
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
                        : "text-[color:var(--text-primary)] hover:bg-[color:var(--surface-hover)]"
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

      {isMenuOpen && (
        <div
          ref={menuRef}
          className="fixed left-4 top-[72px] z-40 w-72 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3 text-sm text-[color:var(--text-primary)] shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:left-6 sm:top-[84px]"
        >
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => {
                handleOpenFile();
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-[color:var(--surface-hover)]"
            >
              <FolderOpen className="h-4 w-4 text-indigo-500" />
              <span>Open file</span>
              <span className="ml-auto text-[11px] text-[color:var(--text-faint)]">
                ⌘O
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleComingSoon("Save to coming soon");
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-[color:var(--surface-hover)]"
            >
              <Save className="h-4 w-4 text-indigo-500" />
              <span>Save to...</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleComingSoon("Export image coming soon");
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-[color:var(--surface-hover)]"
            >
              <ImageDown className="h-4 w-4 text-indigo-500" />
              <span>Export image</span>
              <span className="ml-auto text-[11px] text-[color:var(--text-faint)]">
                ⌘⇧E
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleComingSoon("Live collaboration coming soon");
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-[color:var(--surface-hover)]"
            >
              <Users className="h-4 w-4 text-indigo-500" />
              <span>Live collaboration</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleFindOnCanvas();
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-[color:var(--surface-hover)]"
            >
              <Search className="h-4 w-4 text-indigo-500" />
              <span>Find on canvas</span>
              <span className="ml-auto text-[11px] text-[color:var(--text-faint)]">
                ⌘F
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleResetCanvas();
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-3 rounded-2xl px-3 py-2 text-red-500 transition hover:bg-red-50"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset the canvas</span>
            </button>
          </div>

          <div className="my-4 h-px bg-[color:var(--border)]" />

          <div>
            <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--text-faint)]">
              Theme
            </p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-1">
              {[
                { id: "light" as const, label: "Light", icon: Sun },
                { id: "dark" as const, label: "Dark", icon: Moon },
                { id: "system" as const, label: "System", icon: Monitor },
              ].map((option) => {
                const Icon = option.icon;
                const isActive = theme === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-label={option.label}
                    aria-pressed={isActive}
                    onClick={() => setTheme(option.id)}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                      isActive
                        ? "bg-indigo-500 text-white shadow-[0_8px_20px_rgba(79,70,229,0.35)]"
                        : "text-[color:var(--text-primary)] hover:bg-[color:var(--surface-hover)]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="my-4 h-px bg-[color:var(--border)]" />

          <div>
            <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--text-faint)]">
              Follow us
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 px-1 text-xs text-[color:var(--text-muted)]">
              {[
                {
                  label: "Twitter / X",
                  icon: IconX,
                  href: "https://x.com/themooodyapp",
                },
                {
                  label: "YouTube",
                  icon: IconYouTube,
                  href: "https://www.youtube.com/channel/UCobkDMYmixMCRJMGMb7KtVw",
                },
                {
                  label: "TikTok",
                  icon: IconTikTok,
                  href: "https://www.tiktok.com/@themooodyapp?lang=en",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl px-2 py-2 transition hover:bg-[color:var(--surface-hover)]"
                  >
                    <Icon className="h-4 w-4 text-[color:var(--icon-muted)]" />
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <main className="relative flex min-h-[100svh] w-full flex-col pt-24 sm:pt-20">
        <div
          ref={canvasRef}
          className="relative flex-1 overflow-hidden bg-[color:var(--canvas-bg)] touch-none overscroll-none"
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
              {selectionRect && (
                <div
                  className="pointer-events-none absolute rounded-md border border-indigo-400/70 bg-indigo-400/10"
                  style={{
                    left: selectionRect.x,
                    top: selectionRect.y,
                    width: selectionRect.width,
                    height: selectionRect.height,
                  }}
                />
              )}
              {items.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const isEditing = editingId === item.id;
                const showOutline = isSelected && !isEditing;
                const showHandles = showOutline && selectedIds.length === 1;
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
                      className={`absolute select-none whitespace-nowrap rounded-md px-2 py-1 text-base font-semibold text-[color:var(--text-primary)] ${
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
                        <span className="absolute -right-2 -top-2 rounded-full bg-[color:var(--surface)] p-1 shadow-md">
                          <Lock className="h-3 w-3 text-[color:var(--text-secondary)]" />
                        </span>
                      )}
                      {showOutline && (
                        <div className="absolute inset-0">
                          <div className="pointer-events-none absolute inset-0 rounded-md border border-indigo-400/80" />
                          {showHandles && (
                            <>
                              <span className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2">
                                <button
                                  type="button"
                                  aria-label="Resize top left"
                                  onPointerDown={(event) =>
                                    handleResizeStart(event, item.id, "nw")
                                  }
                                  className="h-3 w-3 rounded-sm border border-indigo-400 bg-[color:var(--surface)]"
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
                                  className="h-3 w-3 rounded-sm border border-indigo-400 bg-[color:var(--surface)]"
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
                                  className="h-3 w-3 rounded-sm border border-indigo-400 bg-[color:var(--surface)]"
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
                                  className="h-3 w-3 rounded-sm border border-indigo-400 bg-[color:var(--surface)]"
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
                                  className="h-3 w-3 rounded-full border border-indigo-400 bg-[color:var(--surface)]"
                                  style={{
                                    transform: `scale(${handleScaleX}, ${handleScaleY})`,
                                  }}
                                />
                              </span>
                            </>
                          )}
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
                    className={`absolute select-none rounded-xl bg-[color:var(--surface)] ${
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
                      <span className="absolute -right-2 -top-2 rounded-full bg-[color:var(--surface)] p-1 shadow-md">
                        <Lock className="h-3 w-3 text-[color:var(--text-secondary)]" />
                      </span>
                    )}
                    {showOutline && (
                      <div className="absolute inset-0">
                        <div className="pointer-events-none absolute inset-0 rounded-xl border border-indigo-400/80" />
                        {showHandles && (
                          <>
                            <span className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2">
                              <button
                                type="button"
                                aria-label="Resize top left"
                                onPointerDown={(event) =>
                                  handleResizeStart(event, item.id, "nw")
                                }
                            className="h-3 w-3 rounded-sm border border-indigo-400 bg-[color:var(--surface)]"
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
                            className="h-3 w-3 rounded-sm border border-indigo-400 bg-[color:var(--surface)]"
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
                            className="h-3 w-3 rounded-sm border border-indigo-400 bg-[color:var(--surface)]"
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
                            className="h-3 w-3 rounded-sm border border-indigo-400 bg-[color:var(--surface)]"
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
                            className="h-3 w-3 rounded-full border border-indigo-400 bg-[color:var(--surface)]"
                                style={{
                                  transform: `scale(${handleScaleX}, ${handleScaleY})`,
                                }}
                              />
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {groupBounds && (
                <div
                  className="pointer-events-none absolute rounded-md border border-dashed border-indigo-400/80"
                  style={{
                    left: groupBounds.minX,
                    top: groupBounds.minY,
                    width: groupBounds.maxX - groupBounds.minX,
                    height: groupBounds.maxY - groupBounds.minY,
                  }}
                >
                  <span className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-sm border border-indigo-400 bg-[color:var(--surface)]" />
                  <span className="absolute right-0 top-0 translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-sm border border-indigo-400 bg-[color:var(--surface)]" />
                  <span className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 h-3 w-3 rounded-sm border border-indigo-400 bg-[color:var(--surface)]" />
                  <span className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 h-3 w-3 rounded-sm border border-indigo-400 bg-[color:var(--surface)]" />
                  <div className="absolute left-1/2 top-0 h-6 w-px -translate-x-1/2 -translate-y-full bg-indigo-400/70" />
                  <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[170%] h-3 w-3 rounded-full border border-indigo-400 bg-[color:var(--surface)]" />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-24 left-4 z-30 flex flex-col-reverse gap-4 sm:bottom-6 sm:left-6 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex w-fit items-center gap-2 self-start rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2 py-1 text-[11px] font-semibold text-[color:var(--text-primary)] shadow-md sm:self-auto sm:px-3 sm:py-2 sm:text-xs">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={zoomOut}
            className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-[color:var(--surface-hover)]"
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
            className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-[color:var(--surface-hover)]"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex w-fit items-center gap-8 self-start rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-1.5 py-1 text-[11px] font-semibold text-[color:var(--text-primary)] shadow-md sm:self-auto sm:gap-2 sm:px-3 sm:py-2 sm:text-xs">
          <button
            type="button"
            aria-label="Undo"
            onClick={handleUndo}
            disabled={!canUndo}
            className="flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-[color:var(--surface-hover)] disabled:opacity-40 sm:h-7 sm:w-7"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Redo"
            onClick={handleRedo}
            disabled={!canRedo}
            className="flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-[color:var(--surface-hover)] disabled:opacity-40 sm:h-7 sm:w-7"
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
          className="fixed z-[60] w-64 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-2 text-xs text-[color:var(--text-primary)] shadow-[0_20px_60px_rgba(15,23,42,0.2)]"
          style={{
            left: menuPosition.x,
            top: menuPosition.y,
          }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div className="flex flex-col">
            {(() => {
              const hasContextSelection = contextMenu.targetIds.length > 0;
              const hasSingleContext = contextMenu.targetIds.length === 1;
              const unlockedItems = contextItems.filter((item) => !item.locked);
              const hasUnlocked = unlockedItems.length > 0;
              const allLocked =
                contextItems.length > 0 &&
                contextItems.every((item) => item.locked);
              return (
                <>
            <button
              type="button"
              onClick={() => {
                handleCut(contextItems);
                setContextMenu(null);
              }}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-[color:var(--surface-hover)] disabled:opacity-40"
              disabled={!hasUnlocked}
            >
              <span>Cut</span>
              <span className="text-[10px] text-[color:var(--text-faint)]">
                ⌘X
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleCopy(contextItems);
                setContextMenu(null);
              }}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-[color:var(--surface-hover)] disabled:opacity-40"
              disabled={!hasContextSelection}
            >
              <span>Copy</span>
              <span className="text-[10px] text-[color:var(--text-faint)]">
                ⌘C
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                handlePaste();
                setContextMenu(null);
              }}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-[color:var(--surface-hover)] disabled:opacity-40"
              disabled={!clipboardRef.current?.length}
            >
              <span>Paste</span>
              <span className="text-[10px] text-[color:var(--text-faint)]">
                ⌘V
              </span>
            </button>
            <div className="my-2 h-px bg-[color:var(--border)]" />
            <button
              type="button"
              onClick={() => {
                handleAddToLibrary(contextItems);
                setContextMenu(null);
              }}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-[color:var(--surface-hover)] disabled:opacity-40"
              disabled={!hasContextSelection}
            >
              <span>Add to library</span>
              <Library className="h-3.5 w-3.5 text-[color:var(--text-faint)]" />
            </button>
            <div className="my-2 h-px bg-[color:var(--border)]" />
            <button
              type="button"
              onClick={() => {
                handleFlip(contextItems, "x");
                setContextMenu(null);
              }}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-[color:var(--surface-hover)] disabled:opacity-40"
              disabled={!hasUnlocked}
            >
              <span>Flip horizontal</span>
              <span className="text-[10px] text-[color:var(--text-faint)]">
                ⇧H
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleFlip(contextItems, "y");
                setContextMenu(null);
              }}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-[color:var(--surface-hover)] disabled:opacity-40"
              disabled={!hasUnlocked}
            >
              <span>Flip vertical</span>
              <span className="text-[10px] text-[color:var(--text-faint)]">
                ⇧V
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleAddLink(contextItem);
                setContextMenu(null);
              }}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-[color:var(--surface-hover)] disabled:opacity-40"
              disabled={!hasSingleContext || contextItem?.locked}
            >
              <span>Add link</span>
              <Link2 className="h-3.5 w-3.5 text-[color:var(--text-faint)]" />
            </button>
            <div className="my-2 h-px bg-[color:var(--border)]" />
            <button
              type="button"
              onClick={() => {
                handleDuplicate(contextItems);
                setContextMenu(null);
              }}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-[color:var(--surface-hover)] disabled:opacity-40"
              disabled={!hasContextSelection}
            >
              <span>Duplicate</span>
              <CopyPlus className="h-3.5 w-3.5 text-[color:var(--text-faint)]" />
            </button>
            <button
              type="button"
              onClick={() => {
                handleToggleLock(contextItems);
                setContextMenu(null);
              }}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-[color:var(--surface-hover)] disabled:opacity-40"
              disabled={!hasContextSelection}
            >
              <span>{allLocked ? "Unlock" : "Lock"}</span>
              <Lock className="h-3.5 w-3.5 text-[color:var(--text-faint)]" />
            </button>
            <div className="my-2 h-px bg-[color:var(--border)]" />
            <button
              type="button"
              onClick={() => {
                removeItems(
                  contextItems
                    .filter((item) => !item.locked)
                    .map((item) => item.id),
                );
                setContextMenu(null);
              }}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-left text-red-500 transition hover:bg-red-50 disabled:opacity-40"
              disabled={!hasUnlocked}
            >
              <span>Delete</span>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed left-1/2 top-20 z-[60] -translate-x-1/2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-xs font-semibold text-[color:var(--text-primary)] shadow-md">
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
