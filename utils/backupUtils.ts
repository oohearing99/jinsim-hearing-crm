// 데이터 백업 및 복구 유틸리티

export interface BackupData {
  version: string;
  timestamp: string;
  data: {
    customers: any[];
    visits: any[];
    questionnaires: Record<string, any>;
    pureToneTests: Record<string, any>;
    speechTests: Record<string, any>;
    haSessions: Record<string, any>;
    preferences: Record<string, any>;
  };
}

/**
 * localStorage의 모든 데이터를 백업 객체로 추출
 */
export const createBackup = (): BackupData => {
  const customers: any[] = [];
  const visits: any[] = [];
  const questionnaires: Record<string, any> = {};
  const pureToneTests: Record<string, any> = {};
  const speechTests: Record<string, any> = {};
  const haSessions: Record<string, any> = {};
  const preferences: Record<string, any> = {};

  // localStorage 전체 스캔
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    try {
      const value = localStorage.getItem(key);
      if (!value) continue;

      // 고객 데이터
      if (key === 'jinsim_customers') {
        customers.push(...JSON.parse(value));
      }
      // 방문 데이터
      else if (key === 'jinsim_visits') {
        visits.push(...JSON.parse(value));
      }
      // 설문지 데이터 (q_로 시작)
      else if (key.startsWith('q_')) {
        questionnaires[key] = JSON.parse(value);
      }
      // 순음검사 데이터 (pta_로 시작)
      else if (key.startsWith('pta_')) {
        pureToneTests[key] = JSON.parse(value);
      }
      // 어음검사 데이터 (speech_로 시작)
      else if (key.startsWith('speech_')) {
        speechTests[key] = JSON.parse(value);
      }
      // HA 프로토콜 세션 데이터 (hasession_으로 시작)
      else if (key.startsWith('hasession_')) {
        haSessions[key] = JSON.parse(value);
      }
      // 환경설정 (jinsim_pref_로 시작)
      else if (key.startsWith('jinsim_pref_')) {
        preferences[key] = value; // 문자열로 저장
      }
    } catch (error) {
      console.error(`Error backing up key ${key}:`, error);
    }
  }

  return {
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    data: {
      customers,
      visits,
      questionnaires,
      pureToneTests,
      speechTests,
      haSessions,
      preferences,
    },
  };
};

/**
 * 백업 데이터를 JSON 파일로 다운로드
 */
export const downloadBackup = () => {
  const backup = createBackup();
  const filename = `jinsim-backup-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
  const dataStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return filename;
};

/**
 * 백업 파일을 읽고 검증
 */
export const validateBackupFile = (fileContent: string): { valid: boolean; error?: string; data?: BackupData } => {
  try {
    const backup = JSON.parse(fileContent) as BackupData;

    // 필수 필드 검증
    if (!backup.version || !backup.timestamp || !backup.data) {
      return { valid: false, error: '올바른 백업 파일 형식이 아닙니다.' };
    }

    if (!backup.data.customers || !backup.data.visits) {
      return { valid: false, error: '백업 파일에 필수 데이터가 없습니다.' };
    }

    return { valid: true, data: backup };
  } catch (error) {
    return { valid: false, error: 'JSON 파일을 읽을 수 없습니다.' };
  }
};

/**
 * 백업 데이터를 localStorage에 복원 (기존 데이터 덮어쓰기)
 */
export const restoreBackup = (backup: BackupData, mergeMode: 'replace' | 'merge' = 'replace'): { success: boolean; error?: string } => {
  try {
    if (mergeMode === 'replace') {
      // 기존 데이터 모두 삭제
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key === 'jinsim_customers' ||
          key === 'jinsim_visits' ||
          key.startsWith('q_') ||
          key.startsWith('pta_') ||
          key.startsWith('speech_') ||
          key.startsWith('hasession_')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }

    // 고객 데이터 복원
    if (backup.data.customers.length > 0) {
      if (mergeMode === 'merge') {
        const existing = JSON.parse(localStorage.getItem('jinsim_customers') || '[]');
        const merged = [...existing];
        backup.data.customers.forEach(newCustomer => {
          const existingIndex = merged.findIndex(c => c.id === newCustomer.id);
          if (existingIndex >= 0) {
            merged[existingIndex] = newCustomer;
          } else {
            merged.push(newCustomer);
          }
        });
        localStorage.setItem('jinsim_customers', JSON.stringify(merged));
      } else {
        localStorage.setItem('jinsim_customers', JSON.stringify(backup.data.customers));
      }
    }

    // 방문 데이터 복원
    if (backup.data.visits.length > 0) {
      if (mergeMode === 'merge') {
        const existing = JSON.parse(localStorage.getItem('jinsim_visits') || '[]');
        const merged = [...existing];
        backup.data.visits.forEach(newVisit => {
          const existingIndex = merged.findIndex(v => v.id === newVisit.id);
          if (existingIndex >= 0) {
            merged[existingIndex] = newVisit;
          } else {
            merged.push(newVisit);
          }
        });
        localStorage.setItem('jinsim_visits', JSON.stringify(merged));
      } else {
        localStorage.setItem('jinsim_visits', JSON.stringify(backup.data.visits));
      }
    }

    // 설문지 데이터 복원
    Object.entries(backup.data.questionnaires).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });

    // 순음검사 데이터 복원
    Object.entries(backup.data.pureToneTests).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });

    // 어음검사 데이터 복원
    Object.entries(backup.data.speechTests).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });

    // HA 세션 데이터 복원
    Object.entries(backup.data.haSessions).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });

    // 환경설정 복원
    Object.entries(backup.data.preferences).forEach(([key, value]) => {
      localStorage.setItem(key, value as string);
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: `복원 중 오류 발생: ${error}` };
  }
};

/**
 * 백업 데이터의 통계 정보 추출
 */
export const getBackupStats = (backup: BackupData) => {
  return {
    version: backup.version,
    timestamp: backup.timestamp,
    customerCount: backup.data.customers.length,
    visitCount: backup.data.visits.length,
    questionnaireCount: Object.keys(backup.data.questionnaires).length,
    pureToneTestCount: Object.keys(backup.data.pureToneTests).length,
    speechTestCount: Object.keys(backup.data.speechTests).length,
    haSessionCount: Object.keys(backup.data.haSessions).length,
  };
};

/**
 * 마지막 백업 시간 저장/조회
 */
export const saveLastBackupTime = () => {
  localStorage.setItem('jinsim_last_backup', new Date().toISOString());
};

export const getLastBackupTime = (): Date | null => {
  const lastBackup = localStorage.getItem('jinsim_last_backup');
  return lastBackup ? new Date(lastBackup) : null;
};

/**
 * 백업 필요 여부 체크 (7일 이상 경과)
 */
export const shouldRemindBackup = (): boolean => {
  const lastBackup = getLastBackupTime();
  if (!lastBackup) return true;

  const daysSinceBackup = (Date.now() - lastBackup.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceBackup >= 7;
};
