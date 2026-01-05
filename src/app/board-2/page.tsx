"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AppState,
  BinaryFileData,
  ExcalidrawElement,
  ExcalidrawImperativeAPI,
  ToolType,
} from "@excalidraw/excalidraw";
import {
  ArrowLeft,
  FolderOpen,
  Hand,
  ImageDown,
  ImagePlus,
  Menu,
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
import PromptInput from "@/components/PromptInput";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false },
);

type ThemeMode = "light" | "dark" | "system";

type ToolbarTool = "selection" | "hand" | "text" | "image";

type UiSnapshot = {
  activeTool: ToolType;
  currentItemStrokeColor: string;
  currentItemBackgroundColor: string;
  currentItemStrokeWidth: number;
  currentItemFontSize: number;
  zoom: number;
};

type PromptAttachment = {
  id: string;
  url: string;
  mimeType: string;
  name?: string;
};

const toolbarButtons: { id: ToolbarTool; label: string; icon: typeof MousePointer2 }[] = [
  { id: "selection", label: "Select", icon: MousePointer2 },
  { id: "hand", label: "Hand", icon: Hand },
  { id: "text", label: "Text", icon: Type },
  { id: "image", label: "Image", icon: ImagePlus },
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
  const historyRef = useRef<readonly ExcalidrawElement[][]>([]);
  const historyIndexRef = useRef(-1);
  const historyApplyingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
  const [promptAttachments, setPromptAttachments] = useState<PromptAttachment[]>([]);
  const [generationModel, setGenerationModel] = useState<
    "gemini" | "zimage" | "grok" | "qwen" | "seedream"
  >("gemini");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [hasPrompted, setHasPrompted] = useState(false);
  const [uiSnapshot, setUiSnapshot] = useState<UiSnapshot>({
    activeTool: "selection",
    currentItemStrokeColor: "#111827",
    currentItemBackgroundColor: "transparent",
    currentItemStrokeWidth: 1,
    currentItemFontSize: 20,
    zoom: 1,
  });
  const uiSnapshotRef = useRef(uiSnapshot);

  const initialData = useMemo(
    () => ({
      elements: [],
      appState: {
        viewBackgroundColor: "#ffffff",
        currentItemStrokeColor: "#111827",
        currentItemBackgroundColor: "transparent",
        currentItemStrokeWidth: 1,
        currentItemFontSize: 20,
        theme: "light",
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
        export: false,
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
      historyRef.current = [...trimmed, snapshot];
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
        activeTool: nextAppState.activeTool?.type ?? "selection",
        currentItemStrokeColor: nextAppState.currentItemStrokeColor,
        currentItemBackgroundColor: nextAppState.currentItemBackgroundColor,
        currentItemStrokeWidth: nextAppState.currentItemStrokeWidth,
        currentItemFontSize: nextAppState.currentItemFontSize,
        zoom: nextAppState.zoom?.value ?? 1,
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
    apiRef.current?.updateScene({ appState: nextAppState });
  }, []);

  const updateSelectedElements = useCallback(
    (updates: Partial<ExcalidrawElement>) => {
      if (!apiRef.current || selectedIds.length === 0) {
        return;
      }
      const updated = elementsRef.current.map((element) =>
        selectedIds.includes(element.id) ? { ...element, ...updates } : element,
      );
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
        fileId: string;
        status: "saved";
        scale: [number, number];
        x: number;
        y: number;
        width: number;
        height: number;
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
            fileId,
            status: "saved",
            scale: [1, 1],
            x,
            y,
            width: scaledWidth,
            height: scaledHeight,
          });
        }),
      );

      api.addFiles(fileRecords);
      const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");
      const newElements = convertToExcalidrawElements(skeletons, {
        regenerateIds: true,
      });

      const updated = [...api.getSceneElements(), ...newElements];
      const selectedElementIds: AppState["selectedElementIds"] = {};
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
      );
      apiRef.current?.updateScene({ elements: updated });
      pushHistory(updated);
    }
  };

  const handleDelete = () => {
    if (!selectedIds.length) {
      return;
    }
    const updated = elementsRef.current.map((element) =>
      selectedIds.includes(element.id) ? { ...element, isDeleted: true } : element,
    );
    apiRef.current?.updateScene({ elements: updated });
    pushHistory(updated);
  };

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
    apiRef.current.updateScene({ elements: historyRef.current[nextIndex] });
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
    apiRef.current.updateScene({ elements: historyRef.current[nextIndex] });
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
    await addImagesToScene(entries);
    event.target.value = "";
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
    const match = elementsRef.current.find(
      (element) => element.type === "text" && element.text?.toLowerCase().includes(normalized),
    );
    if (!match) {
      showToast("No matches found");
      return;
    }
    apiRef.current?.updateScene({
      appState: {
        selectedElementIds: { [match.id]: true },
        selectedGroupIds: {},
        editingGroupId: null,
      },
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
  };

  const handleGenerateImage = async () => {
    const prompt = promptValue.trim();
    if (!prompt) {
      showToast("Type a prompt first");
      return;
    }
    if (isGeneratingImage) {
      return;
    }
    setIsGeneratingImage(true);

    try {
      const attachmentsPayload = promptAttachments
        .map((attachment) => {
          const parts = attachment.url.split(",");
          if (parts.length < 2) {
            return null;
          }
          return {
            data: parts[1],
            mimeType: attachment.mimeType,
          };
        })
        .filter(Boolean);
      const hasAttachments = promptAttachments.length > 0;
      const useZImage = generationModel === "zimage" && !hasAttachments;
      const useQwenEdit = generationModel === "zimage" && hasAttachments;
      const useGrok = generationModel === "grok";
      const useSeedream = generationModel === "seedream";
      const useSeedreamText = useSeedream && !hasAttachments;
      const useSeedreamEdit = useSeedream && hasAttachments;
      const useQwenText = generationModel === "qwen" && !hasAttachments;
      const useQwenImage = generationModel === "qwen" && hasAttachments;
      const needsReferenceImage = useQwenImage || useSeedreamEdit;
      const referenceImage = needsReferenceImage
        ? await buildQwenReferenceImage()
        : null;
      if (needsReferenceImage && !referenceImage) {
        throw new Error("No reference image provided");
      }
      const endpoint = useQwenImage
        ? "/api/generate-qwen-image"
        : useQwenText
          ? "/api/generate-qwen"
          : useSeedreamEdit
            ? "/api/generate-seedream-edit"
            : useSeedreamText
              ? "/api/generate-seedream"
              : useGrok
                ? "/api/generate-grok"
                : useZImage
                  ? "/api/generate-zimage"
                  : useQwenEdit
                    ? "/api/generate-qwen-edit"
                    : "/api/generate-image";
      const payload = useQwenImage
        ? { prompt, image: referenceImage }
        : useQwenText
          ? { prompt, imageSize: "portrait_4_3" }
          : useSeedreamEdit
            ? {
                prompt,
                images: referenceImage ? [referenceImage] : [],
                aspectRatio: "3:4",
                quality: "basic",
              }
            : useSeedreamText
              ? { prompt, aspectRatio: "3:4", quality: "basic" }
              : useGrok
                ? { prompt, aspectRatio: "2:3" }
                : useZImage
                  ? { prompt, aspectRatio: "3:4" }
                  : useQwenEdit
                    ? { prompt, image: promptAttachments[0]?.url }
                    : { prompt, attachments: attachmentsPayload };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(
          errorPayload?.details ||
            errorPayload?.error ||
            "Generation failed",
        );
      }
      const data = await response.json();
      const imageData = data?.image as string | undefined;
      if (!imageData) {
        throw new Error("No image returned");
      }
      const resolvedDataUrl = imageData.startsWith("data:")
        ? imageData
        : await (async () => {
            const imageResponse = await fetch(imageData);
            if (!imageResponse.ok) {
              throw new Error("Failed to load image");
            }
            const blob = await imageResponse.blob();
            return blobToDataUrl(blob);
          })();
      const mimeType = getMimeFromDataUrl(resolvedDataUrl);
      await addImagesToScene([{ dataUrl: resolvedDataUrl, mimeType }]);
      setPromptValue("");
      setPromptAttachments([]);
      setHasPrompted(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Image generation failed";
      showToast(message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

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

  useEffect(() => {
    if (!apiRef.current) {
      return;
    }
    const nextBackground = resolvedTheme === "dark" ? "#11151c" : "#ffffff";
    apiRef.current.updateScene({
      appState: {
        theme: resolvedTheme,
        viewBackgroundColor: nextBackground,
      },
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
    });

    appStateRef.current = api.getAppState();
    uiSnapshotRef.current = {
      activeTool: appStateRef.current?.activeTool?.type ?? "selection",
      currentItemStrokeColor: appStateRef.current?.currentItemStrokeColor ?? "#111827",
      currentItemBackgroundColor:
        appStateRef.current?.currentItemBackgroundColor ?? "transparent",
      currentItemStrokeWidth: appStateRef.current?.currentItemStrokeWidth ?? 1,
      currentItemFontSize: appStateRef.current?.currentItemFontSize ?? 20,
      zoom: appStateRef.current?.zoom?.value ?? 1,
    };
    setUiSnapshot(uiSnapshotRef.current);

    pushHistory(api.getSceneElements());

    return () => {
      unsubscribeChange();
      unsubscribePointer();
    };
  }, [apiReady, handleSceneChange, pushHistory]);

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
                    onClick={() => {
                      if (tool.id === "image") {
                        handleOpenFile();
                        apiRef.current?.setActiveTool({ type: "selection" });
                        return;
                      }
                      apiRef.current?.setActiveTool({ type: tool.id });
                    }}
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

      {selectedIds.length > 0 && !isMenuOpen && (
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
                    className={`h-8 w-8 rounded-full border transition ${
                      panelStrokeColor === color
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
                    className={`relative h-8 w-8 rounded-full border transition ${
                      panelFillColor === color
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
                    className={`flex h-9 flex-1 items-center justify-center rounded-full border text-xs font-semibold transition ${
                      panelStrokeWidth === width
                        ? "border-indigo-400 bg-indigo-50 text-indigo-500"
                        : "border-[color:var(--border)] text-[color:var(--text-secondary)]"
                    }`}
                  >
                    {width}px
                  </button>
                ))}
              </div>
            </div>

            {selectedElement?.type === "text" && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-faint)]">
                  Font size
                </p>
                <div className="mt-3 flex gap-2">
                  {fontSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleFontSize(size)}
                      className={`flex h-9 flex-1 items-center justify-center rounded-full border text-xs font-semibold transition ${
                        panelFontSize === size
                          ? "border-indigo-400 bg-indigo-50 text-indigo-500"
                          : "border-[color:var(--border)] text-[color:var(--text-secondary)]"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-faint)]">
                Actions
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
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

      <main className="relative flex h-[100svh] w-full flex-col pt-24 sm:pt-20">
        <div className="relative h-full w-full flex-1 overflow-hidden bg-[color:var(--canvas-bg)]">
          <Excalidraw
            excalidrawAPI={(api) => {
              apiRef.current = api;
              setApiReady((prev) => prev || true);
            }}
            initialData={initialData}
            UIOptions={uiOptions}
            renderTopRightUI={() => null}
            className="h-full w-full"
            style={{ height: "100%", width: "100%" }}
            viewModeEnabled={false}
            zenModeEnabled={false}
          />
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

      <div className="fixed bottom-6 left-1/2 z-30 w-[min(680px,92vw)] -translate-x-1/2">
        <PromptInput
          showMic
          layout="stacked"
          value={promptValue}
          onValueChange={setPromptValue}
          onSubmit={handleGenerateImage}
          loadingOverride={isGeneratingImage}
          onFocusChange={setIsPromptFocused}
          modelOptions={[
            { id: "gemini", label: "Nano Banana Pro" },
            { id: "zimage", label: "Z-Image" },
            { id: "grok", label: "Grok Image" },
            { id: "qwen", label: "Qwen Image" },
            { id: "seedream", label: "Seedream 4.5" },
          ]}
          selectedModel={generationModel}
          onSelectModel={(id) => {
            if (id === "zimage") {
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
        />
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
