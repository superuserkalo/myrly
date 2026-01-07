"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AppState,
  BinaryFileData,
  ExcalidrawImperativeAPI,
  ToolType,
} from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement, FileId } from "@excalidraw/excalidraw/element/types";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpToLine,
  ChevronDown,
  Circle,
  Code2,
  Copy,
  CopyPlus,
  Diamond,
  Eraser,
  FileCode,
  FlipHorizontal2,
  FlipVertical2,
  FolderOpen,
  Frame,
  Globe,
  Hand,
  ImageDown,
  ImagePlus,
  Lasso,
  Link2,
  Lock,
  Keyboard,
  Menu,
  Minus,
  Monitor,
  Moon,
  MousePointer2,
  PenLine,
  Plus,
  Pointer,
  Redo2,
  RotateCcw,
  Save,
  Scissors,
  Search,
  Share2,
  Sparkles,
  Square,
  Sun,
  Trash2,
  Type,
  Undo2,
  Users,
  Wand2,
} from "lucide-react";
import PromptInput from "@/components/PromptInput";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false },
);

type ThemeMode = "light" | "dark" | "system";

type ToolbarTool =
  | "selection"
  | "hand"
  | "rectangle"
  | "diamond"
  | "ellipse"
  | "arrow"
  | "line"
  | "freedraw"
  | "text"
  | "image"
  | "eraser";

type UiSnapshot = {
  activeTool: ToolType;
  currentItemStrokeColor: string;
  currentItemBackgroundColor: string;
  currentItemStrokeWidth: number;
  currentItemFontSize: number;
  zoom: number;
  isToolLocked: boolean;
};

type PromptAttachment = {
  id: string;
  url: string;
  mimeType: string;
  name?: string;
};

declare global {
  interface Window {
    __moodyLoadingFrames?: HTMLImageElement[];
    __moodyLoadingPalette?: {
      base: string;
      mid: string;
      soft: string;
      border: string;
    };
    __moodyLoadingFrameIntervalMs?: number;
    __moodyLoadingFrameIndex?: number;
    __moodyLoadingFrameLastAt?: number;
    __moodyLoadingFramesReady?: boolean;
  }
}

type MoodyLoadingData = {
  moodyLoading?: boolean;
  moodyFrameIndex?: number;
};

const loadingFrameSources = [
  "/loading_frame1.png",
  "/loading_frame2.png",
  "/loading_frame3.png",
] as const;

const loadingFrameIntervalMs = 170;

const getLoadingFrameInterval = (placeholderCount: number) => {
  if (placeholderCount > 25) {
    return 260;
  }
  if (placeholderCount > 10) {
    return 200;
  }
  return loadingFrameIntervalMs;
};

const drawRoundedRectPath = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const clamped = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + clamped, y);
  ctx.arcTo(x + width, y, x + width, y + height, clamped);
  ctx.arcTo(x + width, y + height, x, y + height, clamped);
  ctx.arcTo(x, y + height, x, y, clamped);
  ctx.arcTo(x, y, x + width, y, clamped);
  ctx.closePath();
};

const drawMoodyPlaceholder = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  palette: { base: string; mid: string; border: string },
  frame: HTMLImageElement | null,
) => {
  const radius = Math.min(16, Math.min(width, height) * 0.08);

  ctx.save();
  drawRoundedRectPath(ctx, x, y, width, height, radius);
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = palette.base;
  ctx.fill();
  ctx.globalAlpha = 0.85;
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, palette.base);
  gradient.addColorStop(0.5, palette.mid || palette.base);
  gradient.addColorStop(1, palette.base);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 1;
  ctx.stroke();

  if (frame && frame.complete) {
    const frameSize = Math.max(24, Math.min(width, height) * 0.18);
    const frameX = x + (width - frameSize) / 2;
    const frameY = y + (height - frameSize) / 2;
    ctx.drawImage(frame, frameX, frameY, frameSize, frameSize);
  }
  ctx.restore();
};

const isMoodyLoadingElement = (element: ExcalidrawElement | null) =>
  Boolean(
    element &&
    element.type === "image" &&
    (element as ExcalidrawElement & { customData?: MoodyLoadingData }).customData
      ?.moodyLoading === true,
  );

const toolbarButtons: { id: ToolbarTool; label: string; icon: typeof MousePointer2 }[] = [
  { id: "selection", label: "Select", icon: MousePointer2 },
  { id: "hand", label: "Hand", icon: Hand },
  { id: "rectangle", label: "Rectangle", icon: Square },
  { id: "diamond", label: "Diamond", icon: Diamond },
  { id: "ellipse", label: "Ellipse", icon: Circle },
  { id: "arrow", label: "Arrow", icon: ArrowRight },
  { id: "line", label: "Line", icon: Minus },
  { id: "freedraw", label: "Draw", icon: PenLine },
  { id: "text", label: "Text", icon: Type },
  { id: "image", label: "Image", icon: ImagePlus },
  { id: "eraser", label: "Eraser", icon: Eraser },
];

const strokePalette = [
  "#111827",
  "#ef4444",
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#111111",
];

const fillPalette = [
  "transparent",
  "#ffffff",
  "#f5f4f0",
  "#fee2e2",
  "#fef3c7",
  "#dcfce7",
  "#dbeafe",
  "#ede9fe",
];

