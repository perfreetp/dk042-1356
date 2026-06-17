import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { PracticeProvider } from '@/store/PracticeContext';
import './app.scss';

function App(props) {
  useEffect(() => {});

  useDidShow(() => {});

  useDidHide(() => {});

  return <PracticeProvider>{props.children}</PracticeProvider>;
}

export default App;
