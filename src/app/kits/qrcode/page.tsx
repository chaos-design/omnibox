'use client';

import React, { useState } from 'react';
import {
  Card,
  QRCode,
  Input,
  Button,
  QRCodeProps,
  Segmented,
  Space,
  Typography,
} from 'antd';
import s from './index.module.scss';
import {
  downloadCanvasQRCode,
  downloadSvgQRCode,
} from '../../../utils/tools/download';

export default function Page() {
  const [qrValue, setQRValue] = useState(
    'https://chaos-design.github.io/dumi-theme-chaos/',
  );
  const [renderType, setRenderType] =
    React.useState<QRCodeProps['type']>('canvas');
  const [level, setLevel] = useState<QRCodeProps['errorLevel']>('L');

  const generateQRCode = () => {
    if (qrValue.trim()) {
      setQRValue(qrValue);
    }
  };

  return (
    <div className={s.pageContainer}>
      <Card
        title="QR Code Generator"
        extra={
          <Button
            type="primary"
            onClick={() => {
              renderType === 'canvas'
                ? downloadCanvasQRCode('zc-qr-code')
                : downloadSvgQRCode('zc-qr-code');
            }}
          >
            Download
          </Button>
        }
      >
        <Space id="zc-qr-code" direction="vertical">
          <Space>
            {qrValue && (
              <QRCode
                type={renderType}
                value={qrValue}
                errorLevel={level}
                bgColor="#fff"
                icon={'https://rain120.github.io/study-notes/img/chao.png'}
              />
            )}
            <Space direction="vertical" size={8}>
              <Space align="center">
                <Typography.Text>QR类型</Typography.Text>
                <Segmented
                  options={['canvas', 'svg']}
                  value={renderType}
                  onChange={setRenderType}
                />
              </Space>
              <Space align="center">
                <Typography.Text>纠错比例</Typography.Text>
                <Segmented
                  options={['L', 'M', 'Q', 'H']}
                  value={level}
                  onChange={setLevel}
                />
              </Space>
            </Space>
          </Space>
          <Input.TextArea
            rows={4}
            placeholder="Enter URL or text"
            value={qrValue}
            onChange={(e) => setQRValue(e.target.value)}
            onPressEnter={generateQRCode}
            style={{ marginBottom: 16 }}
          />
        </Space>
      </Card>
    </div>
  );
}
