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

    // Initialize socket connection
    const socketInstance = io("http://localhost:5000", {
      auth: { token, userId, role: userRole },
    });

    socketInstance.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to socket server");
      socketInstance.emit("joinTab", { tabId: "1", userId });
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
      setTabs((prevTabs) =>
        prevTabs.map((tab) => (tab.id === tabId ? { ...tab, content } : tab))
      );
    });

    socketInstance.on("collaboratorsUpdate", ({ tabId, users }) => {
      setCollaborators((prev) => {
        const existing = prev.find((c) => c.tabId === tabId);
        if (existing) {
          return prev.map((c) => (c.tabId === tabId ? { ...c, users } : c));
        }
        return [...prev, { tabId, users }];
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
      socket.emit("joinTab", { tabId: newTabId, userId: user });
    }
  };

  const handleCloseTab = (tabId: string) => {
    if (tabs.length === 1) return;
    if (socket && isConnected) {
      socket.emit("leaveTab", { tabId, userId: user });
    }
    setTabs((prevTabs) => prevTabs.filter((tab) => tab.id !== tabId));
    if (activeTab === tabId) {
      const remainingTabs = tabs.filter((tab) => tab.id !== tabId);
      setActiveTab(remainingTabs[0].id);
    }
  };

  const handleTabsReorder = (newTabs: Tab[]) => {
    setTabs(newTabs);
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
          <div className="w-[50%] flex justify-start items-center h-full">
            <div className="flex scale-[0.5] ">
              <Mainicon />
            </div>
            <h1 className="text-xl md:text-4xl font-Mauline">
              TexT {"  "} Pulse
            </h1>
          </div>
          <div className="w-[50%] flex justify-end items-center gap-2 h-full">
            <div className="text-sm md:text-base">
              <span className="hidden md:inline-block mr-2">Logged in as</span>
              <span className="font-bold ">{role}</span>
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
            onTabClick={setActiveTab}
            onTabClose={handleCloseTab}
            onTabsReorder={handleTabsReorder}
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
