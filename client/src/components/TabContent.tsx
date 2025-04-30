import { useRef, useEffect } from "react";

interface TabContentProps {
  tabId: string;
  content: string;
  onChange: (content: string) => void;
  isActive: boolean; // New prop to indicate if the tab is active
}

export const TabContent = ({
  tabId,
  content,
  onChange,
  isActive,
}: TabContentProps) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Function to move cursor to the end
  const moveCursorToEnd = (editor: HTMLDivElement) => {
    const selection = window.getSelection();
    if (!selection || !editor.firstChild) return;

    try {
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
      console.log("Cursor moved to end for tab:", tabId);
    } catch (e) {
      console.warn("Could not move cursor to end:", e);
    }
  };

  // Initialize the editor when component mounts or tabId changes
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // Set initial content
    console.log(
      "Initializing editor for tab:",
      tabId,
      "with content:",
      JSON.stringify(content)
    );
    editor.textContent = content;

    // Make the editor editable
    editor.contentEditable = "true";

    // Only focus and move cursor for active tab
    if (isActive) {
      editor.focus();
      moveCursorToEnd(editor);
    }

    // Handle input events
    const handleInput = () => {
      const newContent = editor.textContent || "";
      const selection = window.getSelection();
      const cursorPos = selection?.anchorOffset;
      console.log(
        "Input event for tab:",
        tabId,
        "new content:",
        JSON.stringify(newContent),
        "cursor position:",
        cursorPos
      );
      onChange(newContent);
    };

    editor.addEventListener("input", handleInput);

    return () => {
      editor.removeEventListener("input", handleInput);
    };
  }, [tabId, onChange, isActive]);

  // Update editor content when content prop changes
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || editor.textContent === content) return;

    console.log(
      "Updating editor content for tab:",
      tabId,
      "new content:",
      JSON.stringify(content)
    );
    editor.textContent = content;

    // Only move cursor for active tab
    if (isActive) {
      moveCursorToEnd(editor);
    }
  }, [content, tabId, isActive]);

  return (
    <div className="h-full flex flex-col dir-ltr text-left" lang="en" dir="ltr">
      <div
        ref={editorRef}
        className="flex-1 outline-none font-mono text-base leading-relaxed whitespace-pre-wrap bg-[#08031D] text-gray-200 p-6 overflow-y-auto dir-ltr text-left"
        spellCheck="false"
        style={{ direction: "ltr", textAlign: "left" }}
      />
    </div>
  );
};
