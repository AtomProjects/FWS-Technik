import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import FormError from "./FormError";
import { Mail, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { loginUser } from "@/lib/auth";

interface LoginFormProps {
  onSubmit?: (data: {
    email: string;
    password: string;
    rememberMe: boolean;
  }) => void;
  isLoading?: boolean;
  error?: string;
}

const LoginForm = ({
  onSubmit = () => {},
  isLoading: externalIsLoading = false,
  error = "",
}: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");

    if (!email) {
      setEmailError("Benutzername ist erforderlich");
      return;
    }
    if (!password) {
      setPasswordError("Passwort ist erforderlich");
      return;
    }

    setIsLoading(true);
    try {
      const user = await loginUser(email, password);
      setUser(user);
      onSubmit({ email, password, rememberMe });
      if (user.isTeacher) {
        navigate("/events");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      setPasswordError("Ungültige Anmeldedaten");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-[400px] p-4 sm:p-6 shadow-lg mx-4 sm:mx-0">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              FWS Technik
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Melden Sie sich an
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Benutzername</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="text"
                  placeholder="Geben Sie Ihren Benutzernamen ein"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <FormError message={emailError} visible={!!emailError} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Geben Sie Ihr Passwort ein"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <FormError message={passwordError} visible={!!passwordError} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) =>
                    setRememberMe(checked as boolean)
                  }
                />
                <Label htmlFor="remember" className="text-sm font-normal">
                  Angemeldet bleiben
                </Label>
              </div>
            </div>

            <FormError message={error} visible={!!error} />

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || externalIsLoading}
            >
              {isLoading || externalIsLoading ? "Anmeldung..." : "Anmelden"}
            </Button>
          </form>
        </div>
      </motion.div>
    </Card>
  );
};

export default LoginForm;
