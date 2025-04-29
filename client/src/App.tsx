import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Editor from "./pages/Editor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const isAuthenticated = () => {
    const token = localStorage.getItem("token");
    console.log("isAuthenticated:", token !== null, { token });
    return token !== null;
  };

  const ProtectedRoute = ({ element }: { element: JSX.Element }) => {
    const [isAuth, setIsAuth] = useState(isAuthenticated());
    useEffect(() => {
      const timer = setTimeout(() => {
        setIsAuth(isAuthenticated());
      }, 100);
      return () => clearTimeout(timer);
    }, []);
    console.log("ProtectedRoute isAuth:", isAuth);
    return isAuth ? element : <Navigate to="/login" />;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ProtectedRoute element={<Editor />} />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
