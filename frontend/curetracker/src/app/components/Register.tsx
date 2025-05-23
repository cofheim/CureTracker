"use client";
import { useState } from "react";
import { register } from "@/services/auth";
import { Input, Button, Typography, Modal } from 'antd';

const SPECIAL_EMAIL = "christina.brysina@yandex.ru";
const SPECIAL_MESSAGE = "Привет! Я создал это приложение специально для тебя, ведь я очень сильно тебя люблю! Я поздравляю тебя с наступающим днём рождения и желаю тебе оставаться такой же самой лучшей в мире какая ты есть сейчас (и становиться только лучше)";

export default function Register({ onRegister }: { onRegister: () => void }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showSpecialMessage, setShowSpecialMessage] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    try {
      await register(username, email, password);
      setSuccess(true);
      if (email.toLowerCase() === SPECIAL_EMAIL.toLowerCase()) {
        setShowSpecialMessage(true);
      } else {
        onRegister();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSpecialMessageOk = () => {
    setShowSpecialMessage(false);
    onRegister();
  };

  return (
    <>
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
            style={{ marginBottom: 16 }}
          />
          <Input.Password
            placeholder="Подтвердите пароль"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            style={{ marginBottom: 24 }}
          />
          <Button type="primary" htmlType="submit" style={{ width: "100%" }}>
            Зарегистрироваться
          </Button>
        </form>
        {error && <Typography.Text type="danger" style={{ display: 'block', textAlign: 'center', marginTop: 16 }}>{error}</Typography.Text>}
        {success && <Typography.Text type="success" style={{ display: 'block', textAlign: 'center', marginTop: 16 }}>Успешно!</Typography.Text>}
      </div>

      <Modal
        title="Специальное сообщение"
        open={showSpecialMessage}
        onOk={handleSpecialMessageOk}
        onCancel={handleSpecialMessageOk}
        cancelButtonProps={{ style: { display: 'none' } }}
        okText="OK"
        width={800}
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '20px' }}>{SPECIAL_MESSAGE}</p>
          <img 
            src="/special_message.jpg" 
            alt="Special message" 
            style={{ 
              maxWidth: '100%', 
              height: 'auto',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }} 
          />
        </div>
      </Modal>
    </>
  );
}
