"use client"

import { useCallback, useEffect, useState } from "react"
import type { Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Icons ---
import { PilcrowIcon } from "@/components/tiptap-icons/pilcrow-icon"

// --- Lib ---
import { isNodeInSchema, isNodeTypeSelected } from "@/lib/tiptap-utils"

export const TEXT_SHORTCUT_KEY = "ctrl+alt+0"

/**
 * Configuration for the text (paragraph) functionality
 */
export interface UseTextConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * Whether the button should hide when unavailable.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Callback function called after a successful conversion.
   */
  onConverted?: () => void
}

/**
 * Checks if text conversion can be performed
 */
export function canConvertToText(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!isNodeInSchema("paragraph", editor)) return false
  if (isNodeTypeSelected(editor, ["image"])) return false
  return editor.can().clearNodes() || editor.can().unsetAllMarks()
}

/**
 * Checks if the current selection is already plain text (paragraph with no marks)
 */
export function isPlainText(editor: Editor | null): boolean {
  if (!editor) return false

  const isInParagraph = editor.isActive("paragraph")
  if (!isInParagraph) return false

  // Check if any marks are active
  const { from, to } = editor.state.selection
  let hasMarks = false
  editor.state.doc.nodesBetween(from, to, (node) => {
    if (node.marks && node.marks.length > 0) {
      hasMarks = true
    }
  })

  return !hasMarks
}

/**
 * Converts the current block to plain text paragraph and strips all marks
 */
export function convertToText(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!canConvertToText(editor)) return false

  try {
    editor.chain().focus().clearNodes().unsetAllMarks().run()
    return true
  } catch {
    return false
  }
}

/**
 * Determines if the text button should be shown
 */
export function shouldShowButton(props: {
  editor: Editor | null
  hideWhenUnavailable: boolean
}): boolean {
  const { editor, hideWhenUnavailable } = props

  if (!editor || !editor.isEditable) return false
  if (!hideWhenUnavailable) return true
  if (!isNodeInSchema("paragraph", editor)) return false

  return canConvertToText(editor)
}

/**
 * Custom hook that provides "convert to text" functionality for Tiptap editor.
 * Uses the built-in paragraph extension to convert any block to plain text
 * and strip all inline marks.
 */
export function useText(config?: UseTextConfig) {
  const {
    editor: providedEditor,
    hideWhenUnavailable = false,
    onConverted,
  } = config || {}

  const { editor } = useTiptapEditor(providedEditor)
  const [isVisible, setIsVisible] = useState<boolean>(true)
  const canConvert = canConvertToText(editor)
  const isActive = isPlainText(editor)

  useEffect(() => {
    if (!editor) return

    const handleSelectionUpdate = () => {
      setIsVisible(shouldShowButton({ editor, hideWhenUnavailable }))
    }

    handleSelectionUpdate()

    editor.on("selectionUpdate", handleSelectionUpdate)

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate)
    }
  }, [editor, hideWhenUnavailable])

  const handleConvert = useCallback(() => {
    if (!editor) return false

    const success = convertToText(editor)
    if (success) {
      onConverted?.()
    }
    return success
  }, [editor, onConverted])

  return {
    isVisible,
    isActive,
    handleConvert,
    canConvert,
    label: "Text",
    shortcutKeys: TEXT_SHORTCUT_KEY,
    Icon: PilcrowIcon,
  }
}
