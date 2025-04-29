import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  name: string;
  content: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabsReorder?: (newTabs: Tab[]) => void;
}

export const Tabs = ({
  tabs,
  activeTab,
  onTabClick,
  onTabClose,
  onTabsReorder,
}: TabsProps) => {
  const [draggingTab, setDraggingTab] = useState<string | null>(null);
  const tabRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [tabWidths, setTabWidths] = useState<Map<string, number>>(new Map());
  const [showScrollButtons, setShowScrollButtons] = useState(false);

  // Update tab widths on resize
  useEffect(() => {
    const updateTabWidths = () => {
      const newWidths = new Map<string, number>();
      tabRefs.current.forEach((el, tabId) => {
        newWidths.set(tabId, el.getBoundingClientRect().width);
      });
      setTabWidths(newWidths);
    };

    updateTabWidths();

    const checkOverflow = () => {
      if (tabsContainerRef.current) {
        const container = tabsContainerRef.current;
        setShowScrollButtons(container.scrollWidth > container.clientWidth);
      }
    };

    window.addEventListener("resize", () => {
      updateTabWidths();
      checkOverflow();
    });
    checkOverflow();

    return () => {
      window.removeEventListener("resize", updateTabWidths);
    };
  }, [tabs]);

  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggingTab(tabId);
    e.dataTransfer.effectAllowed = "move";
    // Add a ghost image that's transparent
    const img = new Image();
    img.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();
    if (draggingTab && draggingTab !== targetTabId) {
      const draggedTabIndex = tabs.findIndex((t) => t.id === draggingTab);
      const targetTabIndex = tabs.findIndex((t) => t.id === targetTabId);

      if (draggedTabIndex !== -1 && targetTabIndex !== -1) {
        const newTabsOrder = [...tabs];
        const [removedTab] = newTabsOrder.splice(draggedTabIndex, 1);
        newTabsOrder.splice(targetTabIndex, 0, removedTab);

        // Update tabs order through callback
        if (onTabsReorder) {
          onTabsReorder(newTabsOrder);
        }
      }
    }
    setDraggingTab(null);
  };

  const handleScrollLeft = () => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: -100, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: 100, behavior: "smooth" });
    }
  };

  return (
    <div className="flex items-center flex-1 overflow-hidden">
      {showScrollButtons && (
        <button
          className="px-1 text-gray-400 hover:text-white focus:outline-none"
          onClick={handleScrollLeft}
        >
          ◀
        </button>
      )}

      <div
        ref={tabsContainerRef}
        className="flex overflow-x-auto scrollbar-hide flex-1  gap-2 pl-2"
      >
        {tabs.map((tab) => (
          <div
            key={tab.id}
            ref={(el) => {
              if (el) tabRefs.current.set(tab.id, el);
            }}
            className={cn(
              "flex items-center px-3 py-1.5 border-r border-[08031D] min-w-[100px] max-w-[200px]",
              "cursor-pointer select-none transition-colors duration-200",
              draggingTab === tab.id ? "opacity-50" : "opacity-100",
              activeTab === tab.id
                ? "bg-[#191C4E] rounded-sm text-white border-none"
                : "bg-[#191C4E] rounded-sm text-gray-400 hover:text-gray-200 border-none"
            )}
            draggable="true"
            onDragStart={(e) => handleDragStart(e, tab.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, tab.id)}
            onClick={() => onTabClick(tab.id)}
          >
            <div className="truncate flex-1">{tab.name}</div>
            <button
              className="ml-2 text-gray-500 hover:text-white focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {showScrollButtons && (
        <button
          className="px-1 text-gray-400 hover:text-white focus:outline-none"
          onClick={handleScrollRight}
        >
          ▶
        </button>
      )}
    </div>
  );
};
