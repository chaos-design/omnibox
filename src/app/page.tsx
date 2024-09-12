'use client';

import React from 'react';

import { ExperimentTwoTone, CodeTwoTone, ShopTwoTone } from '@ant-design/icons';
import { Card, Col, Row, Typography } from 'antd';

const { Title, Paragraph } = Typography;

import s from './index.module.scss';

const features = [
  {
    icon: <ExperimentTwoTone />,
    title: 'Ciao',
    description: '💎Omnibox',
  },
  {
    icon: <CodeTwoTone />,
    title: '代码',
    description: '💻 支持多种编程语言的代码对比、格式化功能',
  },
  {
    icon: <ShopTwoTone />,
    title: 'JSON',
    description: '📝 JSON处理',
  },
];

const App: React.FC = () => {
  return (
    <div className={s.pageContainer}>
      <Typography>
        <Title>OmniBox</Title>

        <Paragraph>
          Omnibox是一个万能工具箱，包括并不限于代码美化、代码对比、JSON类的处理功能。
        </Paragraph>
      </Typography>
      <Row gutter={16}>
        {features.map((feature, index) => (
          <Col span={24 / features.length}>
            <Card
              bordered={false}
              title={
                <>
                  <span className={s.featureIcon}>{feature.icon}</span>
                  <span className={s.featureTitle}>{feature.title}</span>
                </>
              }
            >
              <div key={index} className={s.feature}>
                <div className={s.featureDescription}>
                  {feature.description}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default App;
