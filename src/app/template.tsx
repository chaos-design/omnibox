'use client';

import React, { useEffect, useState } from 'react';

import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { ConfigProvider, Button, Layout, Menu, theme, Space } from 'antd';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import Image from 'next/image';

import FooterContent from '../components/footer';

import themeConfig from './themeConfig';

import s from './index.module.scss';
import Toolbar from '../components/toolbar';
import type { AppConfigParams } from '../utils/config/app';
import { AppConfig } from '../utils/config/app';
import { MonacoEditor } from '../utils/config/editor';

import { menu } from '../utils/menu';
import { storageStringifyParseValue } from '../utils/storage/menu';

// console.log('menu', menu);

const { Header, Sider, Content, Footer } = Layout;

export default function Template({
  // @ts-ignore
  children,
}) {
  const cacheMenuStatus = storageStringifyParseValue();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(cacheMenuStatus.getItem());
  const [appConfig, setAppConfig] = useState<
    Partial<AppConfigParams> | undefined
  >({
    language: 'json',
  });
  const [editor, setEditor] = useState(undefined);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // useEffect(() => {
  //   const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  //     if ([
  //       '/json/stringify-parse'
  //     ].includes(pathname)) {
  //       event.preventDefault();
  //       event.returnValue = '';
  //     }
  //   };

  //   window.addEventListener('beforeunload', handleBeforeUnload);

  //   return () => {
  //     window.removeEventListener('beforeunload', handleBeforeUnload);
  //   };
  // }, []);

  return (
    <ConfigProvider theme={themeConfig}>
      <AppConfig.Provider
        value={{
          ...appConfig,
          setAppConfig,
        }}
      >
        <MonacoEditor.Provider
          value={{
            editor,
            setEditor,
          }}
        >
          <Layout className={s.layout}>
            <Header
              style={{
                color: '#fff',
                height: 64,
                paddingInline: 24,
                lineHeight: '64px',
                background: colorBgContainer,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <div className={s.logoContainer}>
                <Link
                  href="/"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Image
                    width={44}
                    height={44}
                    src="https://rain120.github.io/study-notes/img/chao.png"
                    alt=""
                    loader={({ src, width, quality }) =>
                      `https://rain120.github.io/study-notes/img/chao.png?w=${width}&q=${quality || 75}`
                    }
                    className={s.logo}
                  />
                  <div className={s.slogan}>Chaos</div>
                </Link>
              </div>

              <Space>
                <Button
                  type="link"
                  onClick={() => {
                    window.open(
                      'https://github.com/chaos-design/omnibox',
                      '_blank',
                    );
                  }}
                >
                  GitHub
                </Button>
              </Space>
            </Header>
            <Layout>
              <Sider trigger={null} collapsible collapsed={collapsed}>
                <Menu
                  mode="inline"
                  theme="dark"
                  defaultOpenKeys={menu.map((m) => m.key)}
                  // inlineCollapsed={false}
                  selectedKeys={[pathname]}
                  items={menu}
                />
                <div className={s.menuOp}>
                  <Button
                    type="text"
                    icon={
                      collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
                    }
                    onClick={() => {
                      const status = !collapsed;
                      cacheMenuStatus.setItem(status);
                      setCollapsed(status);
                    }}
                    style={{
                      fontSize: '16px',
                    }}
                  />
                </div>
              </Sider>
              <Layout>
                <Content
                  style={{
                    margin: 16,
                    padding: 24,
                    minHeight: 280,
                    background: colorBgContainer,
                    borderRadius: borderRadiusLG,
                  }}
                >
                  {children}
                </Content>
                <Footer
                  style={{
                    textAlign: 'center',
                  }}
                >
                  <FooterContent />
                </Footer>
              </Layout>
            </Layout>
          </Layout>
        </MonacoEditor.Provider>
      </AppConfig.Provider>
    </ConfigProvider>
  );
}
