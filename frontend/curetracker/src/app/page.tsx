"use client";

import { Typography } from "antd";
const { Title } = Typography;

export default function Home() {
  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center'
    }}>
      <Title level={1}>
        Добро пожаловать в CureTracker
      </Title>
    </div>
  );
}
