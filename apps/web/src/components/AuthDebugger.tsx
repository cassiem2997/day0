import React, { useState, useEffect } from 'react';
import { me } from '../api/user';

export default function AuthDebugger() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    updateDebugInfo();
  }, []);

  const updateDebugInfo = () => {
    const info = {
      cookies: document.cookie,
      localStorage: {
        accessToken: localStorage.getItem('accessToken'),
      },
      sessionStorage: {
        accessToken: sessionStorage.getItem('accessToken'),
      },
      timestamp: new Date().toISOString(),
    };
    setDebugInfo(info);
  };

  const testAuth = async () => {
    try {
      const result = await me();
      alert(`인증 성공: ${JSON.stringify(result)}`);
    } catch (error: any) {
      alert(`인증 실패: ${error.message}`);
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          padding: '10px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        🔍 Auth Debug
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '400px',
      maxHeight: '500px',
      backgroundColor: 'white',
      border: '1px solid #ccc',
      borderRadius: '5px',
      padding: '15px',
      zIndex: 9999,
      overflow: 'auto',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0 }}>🔍 인증 디버그</h3>
        <button onClick={() => setIsVisible(false)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <button onClick={updateDebugInfo} style={{ marginRight: '10px', padding: '5px 10px' }}>🔄 새로고침</button>
        <button onClick={testAuth} style={{ padding: '5px 10px' }}>🧪 인증 테스트</button>
      </div>

      <div style={{ fontSize: '12px' }}>
        <h4>🍪 쿠키:</h4>
        <pre style={{ backgroundColor: '#f5f5f5', padding: '5px', overflow: 'auto', maxHeight: '100px' }}>
          {debugInfo.cookies || '쿠키 없음'}
        </pre>

        <h4>🔑 localStorage:</h4>
        <pre style={{ backgroundColor: '#f5f5f5', padding: '5px', overflow: 'auto', maxHeight: '100px' }}>
          {JSON.stringify(debugInfo.localStorage, null, 2)}
        </pre>

        <h4>📱 sessionStorage:</h4>
        <pre style={{ backgroundColor: '#f5f5f5', padding: '5px', overflow: 'auto', maxHeight: '100px' }}>
          {JSON.stringify(debugInfo.sessionStorage, null, 2)}
        </pre>

        <h4>⏰ 마지막 업데이트:</h4>
        <div>{debugInfo.timestamp}</div>
      </div>
    </div>
  );
}



