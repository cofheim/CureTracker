"use client";
import { useState } from "react";
import Login from "./Login";
import Register from "./Register";

export default function AuthFormSwitcher({ onAuth }: { onAuth: () => void }) {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <div style={{ 
      maxWidth: 350, 
      margin: "0 auto",
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)"
      }}>
      {showLogin ? (
        <>
          <Login onLogin={onAuth} />
          <p style={{ textAlign: "center", marginTop: 16 }}>
            Нет аккаунта?{" "}
            <button type="button" onClick={() => setShowLogin(false)} style={{ color: "#1890ff", background: "none", border: "none", cursor: "pointer" }}>
              Зарегистрироваться
            </button>
          </p>
        </>
      ) : (
        <>
          <Register onRegister={() => setShowLogin(true)} />
          <p style={{ textAlign: "center", marginTop: 16 }}>
            Уже есть аккаунт?{" "}
            <button type="button" onClick={() => setShowLogin(true)} style={{ color: "#1890ff", background: "none", border: "none", cursor: "pointer" }}>
              Войти
            </button>
          </p>
        </>
      )}
    </div>
  );
}
