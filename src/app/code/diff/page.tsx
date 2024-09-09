'use client';

import React, { useRef, useState } from 'react';

import { DiffEditor } from '../../../components/editor';
import { Space, Select, Button } from 'antd';
import s from './index.module.scss';

export default function Page() {
  return (
    <div className={s.pageContainer}>
      <DiffEditor />
    </div>
  );
}
