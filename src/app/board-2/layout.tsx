import "@excalidraw/excalidraw/index.css";
import { requireAuth } from "@/lib/auth";

export default async function Board2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Require authentication to access the canvas
  await requireAuth("/board-2");

  return children;
}
