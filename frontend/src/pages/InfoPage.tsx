import { useState } from 'react';
import { SessionSelector } from '../components/SessionSelector';
import { SessionExtras } from '../components/SessionExtras';

export function InfoPage() {
  const [sessionKey, setSessionKey] = useState(0);
  const [meetingKey, setMeetingKey] = useState(0);
  const [sessionName, setSessionName] = useState('');

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Карточка выбора сессии */}
      <div className="f1-card">
        <h2 className="f1-header-text">Выбор сессии</h2>
        <SessionSelector 
          onSessionSelected={(key, mKey, name) => {
            setSessionKey(key);
            setMeetingKey(mKey);
            setSessionName(name);
          }} 
        />
      </div>

      {/* Карточка с дополнительной информацией */}
      {sessionKey > 0 && (
        <div className="f1-card">
          <SessionExtras 
            sessionKey={sessionKey} 
            sessionName={sessionName} 
            meetingKey={meetingKey} 
          />
        </div>
      )}
    </div>
  );
}