const strokeWidths = [1, 2, 4];
const fontSizes = [16, 20, 28];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.round(Math.random() * 100000)}`;
};

const isTextElement = (
  element: ExcalidrawElement | null,
): element is ExcalidrawElement & { type: "text"; fontSize: number } =>
  element?.type === "text";

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

const getMimeFromDataUrl = (dataUrl: string) => {
  const match = dataUrl.match(/^data:([^;]+);/);
  return match?.[1] ?? "image/png";
};

const loadImageDimensions = (src: string) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });

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

export default function Board2Page() {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const elementsRef = useRef<readonly ExcalidrawElement[]>([]);
  const appStateRef = useRef<AppState | null>(null);
  const selectedIdsRef = useRef<string[]>([]);
  const selectedElementRef = useRef<ExcalidrawElement | null>(null);
  const historyRef = useRef<(readonly ExcalidrawElement[])[]>([]);
  const historyIndexRef = useRef(-1);
  const historyApplyingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const overlayWrapperRef = useRef<HTMLDivElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlaySizeRef = useRef({ width: 0, height: 0, dpr: 1 });
  const loadingFrameIndexRef = useRef(0);
  const loadingFrameLastAtRef = useRef<number | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  const [theme, setTheme] = useState<ThemeMode>("light");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedElement, setSelectedElement] = useState<ExcalidrawElement | null>(null);
  const [promptValue, setPromptValue] = useState("");
  const [isPromptFocused, setIsPromptFocused] = useState(false);
  const [isPromptCollapsed, setIsPromptCollapsed] = useState(false);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
  const [promptAttachments, setPromptAttachments] = useState<PromptAttachment[]>([]);
  const canvasAttachmentIdsRef = useRef<Set<string>>(new Set());
  const manuallyRemovedIdsRef = useRef<Set<string>>(new Set()); // Track images user manually removed
  const lastProcessedSelectionRef = useRef<string>(""); // Track last processed selection to prevent loops
  const [generationModel, setGenerationModel] = useState<
    "gemini" | "nano-banana" | "zimage" | "grok" | "qwen" | "seedream"
  >("gemini");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [hasPrompted, setHasPrompted] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    targetIds: string[];
    type: "canvas" | "element";
  } | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const contextMenuRef = useRef<HTMLDivElement | null>(null);
  const contextPointRef = useRef<{ x: number; y: number } | null>(null);
  const loadingPlaceholdersRef = useRef<Set<string>>(new Set());
  const [generatingPlaceholders, setGeneratingPlaceholders] = useState<string[]>([]);
  const pendingImageFilesRef = useRef<Array<{ dataUrl: string; mimeType: string }> | null>(null);
  const [isPlacingImages, setIsPlacingImages] = useState(false);
  const [isExtraToolsOpen, setIsExtraToolsOpen] = useState(false);
  const extraToolsRef = useRef<HTMLDivElement | null>(null);
  const extraToolsButtonRef = useRef<HTMLButtonElement | null>(null);
  // Batch generation state
  const [batchCount, setBatchCount] = useState(1);
  const [activeJobIds, setActiveJobIds] = useState<string[]>([]);
  const jobToPlaceholderMapRef = useRef<Record<string, string>>({});
  const MAX_CONCURRENT_JOBS = 5;
  const [uiSnapshot, setUiSnapshot] = useState<UiSnapshot>({
    activeTool: "selection",
    currentItemStrokeColor: "#111827",
    currentItemBackgroundColor: "transparent",
    currentItemStrokeWidth: 1,
    currentItemFontSize: 20,
    zoom: 1,
    isToolLocked: false,
  });
  const uiSnapshotRef = useRef(uiSnapshot);

  // Convex client for job status polling
  const convexRef = useRef<ConvexHttpClient | null>(null);
  if (!convexRef.current && typeof window !== "undefined") {
    convexRef.current = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  }

  const initialData = useMemo(
    () => ({
      elements: [],
      appState: {
        viewBackgroundColor: "#ffffff",
        currentItemStrokeColor: "#111827",
        currentItemBackgroundColor: "transparent",
        currentItemStrokeWidth: 1,
        currentItemFontSize: 20,
        theme: "light" as const,
      },
    }),
    [],
  );

  const uiOptions = useMemo(
    () => ({
      canvasActions: {
        changeViewBackgroundColor: false,
        clearCanvas: false,
        loadScene: false,
        export: false as const,
        saveToActiveFile: false,
        saveAsImage: false,
        toggleTheme: false,
      },
      tools: {
        image: true,
      },
      welcomeScreen: false,
    }),
    [],
  );

  const colorScheme =
    theme === "dark" ? "dark" : theme === "light" ? "light" : "light dark";

  const selectionLabel = selectedIds.length
    ? `${selectedIds.length} selected`
    : selectedElement
      ? `${selectedElement.type} selected`
      : "No selection";

  const activeTool = uiSnapshot.activeTool;
  const panelStrokeColor =
    selectedElement?.strokeColor ?? uiSnapshot.currentItemStrokeColor;
  const panelFillColor =
    selectedElement?.backgroundColor ?? uiSnapshot.currentItemBackgroundColor;
  const panelStrokeWidth =
    selectedElement?.strokeWidth ?? uiSnapshot.currentItemStrokeWidth;
  const panelFontSize = isTextElement(selectedElement)
    ? selectedElement.fontSize
    : uiSnapshot.currentItemFontSize;

  const showToast = useCallback((message: string) => {
    apiRef.current?.setToast({ message, duration: 2400 });
  }, []);

  const syncHistoryState = useCallback(() => {
    setHistoryState({
      canUndo: historyIndexRef.current > 0,
      canRedo: historyIndexRef.current < historyRef.current.length - 1,
    });
  }, []);

  const pushHistory = useCallback(
    (snapshot: readonly ExcalidrawElement[]) => {
      if (historyApplyingRef.current) {
        return;
      }
      const latest = historyRef.current[historyIndexRef.current];
      const sameAsLatest =
        latest &&
        latest.length === snapshot.length &&
        latest.every(
          (element, index) =>
            element.id === snapshot[index]?.id &&
            element.version === snapshot[index]?.version &&
            element.versionNonce === snapshot[index]?.versionNonce,
        );
      if (sameAsLatest) {
        return;
      }
      const trimmed = historyRef.current.slice(0, historyIndexRef.current + 1);
      historyRef.current = [...trimmed, snapshot] as (readonly ExcalidrawElement[])[];
      historyIndexRef.current = historyRef.current.length - 1;
      syncHistoryState();
    },
    [syncHistoryState],
  );

  const handleSceneChange = useCallback(
    (nextElements: readonly ExcalidrawElement[], nextAppState: AppState) => {
      elementsRef.current = nextElements;
      appStateRef.current = nextAppState;

      const selected = Object.keys(nextAppState.selectedElementIds ?? {}).filter(
        (id) => nextAppState.selectedElementIds[id],
      );
      const selectionChanged =
        selected.length !== selectedIdsRef.current.length ||
        selected.some((id, index) => id !== selectedIdsRef.current[index]);

      if (selectionChanged) {
        selectedIdsRef.current = selected;
        setSelectedIds(selected);
      }

      const primary = selected.length
        ? nextElements.find((element) => element.id === selected[0]) ?? null
        : null;
      const elementChanged =
        primary?.id !== selectedElementRef.current?.id ||
        primary?.version !== selectedElementRef.current?.version ||
        primary?.versionNonce !== selectedElementRef.current?.versionNonce;
      if (elementChanged || (!primary && selectedElementRef.current)) {
        selectedElementRef.current = primary;
        setSelectedElement(primary);
      }

      const nextSnapshot: UiSnapshot = {
        activeTool: (nextAppState.activeTool?.type as ToolType) ?? "selection",
        currentItemStrokeColor: nextAppState.currentItemStrokeColor,
        currentItemBackgroundColor: nextAppState.currentItemBackgroundColor,
        currentItemStrokeWidth: nextAppState.currentItemStrokeWidth,
        currentItemFontSize: nextAppState.currentItemFontSize,
        zoom: nextAppState.zoom?.value ?? 1,
        isToolLocked: nextAppState.activeTool?.locked ?? false,
      };

      const snapshotChanged = (Object.keys(nextSnapshot) as Array<keyof UiSnapshot>).some(
        (key) => nextSnapshot[key] !== uiSnapshotRef.current[key],
      );
      if (snapshotChanged) {
        uiSnapshotRef.current = nextSnapshot;
        setUiSnapshot(nextSnapshot);
      }
    },
    [],
  );

  const updateAppState = useCallback((nextAppState: Partial<AppState>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiRef.current?.updateScene({ appState: nextAppState as any });
  }, []);

  const updateSelectedElements = useCallback(
    (updates: Partial<ExcalidrawElement>) => {
      if (!apiRef.current || selectedIds.length === 0) {
        return;
      }
      const updated = elementsRef.current.map((element) =>
        selectedIds.includes(element.id) ? { ...element, ...updates } : element,
      ) as ExcalidrawElement[]; // Cast to avoid union mismatch
      apiRef.current.updateScene({ elements: updated });
      pushHistory(updated);
    },
    [selectedIds, pushHistory],
  );

  const getViewportCenter = useCallback(() => {
    const state = appStateRef.current;
    if (!state) {
      return { x: 0, y: 0 };
    }
    const zoom = state.zoom?.value ?? 1;
    return {
      x: state.width / 2 / zoom - state.scrollX,
      y: state.height / 2 / zoom - state.scrollY,
    };
  }, []);

  const addImagesToScene = useCallback(
    async (entries: Array<{ dataUrl: string; mimeType: string }>, point?: { x: number; y: number }) => {
      if (!apiRef.current || entries.length === 0) {
        return;
      }
      const center = point ?? getViewportCenter();
      const maxWidth = 360;
      const offsetStep = 28;
      const api = apiRef.current;
      const skeletons: Array<{
        type: "image";
        fileId: FileId;
        status: "saved";
        scale: [number, number];
        x: number;
        y: number;
        width: number;
        height: number;
        angle: number;
      }> = [];
      const fileRecords: BinaryFileData[] = [];

      await Promise.all(
        entries.map(async (entry, index) => {
          const fileId = createId();
          const { width, height } = await loadImageDimensions(entry.dataUrl);
          const scale = Math.min(1, maxWidth / width);
          const scaledWidth = Math.max(1, width * scale);
          const scaledHeight = Math.max(1, height * scale);
          const x = center.x + index * offsetStep - scaledWidth / 2;
          const y = center.y + index * offsetStep - scaledHeight / 2;

          fileRecords.push({
            id: fileId as BinaryFileData["id"],
            dataURL: entry.dataUrl as BinaryFileData["dataURL"],
            mimeType: entry.mimeType as BinaryFileData["mimeType"],
            created: Date.now(),
          });

          skeletons.push({
            type: "image",
            fileId: fileId as FileId,
            status: "saved",
            scale: [1, 1],
            x,
            y,
            width: scaledWidth,
            height: scaledHeight,
            angle: 0,
          });
        }),
      );

      api.addFiles(fileRecords);
      const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");
      const newElements = convertToExcalidrawElements(skeletons, {
        regenerateIds: true,
      });

      const updated = [...api.getSceneElements(), ...newElements];
      const selectedElementIds: Record<string, true> = {};
      newElements.forEach((element) => {
        selectedElementIds[element.id] = true;
      });

      api.updateScene({
        elements: updated,
        appState: {
          selectedElementIds,
          selectedGroupIds: {},
          editingGroupId: null,
        },
      });
      pushHistory(updated);
    },
    [getViewportCenter, pushHistory],
  );

  const handleStrokeColor = (color: string) => {
    updateAppState({ currentItemStrokeColor: color });
    if (selectedIds.length > 0) {
      updateSelectedElements({ strokeColor: color });
    }
  };

  const handleFillColor = (color: string) => {
    updateAppState({ currentItemBackgroundColor: color });
    if (selectedIds.length > 0) {
      updateSelectedElements({ backgroundColor: color });
    }
  };

  const handleStrokeWidth = (width: number) => {
    updateAppState({ currentItemStrokeWidth: width });
    if (selectedIds.length > 0) {
      updateSelectedElements({ strokeWidth: width });
    }
  };

  const handleFontSize = (size: number) => {
    updateAppState({ currentItemFontSize: size });
    if (selectedIds.length > 0) {
      const updated = elementsRef.current.map((element) =>
        selectedIds.includes(element.id) && element.type === "text"
          ? { ...element, fontSize: size }
          : element,
      ) as ExcalidrawElement[];
      apiRef.current?.updateScene({ elements: updated });
      pushHistory(updated);
    }
  };

  const handleDuplicate = useCallback(() => {
    if (!apiRef.current || selectedIds.length === 0) {
      return;
    }
    const elementsToDuplicate = elementsRef.current.filter((el) =>
      selectedIds.includes(el.id)
    );
    if (elementsToDuplicate.length === 0) {
      return;
    }
    const offsetX = 24;
    const offsetY = 24;
    const duplicated = elementsToDuplicate.map((el) => ({
      ...el,
      id: createId(),
      x: el.x + offsetX,
      y: el.y + offsetY,
    })) as ExcalidrawElement[];

    const updated = [...elementsRef.current, ...duplicated];
    const selectedElementIds: Record<string, true> = {};
    duplicated.forEach((el) => {
      selectedElementIds[el.id] = true;
    });

    apiRef.current.updateScene({
      elements: updated,
      appState: { selectedElementIds, selectedGroupIds: {}, editingGroupId: null },
    });
    pushHistory(updated);
    showToast("Duplicated");
  }, [selectedIds, pushHistory, showToast]);

  const handleCopy = useCallback(() => {
    if (selectedIds.length === 0) {
      return;
    }
    showToast("Copied");
  }, [selectedIds, showToast]);

  const handleFlip = useCallback(
    (axis: "horizontal" | "vertical") => {
      if (!apiRef.current || selectedIds.length === 0) {
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updated = elementsRef.current.map((el) => {
        if (!selectedIds.includes(el.id)) {
          return el;
        }
        const current = (el as any).scale ?? [1, 1];
        const newScale =
          axis === "horizontal"
            ? [current[0] * -1, current[1]]
            : [current[0], current[1] * -1];
        return { ...el, scale: newScale };
      }) as ExcalidrawElement[];

      apiRef.current.updateScene({ elements: updated });
      pushHistory(updated);
    },
    [selectedIds, pushHistory]
  );

  const moveElementBy = useCallback(
    (delta: 1 | -1) => {
      if (!apiRef.current || selectedIds.length !== 1) {
        return;
      }
      const id = selectedIds[0];
      const elements = [...elementsRef.current];
      const index = elements.findIndex((el) => el.id === id);
      if (index === -1) {
        return;
      }
      const newIndex = clamp(index + delta, 0, elements.length - 1);
      if (newIndex === index) {
        return;
      }
      const [removed] = elements.splice(index, 1);
      elements.splice(newIndex, 0, removed);
      apiRef.current.updateScene({ elements: elements as ExcalidrawElement[] });
      pushHistory(elements as ExcalidrawElement[]);
    },
    [selectedIds, pushHistory]
  );

  const moveElementTo = useCallback(
    (position: "front" | "back") => {
      if (!apiRef.current || selectedIds.length !== 1) {
        return;
      }
      const id = selectedIds[0];
      const elements = [...elementsRef.current];
      const index = elements.findIndex((el) => el.id === id);
      if (index === -1) {
        return;
      }
      const [removed] = elements.splice(index, 1);
      if (position === "front") {
        elements.push(removed);
      } else {
        elements.unshift(removed);
      }
      apiRef.current.updateScene({ elements: elements as ExcalidrawElement[] });
      pushHistory(elements as ExcalidrawElement[]);
    },
    [selectedIds, pushHistory]
  );

  const handleOpacity = useCallback(
    (value: number) => {
      if (!apiRef.current || selectedIds.length === 0) {
        return;
      }
      const opacity = value / 100;
      const updated = elementsRef.current.map((el) =>
        selectedIds.includes(el.id) ? { ...el, opacity } : el
      ) as ExcalidrawElement[];
      apiRef.current.updateScene({ elements: updated });
      pushHistory(updated);
    },
    [selectedIds, pushHistory]
  );

  const handleDelete = () => {
    if (!selectedIds.length) {
      return;
    }
    const updated = elementsRef.current.map((element) =>
      selectedIds.includes(element.id) ? { ...element, isDeleted: true } : element,
    ) as ExcalidrawElement[];
    apiRef.current?.updateScene({ elements: updated });
    pushHistory(updated);
  };

  // Toggle tool lock - keeps current tool active after drawing
  const handleToolLock = useCallback(() => {
    if (!apiRef.current) {
      return;
    }
    const appState = apiRef.current.getAppState();
    const currentLocked = appState.activeTool?.locked ?? false;
    const newLocked = !currentLocked;

    apiRef.current.updateScene({
      appState: {
        activeTool: {
          ...appState.activeTool,
          locked: newLocked,
        },
      } as any, // Cast needed for partial update
    });
    showToast(newLocked ? "Tool locked - stays active after drawing" : "Tool unlocked");
  }, [showToast]);

  const handleLaserPointer = useCallback(() => {
    apiRef.current?.setActiveTool({ type: "laser" as ToolType });
    setIsExtraToolsOpen(false);
  }, []);

  const handleFrameTool = useCallback(() => {
    apiRef.current?.setActiveTool({ type: "frame" as ToolType });
    setIsExtraToolsOpen(false);
  }, []);

  const handleLassoTool = useCallback(() => {
    // Lasso uses freedraw with a special modifier in Excalidraw
    // For now, use selection tool as placeholder
    apiRef.current?.setActiveTool({ type: "selection" });
    showToast("Lasso selection - holding shift while selecting");
    setIsExtraToolsOpen(false);
  }, [showToast]);

  const handleWebEmbed = useCallback(() => {
    apiRef.current?.setActiveTool({ type: "embeddable" as ToolType });
    setIsExtraToolsOpen(false);
  }, []);

  const handleZoom = (direction: "in" | "out") => {
    const currentZoom = uiSnapshot.zoom ?? 1;
    const nextZoom = clamp(
      direction === "in" ? currentZoom * 1.1 : currentZoom / 1.1,
      0.2,
      3,
    );
    updateAppState({ zoom: { value: nextZoom } as AppState["zoom"] });
  };

  const handleUndo = () => {
    if (historyIndexRef.current <= 0 || !apiRef.current) {
      return;
    }
    const nextIndex = historyIndexRef.current - 1;
    historyApplyingRef.current = true;
    apiRef.current.updateScene({ elements: historyRef.current[nextIndex] as ExcalidrawElement[] });
    historyIndexRef.current = nextIndex;
    syncHistoryState();
    requestAnimationFrame(() => {
      historyApplyingRef.current = false;
    });
  };

  const handleRedo = () => {
    if (
      historyIndexRef.current >= historyRef.current.length - 1 ||
      !apiRef.current
    ) {
      return;
    }
    const nextIndex = historyIndexRef.current + 1;
    historyApplyingRef.current = true;
    apiRef.current.updateScene({ elements: historyRef.current[nextIndex] as ExcalidrawElement[] });
    historyIndexRef.current = nextIndex;
    syncHistoryState();
    requestAnimationFrame(() => {
      historyApplyingRef.current = false;
    });
  };

  const handleOpenFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }
    const entries = await Promise.all(
      files.map(async (file) => ({
        dataUrl: await fileToDataUrl(file),
        mimeType: file.type || "image/png",
      })),
    );
    // Store files and enter placing mode
    pendingImageFilesRef.current = entries;
    setIsPlacingImages(true);
    showToast("Click on canvas to place image");
    event.target.value = "";
  };

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    const state = appStateRef.current;
    if (!state) {
      return { x: screenX, y: screenY };
    }
    const zoom = state.zoom?.value ?? 1;
    return {
      x: (screenX - state.offsetLeft) / zoom - state.scrollX,
      y: (screenY - state.offsetTop) / zoom - state.scrollY,
    };
  }, []);

  // Handle canvas click for image placement
  const handleCanvasClickForPlacement = useCallback(
    async (event: React.MouseEvent) => {
      if (!isPlacingImages || !pendingImageFilesRef.current) {
        return;
      }
      // Don't interfere with Excalidraw's own clicks when not in placing mode
      const entries = pendingImageFilesRef.current;
      const canvasPoint = screenToCanvas(event.clientX, event.clientY);

      await addImagesToScene(entries, canvasPoint);

      // Reset placing mode
      pendingImageFilesRef.current = null;
      setIsPlacingImages(false);
    },
    [isPlacingImages, screenToCanvas, addImagesToScene]
  );

  // Cancel placing mode with Escape
  useEffect(() => {
    if (!isPlacingImages) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        pendingImageFilesRef.current = null;
        setIsPlacingImages(false);
        showToast("Image placement cancelled");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlacingImages, showToast]);

  // Poll Convex for job completion and update placeholders
  useEffect(() => {
    const jobIds = Object.keys(jobToPlaceholderMapRef.current);
    if (jobIds.length === 0 || !convexRef.current) {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const jobs = await convexRef.current!.query(api.generation.getJobsByIds, {
          jobIds: jobIds as any,  // Cast to Id<"generationJobs">[]
        });

        for (const job of jobs) {
          if (!job) continue;

          const placeholderId = jobToPlaceholderMapRef.current[job._id];
          if (!placeholderId) continue;

          // Job completed successfully
          if (job.status === "success" && job.resultImageUrl) {
            const imageUrl = job.resultImageUrl;

            // Update placeholder with generated image
            const api = apiRef.current;
            if (api) {
              const currentElements = api.getSceneElements() as ExcalidrawElement[];
              const placeholderEl = currentElements.find((el) => el.id === placeholderId);
              if (placeholderEl) {
                // Load image and update element
                const img = new Image();
                img.onload = async () => {
                  const width = img.width;
                  const height = img.height;
                  const maxWidth = 360;
                  const scale = Math.min(1, maxWidth / width);
                  const scaledWidth = Math.max(1, width * scale);
                  const scaledHeight = Math.max(1, height * scale);
                  const centerX = placeholderEl.x + placeholderEl.width / 2;
                  const centerY = placeholderEl.y + placeholderEl.height / 2;
                  const x = centerX - scaledWidth / 2;
                  const y = centerY - scaledHeight / 2;
                  const fileId = Math.random().toString(36).slice(2);

                  api.addFiles([
                    {
                      id: fileId as BinaryFileData["id"],
                      dataURL: imageUrl as BinaryFileData["dataURL"],
                      mimeType: "image/png" as BinaryFileData["mimeType"],
                      created: Date.now(),
                    },
                  ]);

                  const updated = currentElements.map((el) =>
                    el.id === placeholderId
                      ? {
                        ...el,
                        type: "image",
                        fileId: fileId as FileId,
                        status: "saved",
                        x,
                        y,
                        width: scaledWidth,
                        height: scaledHeight,
                        scale: [1, 1],
                        opacity: 100,
                        customData: undefined,
                      }
                      : el,
                  ) as ExcalidrawElement[];

                  api.updateScene({ elements: updated });
                  pushHistory(updated);
                };
                img.src = imageUrl;
              }
            }

            // Clean up tracking
            loadingPlaceholdersRef.current.delete(placeholderId);
            setGeneratingPlaceholders((prev) => prev.filter((id) => id !== placeholderId));
            setActiveJobIds((prev) => prev.filter((id) => id !== job._id));
            delete jobToPlaceholderMapRef.current[job._id];
          }

          // Job failed
          if (job.status === "failed") {
            // Remove placeholder
            if (apiRef.current) {
              const currentElements = apiRef.current.getSceneElements() as ExcalidrawElement[];
              const withoutPlaceholder = currentElements.map((el) =>
                el.id === placeholderId ? { ...el, isDeleted: true } : el,
              ) as ExcalidrawElement[];
              apiRef.current.updateScene({ elements: withoutPlaceholder });
            }

            // Clean up tracking
            loadingPlaceholdersRef.current.delete(placeholderId);
            setGeneratingPlaceholders((prev) => prev.filter((id) => id !== placeholderId));
            setActiveJobIds((prev) => prev.filter((id) => id !== job._id));
            delete jobToPlaceholderMapRef.current[job._id];

            showToast(`Generation failed: ${job.error || "Unknown error"}`);
          }
        }
      } catch (error) {
        console.error("[JobPoller] Error polling jobs:", error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [activeJobIds, pushHistory, showToast]);

  const handleFindOnCanvas = () => {
    const query = window.prompt("Find on canvas");
    if (!query) {
      return;
    }
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return;
    }
    const match = elementsRef.current.find(
      (element) => element.type === "text" && element.text?.toLowerCase().includes(normalized),
    );
    if (!match) {
      showToast("No matches found");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiRef.current?.updateScene({
      appState: {
        selectedElementIds: { [match.id]: true },
        selectedGroupIds: {},
        editingGroupId: null,
      } as any,
    });
    apiRef.current?.scrollToContent(match, {
      fitToViewport: true,
      viewportZoomFactor: 0.9,
      animate: true,
    });
  };

  const buildQwenReferenceImage = async () => promptAttachments[0]?.url ?? null;

  const handleAddAttachments = async (files: File[]) => {
    const maxAttachments = 14;
    if (promptAttachments.length >= maxAttachments) {
      showToast("Max 14 reference images");
      return;
    }
    const remaining = Math.max(0, maxAttachments - promptAttachments.length);
    const nextFiles = files.slice(0, remaining);
    try {
      const entries = await Promise.all(
        nextFiles.map(async (file) => ({
          id: createId(),
          url: await fileToDataUrl(file),
          mimeType: file.type || "image/png",
          name: file.name,
        })),
      );
      setPromptAttachments((prev) => [...prev, ...entries]);
    } catch {
      showToast("Failed to add photos");
    }
  };

  const handleReplaceAttachment = async (id: string, file: File) => {
    try {
      const url = await fileToDataUrl(file);
      setPromptAttachments((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
              ...item,
              url,
              mimeType: file.type || item.mimeType,
              name: file.name,
            }
            : item,
        ),
      );
    } catch {
      showToast("Failed to replace photo");
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setPromptAttachments((prev) => prev.filter((item) => item.id !== id));
    // Also remove from canvas tracking if it was a canvas attachment
    canvasAttachmentIdsRef.current.delete(id);
    // Track that this was manually removed - don't auto-add it back while still selected
    manuallyRemovedIdsRef.current.add(id);
  };

  // Add selected canvas images to prompt attachments
  const addCanvasImagesToPrompt = useCallback(
    (imageIds: string[]) => {
      if (!apiRef.current || imageIds.length === 0) {
        return;
      }
      const maxAttachments = 14;
      const files = apiRef.current.getFiles();
      const imageElements = elementsRef.current.filter(
        (el) =>
          el.type === "image" &&
          imageIds.includes(el.id) &&
          !el.isDeleted &&
          !isMoodyLoadingElement(el),
      );

      const newAttachments: PromptAttachment[] = [];
      for (const element of imageElements) {
        // Skip if already attached
        if (canvasAttachmentIdsRef.current.has(element.id)) {
          continue;
        }
        // Check attachment limit
        if (promptAttachments.length + newAttachments.length >= maxAttachments) {
          break;
        }
        // Get file data from Excalidraw files
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fileId = (element as any).fileId;
        if (!fileId) {
          continue;
        }
        const fileData = files[fileId];
        if (!fileData?.dataURL) {
          continue;
        }
        newAttachments.push({
          id: element.id, // Use element ID so we can track it
          url: fileData.dataURL,
          mimeType: fileData.mimeType || "image/png",
          name: `Canvas image`,
        });
        canvasAttachmentIdsRef.current.add(element.id);
      }

      if (newAttachments.length > 0) {
        setPromptAttachments((prev) => [...prev, ...newAttachments]);
        // Expand prompt bar when adding images
        setIsPromptCollapsed(false);
        showToast(`Added ${newAttachments.length} image${newAttachments.length > 1 ? "s" : ""} to prompt`);
      }
    },
    [promptAttachments.length, showToast]
  );

  const addSelectedImagesToPrompt = useCallback(() => {
    if (!apiRef.current) {
      return;
    }
    const selected = apiRef.current.getAppState().selectedElementIds ?? {};
    const selectedIds = Object.keys(selected).filter((id) => selected[id]);
    if (selectedIds.length === 0) {
      return;
    }
    addCanvasImagesToPrompt(selectedIds);
  }, [addCanvasImagesToPrompt]);

  // Remove canvas attachments when their source elements are deleted
  const syncCanvasAttachments = useCallback(() => {
    const currentElementIds = new Set(
      elementsRef.current.filter((el) => !el.isDeleted).map((el) => el.id)
    );
    const toRemove: string[] = [];
    canvasAttachmentIdsRef.current.forEach((id) => {
      if (!currentElementIds.has(id)) {
        toRemove.push(id);
      }
    });
    if (toRemove.length > 0) {
      toRemove.forEach((id) => canvasAttachmentIdsRef.current.delete(id));
      setPromptAttachments((prev) =>
        prev.filter((att) => !toRemove.includes(att.id))
      );
    }
  }, []);

  const handleGenerateImage = async () => {
    const prompt = promptValue.trim();
    if (!prompt) {
      showToast("Type a prompt first");
      return;
    }

    // Check if we can start more jobs
    const availableSlots = MAX_CONCURRENT_JOBS - activeJobIds.length;
    if (availableSlots <= 0) {
      showToast("Max concurrent jobs reached. Wait for a job to complete.");
      return;
    }

    // Limit batch to available slots
    const actualBatchCount = Math.min(batchCount, availableSlots);

    // Create placeholders for each image - placed SIDE BY SIDE
    const center = getViewportCenter();
    const placeholderWidth = 340;
    const placeholderHeight = 450;
    const gap = 20;
    const totalWidth = actualBatchCount * placeholderWidth + (actualBatchCount - 1) * gap;
    const startX = center.x - totalWidth / 2;
    const placeholderY = center.y - placeholderHeight / 2;

    const placeholderIds: string[] = [];

    if (apiRef.current) {
      const api = apiRef.current;
      if (typeof window !== "undefined") {
        window.__moodyLoadingFrameIndex = 0;
        window.__moodyLoadingFrameLastAt =
          typeof performance !== "undefined" ? performance.now() : Date.now();
      }
      loadingFrameIndexRef.current = 0;
      loadingFrameLastAtRef.current =
        typeof performance !== "undefined" ? performance.now() : Date.now();

      const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");

      // Create N placeholders side by side
      const placeholderSkeletons = [];
      for (let i = 0; i < actualBatchCount; i++) {
        const placeholderX = startX + i * (placeholderWidth + gap);
        const placeholderFileId = createId();
        placeholderSkeletons.push({
          type: "image" as const,
          x: placeholderX,
          y: placeholderY,
          width: placeholderWidth,
          height: placeholderHeight,
          status: "pending" as const,
          fileId: placeholderFileId as FileId,
          scale: [1, 1] as [number, number],
          angle: 0,
          opacity: 0,
          customData: { moodyLoading: true, moodyFrameIndex: 0 },
        });
      }

      const placeholderElements = convertToExcalidrawElements(
        placeholderSkeletons,
        { regenerateIds: true },
      );

      // Track all placeholder IDs
      const selectedIds: Record<string, true> = {};
      for (const el of placeholderElements) {
        placeholderIds.push(el.id);
        selectedIds[el.id] = true;
        loadingPlaceholdersRef.current.add(el.id);
      }

      const updated = [...api.getSceneElements(), ...placeholderElements];
      api.updateScene({
        elements: updated,
        appState: {
          selectedElementIds: selectedIds,
          selectedGroupIds: {},
          editingGroupId: null,
        },
      });
      pushHistory(updated);
      setGeneratingPlaceholders((prev) => [...prev, ...placeholderIds]);
      api.refresh();
    }

    // Track these as active jobs
    setActiveJobIds((prev) => [...prev, ...placeholderIds]);

    // Prepare input image URLs from attachments  
    const inputImageUrls = promptAttachments.map((a) => a.url);

    // Call the queue API to submit all jobs at once
    try {
      const response = await fetch("/api/queue/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: generationModel,
          prompt,
          inputImageUrls,
          variations: actualBatchCount,
          placeholderIds,  // Pass placeholder IDs so we can track them
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(
          (errorPayload as { error?: string })?.error || "Failed to queue generation"
        );
      }

      const data = await response.json() as { jobIds?: string[]; success?: boolean; message?: string };
      console.log("[Queue] Submitted jobs:", data);

      // Store mapping of jobId -> placeholderId for when jobs complete
      if (data.jobIds && Array.isArray(data.jobIds)) {
        const mapping: Record<string, string> = {};
        data.jobIds.forEach((jobId: string, index: number) => {
          if (placeholderIds[index]) {
            mapping[jobId] = placeholderIds[index];
          }
        });
        // Store in a ref for later use when Convex updates come in
        jobToPlaceholderMapRef.current = {
          ...jobToPlaceholderMapRef.current,
          ...mapping,
        };
      }

    } catch (error) {
      // Remove all placeholders on queue error
      if (apiRef.current) {
        const currentElements = apiRef.current.getSceneElements() as ExcalidrawElement[];
        const withoutPlaceholders = currentElements.map((el) =>
          placeholderIds.includes(el.id) ? { ...el, isDeleted: true } : el,
        ) as ExcalidrawElement[];
        apiRef.current.updateScene({ elements: withoutPlaceholders });
      }

      placeholderIds.forEach((id) => {
        loadingPlaceholdersRef.current.delete(id);
      });
      setGeneratingPlaceholders((prev) =>
        prev.filter((id) => !placeholderIds.includes(id))
      );
      setActiveJobIds((prev) =>
        prev.filter((id) => !placeholderIds.includes(id))
      );

      const message = error instanceof Error ? error.message : "Failed to queue generation";
      showToast(message);
      return;
    }

    // Clear prompt immediately - user can start typing next prompt
    setPromptValue("");
    setPromptAttachments([]);
    setHasPrompted(true);
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (window.__moodyLoadingFrames?.length) {
      window.__moodyLoadingFrameIndex = 0;
      window.__moodyLoadingFrameLastAt =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      window.__moodyLoadingFrameIntervalMs = loadingFrameIntervalMs;
      window.__moodyLoadingFramesReady = window.__moodyLoadingFrames.every(
        (frame) => frame.complete,
      );
      return;
    }
    window.__moodyLoadingFramesReady = false;
    let loadedCount = 0;
    const frames = loadingFrameSources.map((src) => {
      const img = new window.Image();
      img.onload = () => {
        loadedCount += 1;
        if (loadedCount >= loadingFrameSources.length) {
          window.__moodyLoadingFramesReady = true;
        }
      };
      img.src = src;
      return img;
    });
    window.__moodyLoadingFrames = frames;
    window.__moodyLoadingFrameIndex = 0;
    window.__moodyLoadingFrameLastAt =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    window.__moodyLoadingFrameIntervalMs = loadingFrameIntervalMs;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const styles = window.getComputedStyle(document.documentElement);
    window.__moodyLoadingPalette = {
      base: styles.getPropertyValue("--surface").trim() || "#ffffff",
      mid:
        styles.getPropertyValue("--surface-hover").trim() ||
        "rgba(15, 23, 42, 0.06)",
      soft:
        styles.getPropertyValue("--surface-soft").trim() ||
        styles.getPropertyValue("--surface-hover").trim() ||
        "rgba(15, 23, 42, 0.08)",
      border:
        styles.getPropertyValue("--border").trim() ||
        "rgba(15, 23, 42, 0.12)",
    };
  }, [resolvedTheme]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const wrapper = overlayWrapperRef.current;
    const canvas = overlayCanvasRef.current;
    if (!wrapper || !canvas) {
      return;
    }
    const resize = () => {
      const rect = wrapper.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      const dpr = window.devicePixelRatio || 1;
      overlaySizeRef.current = { width, height, dpr };
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const canvas = overlayCanvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    if (generatingPlaceholders.length === 0) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      loadingFrameIndexRef.current = 0;
      loadingFrameLastAtRef.current = null;
      return;
    }

    let rafId = 0;
    const tick = (now: number) => {
      const sceneElements = apiRef.current?.getSceneElements() ?? elementsRef.current;
      const placeholders = sceneElements.filter(
        (element) =>
          !element.isDeleted &&
          loadingPlaceholdersRef.current.has(element.id) &&
          isMoodyLoadingElement(element),
      );
      if (placeholders.length === 0) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        rafId = window.requestAnimationFrame(tick);
        return;
      }

      const frames = window.__moodyLoadingFrames ?? [];
      const framesReady =
        window.__moodyLoadingFramesReady ?? frames.every((frame) => frame.complete);
      const interval = getLoadingFrameInterval(placeholders.length);
      if (!framesReady || frames.length === 0) {
        loadingFrameIndexRef.current = 0;
        loadingFrameLastAtRef.current = now;
      } else if (!Number.isFinite(loadingFrameLastAtRef.current)) {
        loadingFrameLastAtRef.current = now;
      } else if (now - (loadingFrameLastAtRef.current ?? 0) >= interval) {
        loadingFrameIndexRef.current =
          (loadingFrameIndexRef.current + 1) % frames.length;
        loadingFrameLastAtRef.current = now;
      }

      const palette = window.__moodyLoadingPalette ?? {
        base: "#f8f6f2",
        mid: "rgba(15, 23, 42, 0.06)",
        soft: "rgba(15, 23, 42, 0.08)",
        border: "rgba(15, 23, 42, 0.12)",
      };
      const frame =
        framesReady && frames.length
          ? frames[loadingFrameIndexRef.current]
          : null;
      const { width, height, dpr } = overlaySizeRef.current;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const appState = apiRef.current?.getAppState() ?? appStateRef.current;
      if (appState) {
        const zoom = appState.zoom?.value ?? 1;
        const scrollX = appState.scrollX ?? 0;
        const scrollY = appState.scrollY ?? 0;
        placeholders.forEach((element) => {
          const x = (element.x + scrollX) * zoom;
          const y = (element.y + scrollY) * zoom;
          const elementWidth = element.width * zoom;
          const elementHeight = element.height * zoom;
          if (elementWidth <= 1 || elementHeight <= 1) {
            return;
          }
          if (
            x > width ||
            y > height ||
            x + elementWidth < 0 ||
            y + elementHeight < 0
          ) {
            return;
          }
          drawMoodyPlaceholder(
            ctx,
            x,
            y,
            elementWidth,
            elementHeight,
            palette,
            frame,
          );
        });
      }

      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [generatingPlaceholders.length, resolvedTheme]);

  useEffect(() => {
    if (theme !== "system") {
      setResolvedTheme(theme);
      return;
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setResolvedTheme(media.matches ? "dark" : "light");
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [theme]);

  // Close extra tools dropdown on outside click
  useEffect(() => {
    if (!isExtraToolsOpen) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (
        extraToolsRef.current &&
        !extraToolsRef.current.contains(event.target as Node) &&
        extraToolsButtonRef.current &&
        !extraToolsButtonRef.current.contains(event.target as Node)
      ) {
        setIsExtraToolsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsExtraToolsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isExtraToolsOpen]);

  useEffect(() => {
    if (!apiRef.current) {
      return;
    }
    const nextBackground = resolvedTheme === "dark" ? "#11151c" : "#ffffff";
    apiRef.current.updateScene({
      appState: {
        theme: resolvedTheme,
        viewBackgroundColor: nextBackground,
      } as any, // Cast to avoid partial mismatch
    });
  }, [resolvedTheme]);

  useEffect(() => {
    if (!apiReady || !apiRef.current) {
      return;
    }
    const api = apiRef.current;
    const unsubscribeChange = api.onChange(handleSceneChange);
    const unsubscribePointer = api.onPointerUp(() => {
      if (historyApplyingRef.current) {
        return;
      }
      const snapshot = api.getSceneElements();
      pushHistory(snapshot);
      addSelectedImagesToPrompt();
    });

    appStateRef.current = api.getAppState();
    uiSnapshotRef.current = {
      activeTool: (appStateRef.current?.activeTool?.type as ToolType) ?? "selection",
      currentItemStrokeColor: appStateRef.current?.currentItemStrokeColor ?? "#111827",
      currentItemBackgroundColor:
        appStateRef.current?.currentItemBackgroundColor ?? "transparent",
      currentItemStrokeWidth: appStateRef.current?.currentItemStrokeWidth ?? 1,
      currentItemFontSize: appStateRef.current?.currentItemFontSize ?? 20,
      zoom: appStateRef.current?.zoom?.value ?? 1,
      isToolLocked: appStateRef.current?.activeTool?.locked ?? false,
    };
    setUiSnapshot(uiSnapshotRef.current);

    return () => {
      unsubscribeChange();
      unsubscribePointer();
    };
  }, [apiReady, handleSceneChange, pushHistory]);

  // Auto-add selected images to prompt attachments (only on NEW selections)
  useEffect(() => {
    if (selectedIds.length === 0) {
      // Clear manual removal tracking when selection is cleared
      manuallyRemovedIdsRef.current.clear();
      return;
    }

    // Create a unique key for current selection to detect changes
    const selectionKey = [...selectedIds].sort().join(',');
    if (selectionKey === lastProcessedSelectionRef.current) {
      // Already processed this exact selection, skip to prevent loops
      return;
    }
    lastProcessedSelectionRef.current = selectionKey;

    const selectedImageIds = elementsRef.current
      .filter(
        (el) =>
          selectedIds.includes(el.id) &&
          el.type === "image" &&
          !el.isDeleted &&
          !isMoodyLoadingElement(el) &&
          !manuallyRemovedIdsRef.current.has(el.id), // Don't re-add manually removed images
      )
      .map((el) => el.id);
    if (selectedImageIds.length > 0) {
      addCanvasImagesToPrompt(selectedImageIds);
    }
  }, [selectedIds, addCanvasImagesToPrompt]);

  // Sync canvas attachments when elements are deleted
  useEffect(() => {
    syncCanvasAttachments();
  }, [selectedIds, syncCanvasAttachments]);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (isPromptFocused) {
        return;
      }
      const items = Array.from(event.clipboardData?.items ?? []);
      const imageFiles = items
        .filter((item) => item.type.startsWith("image/"))
        .map((item) => item.getAsFile())
        .filter(Boolean) as File[];
      if (imageFiles.length === 0) {
        return;
      }
      event.preventDefault();
      void (async () => {
        const entries = await Promise.all(
          imageFiles.map(async (file) => ({
            dataUrl: await fileToDataUrl(file),
            mimeType: file.type || "image/png",
          })),
        );
        await addImagesToScene(entries);
      })();
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [addImagesToScene, isPromptFocused]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!isMenuOpen) {
        return;
      }
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) {
        return;
      }
      if (menuButtonRef.current?.contains(target)) {
        return;
      }
      setIsMenuOpen(false);
    };

    window.addEventListener("pointerdown", handleClick);
    return () => window.removeEventListener("pointerdown", handleClick);
  }, [isMenuOpen]);

  // Context menu close handlers
  useEffect(() => {
    if (!contextMenu) {
      return;
    }
    const handleClose = (event: PointerEvent) => {
      const target = event.target as Node;
      if (contextMenuRef.current?.contains(target)) {
        return;
      }
      setContextMenu(null);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setContextMenu(null);
      }
    };
    window.addEventListener("pointerdown", handleClose);
    window.addEventListener("scroll", () => setContextMenu(null), { passive: true });
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("pointerdown", handleClose);
      window.removeEventListener("scroll", () => setContextMenu(null));
      window.removeEventListener("keydown", handleKey);
    };
  }, [contextMenu]);

  // Context menu positioning
  useEffect(() => {
    if (!contextMenu) {
      return;
    }
    const menuWidth = 260;
    const menuHeight = 320;
    const maxX = window.innerWidth - menuWidth;
    const maxY = window.innerHeight - menuHeight;
    setMenuPosition({
      x: Math.max(12, Math.min(contextMenu.x, maxX)),
      y: Math.max(12, Math.min(contextMenu.y, maxY)),
    });
  }, [contextMenu]);

  // Context menu handler
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    const ids = selectedIds.length > 0 ? selectedIds : [];
    contextPointRef.current = { x: event.clientX, y: event.clientY };
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      targetIds: ids,
      type: ids.length > 0 ? "element" : "canvas",
    });
  }, [selectedIds]);

  return (
    <div
      className="board-theme relative min-h-[100svh] bg-[color:var(--board-bg)] text-[color:var(--text-primary)]"
      data-theme={theme}
      style={{ colorScheme }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <header className="fixed left-0 right-0 top-0 z-30">
        <div className="flex w-full items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <button
            type="button"
            aria-label="Open settings"
            ref={menuButtonRef}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={`flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm transition hover:bg-[color:var(--surface-hover)] ${isMenuOpen ? "ring-2 ring-indigo-400/60" : ""
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
                    onClick={() => {
                      if (tool.id === "image") {
                        handleOpenFile();
                        apiRef.current?.setActiveTool({ type: "selection" });
                        return;
                      }
                      apiRef.current?.setActiveTool({ type: tool.id });
                    }}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition ${isActive
                      ? "bg-indigo-500 text-white shadow-[0_8px_20px_rgba(79,70,229,0.35)]"
                      : "text-[color:var(--text-primary)] hover:bg-[color:var(--surface-hover)]"
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}

              {/* Extra Tools Dropdown */}
              <div className="relative">
                <button
                  ref={extraToolsButtonRef}
                  type="button"
                  aria-label="More tools"
                  aria-expanded={isExtraToolsOpen}
                  onClick={() => setIsExtraToolsOpen(!isExtraToolsOpen)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition ${isExtraToolsOpen
                    ? "bg-indigo-500 text-white shadow-[0_8px_20px_rgba(79,70,229,0.35)]"
                    : "text-[color:var(--text-primary)] hover:bg-[color:var(--surface-hover)]"
                    }`}
                >
                  <ChevronDown className="h-4 w-4" />
                </button>

                {isExtraToolsOpen && (
                  <div
                    ref={extraToolsRef}
                    className="absolute left-1/2 top-12 z-50 w-56 -translate-x-1/2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-2 text-sm text-[color:var(--text-primary)] shadow-[0_16px_48px_rgba(15,23,42,0.2)]"
                  >
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={handleFrameTool}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-[color:var(--surface-hover)]"
                      >
                        <Frame className="h-4 w-4 text-[color:var(--text-secondary)]" />
                        <span>Frame tool</span>
                        <span className="ml-auto text-[11px] text-[color:var(--text-faint)]">F</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleWebEmbed}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-[color:var(--surface-hover)]"
                      >
                        <Globe className="h-4 w-4 text-[color:var(--text-secondary)]" />
                        <span>Web Embed</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleLaserPointer}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-[color:var(--surface-hover)]"
                      >
                        <Pointer className="h-4 w-4 text-[color:var(--text-secondary)]" />
                        <span>Laser pointer</span>
                        <span className="ml-auto text-[11px] text-[color:var(--text-faint)]">K</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleLassoTool}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-[color:var(--surface-hover)]"
                      >
                        <Lasso className="h-4 w-4 text-[color:var(--text-secondary)]" />
                        <span>Lasso selection</span>
                      </button>

                      <div className="my-2 h-px bg-[color:var(--border)]" />

                      <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[color:var(--text-faint)]">
                        Generate
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          showToast("Text to diagram coming soon");
                          setIsExtraToolsOpen(false);
                        }}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-[color:var(--surface-hover)]"
                      >
                        <Sparkles className="h-4 w-4 text-[color:var(--text-secondary)]" />
                        <span>Text to diagram</span>
                        <span className="ml-auto rounded bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold text-indigo-600">AI</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          showToast("Mermaid to Excalidraw coming soon");
                          setIsExtraToolsOpen(false);
                        }}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-[color:var(--surface-hover)]"
                      >
                        <Wand2 className="h-4 w-4 text-[color:var(--text-secondary)]" />
                        <span>Mermaid to Excalidraw</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          showToast("Wireframe to code coming soon");
                          setIsExtraToolsOpen(false);
                        }}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-[color:var(--surface-hover)]"
                      >
                        <FileCode className="h-4 w-4 text-[color:var(--text-secondary)]" />
                        <span>Wireframe to code</span>
                        <span className="ml-auto rounded bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold text-indigo-600">AI</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tool Lock Button - keeps tool active after drawing */}
              <button
                type="button"
                aria-label="Lock tool"
                onClick={handleToolLock}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition ${appStateRef.current?.activeTool?.locked
                  ? "bg-indigo-500 text-white shadow-[0_8px_20px_rgba(79,70,229,0.35)]"
                  : "text-[color:var(--text-primary)] hover:bg-[color:var(--surface-hover)]"
                  }`}
              >
                <Lock className="h-4 w-4" />
              </button>
            </div>
          </div>

          <button
            type="button"
            aria-label="Share"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-white shadow-[0_10px_24px_rgba(79,70,229,0.35)] transition hover:bg-indigo-400"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div
          ref={menuRef}
          className="fixed left-4 top-[72px] z-40 w-72 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3 text-sm text-[color:var(--text-primary)] shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:left-6 sm:top-[84px]"
        >
          <div className="flex flex-col gap-1">
            <Link
              href="/dashboard"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-3 py-2 font-semibold transition hover:bg-[color:var(--surface-hover)]"
            >
              <ArrowLeft className="h-4 w-4 text-indigo-500" />
              <span>Back to files</span>
            </Link>
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
                showToast("Save is coming soon.");
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
                showToast("Export image is coming soon.");
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
                showToast("Live collaboration is coming soon.");
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
                apiRef.current?.resetScene();
                historyRef.current = [];
                historyIndexRef.current = -1;
                syncHistoryState();
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
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition ${isActive
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

      {/* Image Selection Panel */}
      {selectedElement?.type === "image" && !isMenuOpen && (
        <div className="fixed left-4 top-[72px] z-40 w-72 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm text-[color:var(--text-primary)] shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:left-6 sm:top-[84px]">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-faint)]">
                Image selected
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-faint)]">
                Opacity
              </p>
              <div className="mt-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round((selectedElement.opacity ?? 1) * 100)}
                  onChange={(e) => handleOpacity(Number(e.target.value))}
                  className="w-full accent-indigo-400"
                />
                <div className="mt-2 flex items-center justify-between text-xs text-[color:var(--text-faint)]">
                  <span>0</span>
                  <span>100</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-faint)]">
                Layers
              </p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => moveElementTo("back")}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-hover)]"
                  aria-label="Send to back"
                >
                  <ArrowDownToLine className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveElementBy(-1)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-hover)]"
                  aria-label="Send backward"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveElementBy(1)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-hover)]"
                  aria-label="Bring forward"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveElementTo("front")}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-hover)]"
                  aria-label="Bring to front"
                >
                  <ArrowUpToLine className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-faint)]">
                Transform
              </p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleFlip("horizontal")}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-hover)]"
                  aria-label="Flip horizontal"
                >
                  <FlipHorizontal2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFlip("vertical")}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-hover)]"
                  aria-label="Flip vertical"
                >
                  <FlipVertical2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-faint)]">
                Actions
              </p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={handleDuplicate}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-hover)]"
                  aria-label="Duplicate"
                >
                  <CopyPlus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-hover)]"
                  aria-label="Copy"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] text-red-500 transition hover:bg-red-50"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Text Selection Panel */}
      {selectedElement?.type === "text" && !isMenuOpen && (
        <div className="fixed left-4 top-[72px] z-40 w-72 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm text-[color:var(--text-primary)] shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:left-6 sm:top-[84px]">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-faint)]">
                Text selected
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-faint)]">
                Color
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {strokePalette.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleStrokeColor(color)}
                    className={`h-8 w-8 rounded-full border transition ${panelStrokeColor === color
                      ? "border-indigo-400"
                      : "border-[color:var(--border)]"
                      }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Color ${color}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-faint)]">
                Font size
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {fontSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleFontSize(size)}
                    className={`flex h-9 flex-1 items-center justify-center rounded-full border text-xs font-semibold transition ${panelFontSize === size
                      ? "border-indigo-400 bg-indigo-50 text-indigo-500"
                      : "border-[color:var(--border)] text-[color:var(--text-secondary)]"
                      }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-faint)]">
                Align
              </p>
              <div className="mt-3 flex gap-2">
                {[
                  { id: "left", icon: AlignLeft },
                  { id: "center", icon: AlignCenter },
                  { id: "right", icon: AlignRight },
                ].map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        updateSelectedElements({ textAlign: option.id as "left" | "center" | "right" });
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-hover)]"
                      aria-label={`Align ${option.id}`}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-faint)]">
                Layers
              </p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => moveElementTo("back")}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-hover)]"
                >
                  <ArrowDownToLine className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveElementBy(-1)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-hover)]"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveElementBy(1)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-hover)]"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveElementTo("front")}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-hover)]"
                >
                  <ArrowUpToLine className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-faint)]">
                Actions
              </p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={handleDuplicate}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-hover)]"
                >
                  <CopyPlus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-hover)]"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] text-red-500 transition hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generic Shape Selection Panel (rectangles, ellipses, etc.) */}
      {selectedIds.length > 0 && selectedElement?.type !== "image" && selectedElement?.type !== "text" && !isMenuOpen && (
        <div className="fixed left-4 top-[72px] z-40 w-72 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm text-[color:var(--text-primary)] shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:left-6 sm:top-[84px]">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-faint)]">
                Selection
              </p>
              <p className="mt-2 text-sm font-semibold">{selectionLabel}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-faint)]">
                Stroke
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {strokePalette.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleStrokeColor(color)}
                    className={`h-8 w-8 rounded-full border transition ${panelStrokeColor === color
                      ? "border-indigo-400"
                      : "border-[color:var(--border)]"
                      }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Stroke ${color}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-faint)]">
                Fill
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {fillPalette.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleFillColor(color)}
                    className={`relative h-8 w-8 rounded-full border transition ${panelFillColor === color
                      ? "border-indigo-400"
                      : "border-[color:var(--border)]"
                      }`}
                    style={{
                      backgroundColor: color === "transparent" ? "#ffffff" : color,
                      backgroundImage:
                        color === "transparent"
                          ? "linear-gradient(45deg, #e5e7eb 25%, transparent 25%, transparent 75%, #e5e7eb 75%, #e5e7eb), linear-gradient(45deg, #e5e7eb 25%, transparent 25%, transparent 75%, #e5e7eb 75%, #e5e7eb)"
                          : undefined,
                      backgroundPosition:
                        color === "transparent" ? "0 0, 6px 6px" : undefined,
                      backgroundSize:
                        color === "transparent" ? "12px 12px" : undefined,
                    }}
                    aria-label={`Fill ${color}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-faint)]">
                Stroke width
              </p>
              <div className="mt-3 flex gap-2">
                {strokeWidths.map((width) => (
                  <button
                    key={width}
                    type="button"
                    onClick={() => handleStrokeWidth(width)}
                    className={`flex h-9 flex-1 items-center justify-center rounded-full border text-xs font-semibold transition ${panelStrokeWidth === width
                      ? "border-indigo-400 bg-indigo-50 text-indigo-500"
                      : "border-[color:var(--border)] text-[color:var(--text-secondary)]"
                      }`}
                  >
                    {width}px
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-faint)]">
                Actions
              </p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={handleDuplicate}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-hover)]"
                >
                  <CopyPlus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] text-red-500 transition hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 w-52 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-1.5 text-sm text-[color:var(--text-primary)] shadow-[0_24px_70px_rgba(15,23,42,0.2)]"
          style={{ left: menuPosition.x, top: menuPosition.y }}
        >
          <div className="flex flex-col gap-0.5">
            {contextMenu.type === "element" && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    handleCopy();
                    setContextMenu(null);
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-[color:var(--surface-hover)]"
                >
                  <Copy className="h-4 w-4 text-[color:var(--text-secondary)]" />
                  <span>Copy</span>
                  <span className="ml-auto text-[11px] text-[color:var(--text-faint)]">⌘C</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDuplicate();
                    setContextMenu(null);
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-[color:var(--surface-hover)]"
                >
                  <CopyPlus className="h-4 w-4 text-[color:var(--text-secondary)]" />
                  <span>Duplicate</span>
                  <span className="ml-auto text-[11px] text-[color:var(--text-faint)]">⌘D</span>
                </button>
                <div className="my-1 h-px bg-[color:var(--border)]" />
                <button
                  type="button"
                  onClick={() => {
                    handleFlip("horizontal");
                    setContextMenu(null);
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-[color:var(--surface-hover)]"
                >
                  <FlipHorizontal2 className="h-4 w-4 text-[color:var(--text-secondary)]" />
                  <span>Flip horizontal</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleFlip("vertical");
                    setContextMenu(null);
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-[color:var(--surface-hover)]"
                >
                  <FlipVertical2 className="h-4 w-4 text-[color:var(--text-secondary)]" />
                  <span>Flip vertical</span>
                </button>
                <div className="my-1 h-px bg-[color:var(--border)]" />
                <button
                  type="button"
                  onClick={() => {
                    moveElementTo("front");
                    setContextMenu(null);
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-[color:var(--surface-hover)]"
                >
                  <ArrowUpToLine className="h-4 w-4 text-[color:var(--text-secondary)]" />
                  <span>Bring to front</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    moveElementTo("back");
                    setContextMenu(null);
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-[color:var(--surface-hover)]"
                >
                  <ArrowDownToLine className="h-4 w-4 text-[color:var(--text-secondary)]" />
                  <span>Send to back</span>
                </button>
                <div className="my-1 h-px bg-[color:var(--border)]" />
                <button
                  type="button"
                  onClick={() => {
                    handleDelete();
                    setContextMenu(null);
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-red-500 transition hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                  <span className="ml-auto text-[11px] text-[color:var(--text-faint)]">⌫</span>
                </button>
              </>
            )}
            {contextMenu.type === "canvas" && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    showToast("Paste from clipboard coming soon");
                    setContextMenu(null);
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-[color:var(--surface-hover)]"
                >
                  <Scissors className="h-4 w-4 text-[color:var(--text-secondary)]" />
                  <span>Paste</span>
                  <span className="ml-auto text-[11px] text-[color:var(--text-faint)]">⌘V</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Select all elements
                    if (apiRef.current) {
                      const allIds: Record<string, true> = {};
                      elementsRef.current
                        .filter((el) => !el.isDeleted)
                        .forEach((el) => { allIds[el.id] = true; });
                      apiRef.current.updateScene({
                        appState: { selectedElementIds: allIds, selectedGroupIds: {}, editingGroupId: null },
                      });
                    }
                    setContextMenu(null);
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-[color:var(--surface-hover)]"
                >
                  <MousePointer2 className="h-4 w-4 text-[color:var(--text-secondary)]" />
                  <span>Select all</span>
                  <span className="ml-auto text-[11px] text-[color:var(--text-faint)]">⌘A</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <main className="relative flex h-[100svh] w-full flex-col pt-24 sm:pt-20">
        <div
          className={`relative h-full w-full flex-1 overflow-hidden bg-[color:var(--canvas-bg)] ${isPlacingImages ? "cursor-crosshair" : ""}`}
          onContextMenu={handleContextMenu}
          onClick={isPlacingImages ? handleCanvasClickForPlacement : undefined}
        >
          <Excalidraw
            excalidrawAPI={(api) => {
              apiRef.current = api;
              setApiReady((prev) => prev || true);
            }}
            initialData={initialData}
            UIOptions={uiOptions}
            renderTopRightUI={() => null}
            viewModeEnabled={false}
            zenModeEnabled={false}
          />
          <div
            ref={overlayWrapperRef}
            className="pointer-events-none absolute inset-0 z-10"
          >
            <canvas ref={overlayCanvasRef} className="h-full w-full" />
          </div>
        </div>
      </main>

      <div className="fixed bottom-24 left-4 z-30 flex flex-col-reverse gap-4 sm:bottom-6 sm:left-6 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex w-fit items-center gap-2 self-start rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2 py-1 text-[11px] font-semibold text-[color:var(--text-primary)] shadow-md sm:self-auto sm:px-3 sm:py-2 sm:text-xs">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => handleZoom("out")}
            className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-[color:var(--surface-hover)]"
          >
            <span className="text-sm">-</span>
          </button>
          <span className="min-w-[52px] text-center">
            {Math.round((uiSnapshot.zoom ?? 1) * 100)}%
          </span>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => handleZoom("in")}
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
            disabled={!historyState.canUndo}
            className="flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-[color:var(--surface-hover)] disabled:opacity-40 sm:h-7 sm:w-7"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Redo"
            onClick={handleRedo}
            disabled={!historyState.canRedo}
            className="flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-[color:var(--surface-hover)] disabled:opacity-40 sm:h-7 sm:w-7"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Collapsible Prompt Bar */}
      <div
        className={`fixed left-1/2 z-30 -translate-x-1/2 flex flex-col items-center transition-all duration-300 ease-out ${isPromptCollapsed ? "bottom-0" : "bottom-6"
          }`}
      >
        {/* Toggle arrow - only visible when expanded */}
        {!isPromptCollapsed && (
          <button
            type="button"
            onClick={() => setIsPromptCollapsed(true)}
            className="mb-1 flex items-center justify-center text-[color:var(--text-secondary)] transition-all duration-300 hover:text-[color:var(--text-primary)] hover:scale-110"
            aria-label="Collapse prompt bar"
          >
            <ChevronDown className="h-6 w-6 stroke-[2.5]" />
          </button>
        )}

        {/* Prompt bar container - peeks when collapsed, hover on THIS element triggers animation */}
        <div
          className={`group w-[min(680px,92vw)] transition-all duration-300 ease-out ${isPromptCollapsed
            ? "translate-y-[calc(100%-24px)] opacity-75 hover:translate-y-[calc(100%-52px)] hover:opacity-100 cursor-pointer rounded-t-2xl ring-2 ring-[color:var(--charcoal)]/30 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]"
            : "translate-y-0 opacity-100"
            }`}
          onClick={() => isPromptCollapsed && setIsPromptCollapsed(false)}
        >
          <PromptInput
            showMic
            layout="stacked"
            value={promptValue}
            onValueChange={setPromptValue}
            onSubmit={handleGenerateImage}
            loadingOverride={activeJobIds.length >= MAX_CONCURRENT_JOBS}
            onFocusChange={setIsPromptFocused}
            modelOptions={[
              { id: "gemini", label: "Nano Banana Pro" },
              { id: "nano-banana", label: "Nano Banana" },
              { id: "zimage", label: "Z-Image" },
              { id: "grok", label: "Grok Image" },
              { id: "qwen", label: "Qwen Image" },
              { id: "seedream", label: "Seedream 4.5" },
            ]}
            selectedModel={generationModel}
            onSelectModel={(id) => {
              if (id === "nano-banana") {
                setGenerationModel("nano-banana");
              } else if (id === "zimage") {
                setGenerationModel("zimage");
              } else if (id === "grok") {
                setGenerationModel("grok");
              } else if (id === "qwen") {
                setGenerationModel("qwen");
              } else if (id === "seedream") {
                setGenerationModel("seedream");
              } else {
                setGenerationModel("gemini");
              }
            }}
            enableAttachmentMenu
            attachments={promptAttachments}
            onAddAttachments={handleAddAttachments}
            onReplaceAttachment={handleReplaceAttachment}
            onRemoveAttachment={handleRemoveAttachment}
            placeholder={
              hasPrompted ? "" : "Describe items to start generating your mood board"
            }
            showBatchSelector
            batchCount={batchCount}
            onBatchCountChange={setBatchCount}
            activeJobCount={activeJobIds.length}
            maxConcurrentJobs={MAX_CONCURRENT_JOBS}
          />
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-30 flex items-center gap-2">
        <div className="flex w-fit items-center gap-2 self-start rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2 py-1 text-[11px] font-semibold text-[color:var(--text-primary)] shadow-md sm:self-auto sm:px-3 sm:py-2 sm:text-xs">
          <button
            type="button"
            aria-label="Shortcuts"
            onClick={() => {
              if (apiRef.current) {
                apiRef.current.updateScene({ appState: { openDialog: { name: "help" } } as any });
              }
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-[color:var(--surface-hover)]"
          >
            <Keyboard className="h-4 w-4" />
          </button>
        </div>
      </div>
      <style jsx global>{`
        .board-theme .excalidraw .App-menu,
        .board-theme .excalidraw .App-toolbar,
        .board-theme .excalidraw .App-top-bar,
        .board-theme .excalidraw .App-bottom-bar,
        .board-theme .excalidraw .main-menu-trigger,
        .board-theme .excalidraw .help-icon,
        .board-theme .excalidraw .welcome-screen-center,
        .board-theme .excalidraw .welcome-screen-decor,
        .board-theme .excalidraw .welcome-screen-menu {
          display: none !important;
        }
        .board-theme .excalidraw {
          --default-font: var(--font-inter);
        }
      `}</style>
    </div>
  );
}
