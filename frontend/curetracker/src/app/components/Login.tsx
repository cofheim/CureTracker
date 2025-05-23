"use client";
import { useState } from "react";
import { login } from "@/services/auth";
import { Input, Button, Typography } from 'antd';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const token = await login(username, password);
      localStorage.setItem("token", token);
      onLogin();
    } catch (err) {
      setError("auth failed");
    }
  };

  return (
    <div style={{ maxWidth: 300, margin: "0 auto", padding: 24, border: '1px solid #d9d9d9', borderRadius: 8 }}>
      <Typography.Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>Вход</Typography.Title>
      <form onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="Email"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          style={{ marginBottom: 16 }}
        />
        <Input.Password
          placeholder="Пароль"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ marginBottom: 24 }}
        />
        <Button type="primary" htmlType="submit" style={{ width: "100%" }}>
          Войти
        </Button>
      </form>
      {error && <Typography.Text type="danger" style={{ display: 'block', textAlign: 'center', marginTop: 16 }}>{error}</Typography.Text>}
    </div>
  );
}
