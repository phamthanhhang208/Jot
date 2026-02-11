import { forwardRef, useCallback } from "react"

// --- Tiptap UI ---
import type { UseTextConfig } from "@/components/tiptap-ui/text-button"
import { useText } from "@/components/tiptap-ui/text-button"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Lib ---
import { parseShortcutKeys } from "@/lib/tiptap-utils"

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button"
import { Button } from "@/components/tiptap-ui-primitive/button"
import { Badge } from "@/components/tiptap-ui-primitive/badge"

export interface TextButtonProps
  extends Omit<ButtonProps, "type">,
    UseTextConfig {
  /**
   * Optional text to display alongside the icon.
   */
  text?: string
  /**
   * Optional show shortcut keys in the button.
   * @default false
   */
  showShortcut?: boolean
}

export function TextShortcutBadge({
  shortcutKeys,
}: {
  shortcutKeys?: string
}) {
  if (!shortcutKeys) return null
  return <Badge>{parseShortcutKeys({ shortcutKeys })}</Badge>
}

/**
 * Button component for converting content to plain text in a Tiptap editor.
 * Uses the built-in paragraph extension — no paid extensions needed.
 */
export const TextButton = forwardRef<HTMLButtonElement, TextButtonProps>(
  (
    {
      editor: providedEditor,
      text,
      hideWhenUnavailable = false,
      onConverted,
      showShortcut = false,
      onClick,
      children,
      ...buttonProps
    },
    ref
  ) => {
    const { editor } = useTiptapEditor(providedEditor)
    const {
      isVisible,
      canConvert,
      isActive,
      handleConvert,
      label,
      shortcutKeys,
      Icon,
    } = useText({
      editor,
      hideWhenUnavailable,
      onConverted,
    })

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        handleConvert()
      },
      [handleConvert, onClick]
    )

    if (!isVisible) {
      return null
    }

    return (
      <Button
        type="button"
        data-style="ghost"
        data-active-state={isActive ? "on" : "off"}
        role="button"
        tabIndex={-1}
        disabled={!canConvert}
        data-disabled={!canConvert}
        aria-label={label}
        aria-pressed={isActive}
        tooltip="Text"
        onClick={handleClick}
        {...buttonProps}
        ref={ref}
      >
        {children ?? (
          <>
            <Icon className="tiptap-button-icon" />
            {text && <span className="tiptap-button-text">{text}</span>}
            {showShortcut && (
              <TextShortcutBadge shortcutKeys={shortcutKeys} />
            )}
          </>
        )}
      </Button>
    )
  }
)

TextButton.displayName = "TextButton"
