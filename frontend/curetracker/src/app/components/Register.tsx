"use client";
import { useState } from "react";
import { register } from "@/services/auth";
import { Input, Button, Typography } from 'antd';

export default function Register({ onRegister }: { onRegister: () => void }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await register(username, email, password);
      setSuccess(true);
      onRegister();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 300, margin: "0 auto", padding: 24, border: '1px solid #d9d9d9', borderRadius: 8 }}>
      <Typography.Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>Регистрация</Typography.Title>
      <form onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="Имя пользователя"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          style={{ marginBottom: 16 }}
        />
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
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
          Зарегистрироваться
        </Button>
      </form>
      {error && <Typography.Text type="danger" style={{ display: 'block', textAlign: 'center', marginTop: 16 }}>{error}</Typography.Text>}
      {success && <Typography.Text type="success" style={{ display: 'block', textAlign: 'center', marginTop: 16 }}>Успешно! Теперь войдите.</Typography.Text>}
    </div>
  );
}
