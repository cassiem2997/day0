import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import styles from './ExchangeAlerts.module.css';
import { getFxAlerts, type FxAlert } from '../../api/fx';
import { useAuth } from '../../auth/useAuth';

export interface ExchangeAlertsRef {
  refreshAlerts: () => Promise<void>;
}

const ExchangeAlerts = forwardRef<ExchangeAlertsRef>((props, ref) => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<FxAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAlerts = async () => {
    if (!user?.userId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await getFxAlerts(user.userId);

      if (response.success) {
        setAlerts(response.data);
      } else {
        setError("알림 내역을 가져올 수 없습니다.");
      }
    } catch (err: any) {
      console.error("알림 내역 조회 오류:", err);
      setError(err?.message || "알림 내역 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.userId) {
      refreshAlerts();
    }
  }, [user?.userId]);

  // 부모 컴포넌트에서 호출할 수 있도록 ref로 노출
  useImperativeHandle(ref, () => ({
    refreshAlerts,
  }));

  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    const dateStr = date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const timeStr = date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    return { date: dateStr, time: timeStr };
  };

  const formatDirection = (direction: string) => {
    switch (direction) {
      case 'LTE':
        return '이하';
      case 'GTE':
        return '이상';
      default:
        return direction;
    }
  };

  if (loading) {
    return (
      <section className={styles.exchangeAlertsSection}>
        <div className={styles.alertsContainer}>
          <h2 className={styles.alertsTitle}>환율 알림 내역</h2>
          <div className={styles.loading}>
            <p>알림 내역을 불러오는 중...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.exchangeAlertsSection}>
        <div className={styles.alertsContainer}>
          <h2 className={styles.alertsTitle}>환율 알림 내역</h2>
          <div className={styles.error}>
            <p>{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.exchangeAlertsSection}>
      <div className={styles.alertsContainer}>
        <h2 className={styles.alertsTitle}>환율 알림 내역</h2>
        
        {alerts.length > 0 ? (
          <div className={styles.alertsTable}>
            <div className={styles.tableHeader}>
              <div className={styles.headerCell}>일시</div>
              <div className={styles.headerCell}>통화</div>
              <div className={styles.headerCell}>목표환율</div>
              <div className={styles.headerCell}>조건</div>
              <div className={styles.headerCell}>상태</div>
            </div>
            
            <div className={styles.tableBody}>
              {alerts.map((alert, index) => {
                const { date, time } = formatDateTime(alert.createdAt); // created -> createdAt
                return (
                  <div key={index} className={styles.tableRow}>
                    <div className={styles.dateCell}>
                      <div className={styles.date}>{date}</div>
                      <div className={styles.time}>{time}</div>
                    </div>
                    <div className={styles.currencyCell}>
                      {alert.baseCcy} 1 = {alert.targetRate.toLocaleString("ko-KR")} {alert.currency}
                    </div>
                    <div className={styles.rateCell}>
                      {alert.targetRate.toLocaleString("ko-KR")} {alert.currency}
                    </div>
                    <div className={styles.directionCell}>
                      {formatDirection(alert.direction)}
                    </div>
                    <div className={styles.statusCell}>
                      <span className={`${styles.status} ${alert.active ? styles.active : styles.inactive}`}>
                        {alert.active ? '활성' : '비활성'} {/* isActive -> active */}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={styles.noData}>
            <p>등록된 환율 알림이 없습니다.</p>
          </div>
        )}
      </div>
    </section>
  );
});

export default ExchangeAlerts;
