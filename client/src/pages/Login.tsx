import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (!data.token || !data.userId) {
          toast({
            title: "Login Failed",
            description:
              "Invalid response from server: missing token or userId",
            variant: "destructive",
          });
          return;
        }
        console.log("Login response:", data);
        console.log("Storing in localStorage:", {
          token: data.token,
          role,
          userId: data.userId,
        });
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", role);
        localStorage.setItem("userId", data.userId);
        setTimeout(() => navigate("/"), 0); // Ensure localStorage is written
      } else {
        toast({
          title: "Login Failed",
          description: data.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: "Server error. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060217] flex items-center justify-center p-4 bg-gradient-to-br from-[#000000a8] to-[#08031D] select-none">
      <Card className="w-full max-w-md bg-[#191C4E] border-[#3C3C3C] shadow-xl text-white">
        <CardHeader className="text-center pb-6">
          <div className="text-5xl font-bold text-white font-Mauline flex justify-center items-center max-w-4xl h-full gap-12 ">
            TexT{"  "}
            Pulse
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Role</label>
              <Select value={role} onValueChange={setRole} required>
                <SelectTrigger className="bg-black/45 border-[#444444] text-white">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent className="bg-black border-[#444444] text-white">
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Dummy">Dummy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/45 border-[#444444] text-white"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#0E639C] hover:bg-[#1177bb] text-white transition-transform active:scale-95"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
