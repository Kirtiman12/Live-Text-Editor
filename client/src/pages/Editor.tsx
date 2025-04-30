import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Tabs } from "@/components/Tabs";
import { TabContent } from "@/components/TabContent";
import { LogOut, Users } from "lucide-react";
import Mainicon from "@/components/ui/Mainicon";

interface Tab {
  id: string;
  name: string;
  content: string;
}

interface TabCollaborator {
  tabId: string;
  users: string[];
}

const Editor = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "1", name: "Tab 1", content: "" },
  ]);
  const [activeTab, setActiveTab] = useState("1");
  const [role, setRole] = useState("");
  const [user, setUser] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState<TabCollaborator[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("role");
    const userId = localStorage.getItem("userId");
    console.log("Editor auth check:", { token, userRole, userId });

    if (!token || !userRole || !userId) {
      console.log("Redirecting to login: missing auth data");
      navigate("/login");
      return;
    }

    setRole(userRole);
    setUser(userId);

    const BACKEND_URL =
      process.env.NODE_ENV === "development"
        ? window.location.hostname === "localhost"
          ? "http://localhost:5000"
          : "http://192.168.29.197:5000"
        : "http://192.168.29.197:5000";

    const socketInstance = io(BACKEND_URL, {
      auth: { token, userId, role: userRole },
    });

    socketInstance.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to socket server");
      socketInstance.emit("joinTab", { tabId: "1", userId, name: "Tab 1" });
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connect_error:", error);
      toast({
        title: "Socket Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    });

    socketInstance.on("tabContentUpdate", ({ tabId, content }) => {
      console.log(`Received tabContentUpdate for tab ${tabId}:`, content);
      setTabs((prevTabs) =>
        prevTabs.map((tab) => (tab.id === tabId ? { ...tab, content } : tab))
      );
    });

    socketInstance.on("collaboratorsUpdate", ({ tabId, users }) => {
      console.log(`Received collaboratorsUpdate for tab ${tabId}:`, users);
      setCollaborators((prev) => {
        const existing = prev.find((c) => c.tabId === tabId);
        if (existing) {
          return prev.map((c) => (c.tabId === tabId ? { ...c, users } : c));
        }
        return [...prev, { tabId, users }];
      });
    });

    socketInstance.on("openTabsUpdate", ({ tabs }) => {
      console.log("Received openTabsUpdate:", tabs);
      setTabs((prevTabs) => {
        const newTabs = [...prevTabs];
        tabs.forEach(({ tabId, users, name }) => {
          const existingTab = newTabs.find((tab) => tab.id === tabId);
          if (!existingTab) {
            newTabs.push({
              id: tabId,
              name: name || `Tab ${newTabs.length + 1}`,
              content: "",
            });
          } else if (name && existingTab.name !== name) {
            existingTab.name = name;
          }
        });
        // Remove tabs not in activeTabs (e.g., closed tabs)
        return newTabs.filter((tab) =>
          tabs.some((t: { tabId: string }) => t.tabId === tab.id)
        );
      });
    });

    socketInstance.on("error", (error) => {
      console.error("Socket error:", error);
      toast({
        title: "Error",
        description: error.message || "Socket error occurred",
        variant: "destructive",
      });
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
      console.log("Disconnected from socket server");
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [navigate, toast]);

  const handleContentChange = (tabId: string, newContent: string) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === tabId ? { ...tab, content: newContent } : tab
      )
    );
    if (socket && isConnected) {
      console.log(`Emitting updateTabContent for tab ${tabId}:`, newContent);
      socket.emit("updateTabContent", { tabId, content: newContent });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    if (socket) socket.disconnect();
    navigate("/login");
  };

  const handleCreateTab = () => {
    const newTabId = Date.now().toString();
    const newTabName = `Tab ${tabs.length + 1}`;
    setTabs((prevTabs) => [
      ...prevTabs,
      { id: newTabId, name: newTabName, content: "" },
    ]);
    setActiveTab(newTabId);
    if (socket && isConnected) {
      console.log(`Emitting joinTab for new tab ${newTabId}`);
      socket.emit("joinTab", {
        tabId: newTabId,
        userId: user,
        name: newTabName,
      });
    }
  };

  const handleCloseTab = (tabId: string) => {
    if (tabs.length === 1) return;
    if (socket && isConnected) {
      console.log(`Emitting closeTab for tab ${tabId}`);
      socket.emit("closeTab", { tabId, userId: user });
    }
    setTabs((prevTabs) => {
      const remainingTabs = prevTabs.filter((tab) => tab.id !== tabId);
      return remainingTabs;
    });
    if (activeTab === tabId) {
      const remainingTabs = tabs.filter((tab) => tab.id !== tabId);
      setActiveTab(remainingTabs[0].id);
    }
  };

  const handleTabClick = (tabId: string) => {
    if (tabId !== activeTab) {
      if (socket && isConnected) {
        console.log(`Emitting leaveTab for tab ${activeTab}`);
        socket.emit("leaveTab", { tabId: activeTab, userId: user });
        console.log(`Emitting joinTab for tab ${tabId}`);
        socket.emit("joinTab", {
          tabId,
          userId: user,
          name: tabs.find((tab) => tab.id === tabId)?.name || `Tab ${tabId}`,
        });
      }
      setActiveTab(tabId);
    }
  };

  const handleTabRename = (tabId: string, newName: string) => {
    setTabs((prevTabs) => {
      const tabIndex = prevTabs.findIndex((tab) => tab.id === tabId);
      if (tabIndex === -1) return prevTabs;
      const newTabs = [...prevTabs];
      const finalName = newName.trim() || `Tab ${tabIndex + 1}`;
      newTabs[tabIndex] = { ...newTabs[tabIndex], name: finalName };
      if (socket && isConnected) {
        console.log(`Emitting renameTab for tab ${tabId}: ${finalName}`);
        socket.emit("renameTab", { tabId, name: finalName, userId: user });
      }
      return newTabs;
    });
  };

  const handleTabsReorder = (newTabs: Tab[]) => {
    setTabs(newTabs);
    if (socket && isConnected) {
      newTabs.forEach((tab, index) => {
        if (tab.name.startsWith("Tab ") && tab.name !== `Tab ${index + 1}`) {
          const newName = `Tab ${index + 1}`;
          console.log(
            `Emitting renameTab for reordered tab ${tab.id}: ${newName}`
          );
          socket.emit("renameTab", {
            tabId: tab.id,
            name: newName,
            userId: user,
          });
        }
      });
    }
  };

  const getActiveCollaborators = () => {
    const tabCollaborators = collaborators.find((c) => c.tabId === activeTab);
    if (!tabCollaborators || tabCollaborators.users.length <= 1) {
      return "No collaborators";
    }
    const otherUsers = tabCollaborators.users.filter((u) => u !== user);
    return otherUsers.length === 0
      ? "No collaborators"
      : `Active: ${otherUsers.join(", ")}`;
  };

  if (!role || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-[#08031D] text-white">
      <header className="h-[10%] md:h-[8%] border-b border-[08031D] p-3">
        <div className="flex justify-center items-center h-5/6">
          <div className="w-[60%] md:w-[50%] flex justify-start items-center h-full">
            <div className="flex scale-[0.3] md:scale-[0.5] translate-x-[-2rem] md:translate-x-0">
              <Mainicon />
            </div>
            <h1 className="text-2xl md:text-4xl font-Mauline translate-x-[-3.5rem] md:translate-x-0">
              TexT {"  "} Pulse
            </h1>
          </div>
          <div className="w-[40%] md:w-[50%] flex justify-end items-center gap-2 h-full">
            <div className="text-sm md:text-base">
              <span className="hidden md:inline-block mr-2">Logged in as</span>
              <span className="font-bold">{role}</span>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="p-2 h-9"
              aria-label="Logout"
            >
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </header>
      <main className="flex flex-col h-[90%] md:h-[92%]">
        <div className="flex items-center bg-[#08031D] border-b border-[08031D] p-1">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabClick={handleTabClick}
            onTabClose={handleCloseTab}
            onTabsReorder={handleTabsReorder}
            onTabRename={handleTabRename}
          />
          <Button
            onClick={handleCreateTab}
            size="sm"
            variant="ghost"
            className="ml-2 h-8 px-2 py-1 text-gray-300 hover:text-black"
          >
            + New Tab
          </Button>
        </div>
        <div className="flex-1 overflow-hidden relative">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`h-full ${activeTab === tab.id ? "block" : "hidden"}`}
            >
              <TabContent
                tabId={tab.id}
                content={tab.content}
                onChange={(newContent) =>
                  handleContentChange(tab.id, newContent)
                }
                isActive={activeTab === tab.id}
              />
            </div>
          ))}
          <div className="absolute bottom-2 right-4 flex items-center gap-2 bg-[#2D2D2D] py-1 px-3 rounded-md text-xs text-gray-300 select-none">
            <Users size={14} />
            <span>{getActiveCollaborators()}</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Editor;
