'use client';

import { type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import api from '@/lib/api';
import { cn } from '@/lib/cn';
import { type Locale } from '@/lib/i18n';
import { useAuthStore } from '@/store/useAuthStore';
import { useLocaleStore } from '@/store/useLocaleStore';
import {
  type ControlAction,
  type KeyBinding,
  DISPLAY_MODES,
  MATCHMAKING_REGIONS,
  QUALITY_PRESETS,
  formatKeyBinding,
  useSettingsStore,
} from '@/store/useSettingsStore';

type SettingsTab = 'general' | 'graphics' | 'audio' | 'controls' | 'account' | 'about';

const tabs: { id: SettingsTab; label: string; icon: ReactNode }[] = [
  {
    id: 'general',
    label: 'General',
    icon: <img src="/assets/icons/settings/general.png" alt="General" className="h-11 w-11 object-contain object-center mt-1" />,
  },
  {
    id: 'graphics',
    label: 'Graphics',
    icon: <img src="/assets/icons/settings/graphic.png" alt="Graphics" className="h-11 w-11 object-contain object-center mt-1" />,
  },
  {
    id: 'audio',
    label: 'Audio',
    icon: <img src="/assets/icons/settings/audio.png" alt="Audio" className="h-11 w-11 object-contain object-center mt-1" />,
  },
  {
    id: 'controls',
    label: 'Controls',
    icon: <img src="/assets/icons/settings/controls.png" alt="Controls" className="h-11 w-11 object-contain object-center mt-1" />,
  },
  {
    id: 'account',
    label: 'Account',
    icon: <img src="/assets/icons/settings/profile.png" alt="Account" className="h-11 w-11 object-contain object-center mt-1" />,
  },
  {
    id: 'about',
    label: 'About',
    icon: <img src="/assets/icons/settings/info.png" alt="About" className="h-11 w-11 object-contain object-center mt-1" />,
  },
];

const defaults = {
  locale: 'en' as Locale,
  region: 'Europe',
  displayMode: 'Borderless',
  quality: 'High',
  brightness: 50,
  contrast: 50,
  vsync: true,
  motionBlur: false,
  masterVolume: 75,
  musicVolume: 60,
  sfxVolume: 80,
  crowdVolume: 70,
  commentatorVolume: 45,
  voiceChat: true,
  muteWhenUnfocused: false,
  showNames: true,
  aimAssist: false,
  inputDevice: 'Keyboard',
  twoFactor: false,
  privateProfile: false,
  matchInvites: true,
};

const settingsText = {
  en: {
    settings: 'Settings',
    tabs: {
      general: 'General',
      graphics: 'Graphics',
      audio: 'Audio',
      controls: 'Controls',
      account: 'Account',
      about: 'About',
    },
    sections: {
      language: 'Language',
      gameplay: 'Gameplay',
      display: 'Display',
      visualQuality: 'Visual Quality',
      volume: 'Volume',
      voice: 'Voice',
      input: 'Input',
      profile: 'Profile',
      game: 'Game',
      support: 'Support',
    },
    rows: {
      language: 'Language',
      region: 'Region',
      units: 'Units',
      cameraShake: 'Camera Shake',
      showNames: 'Show Player Names',
      aimAssist: 'Aim Assist',
      displayMode: 'Display Mode',
      quality: 'Quality Preset',
      brightness: 'Brightness',
      contrast: 'Contrast',
      vsync: 'V-Sync',
      motionBlur: 'Motion Blur',
      masterVolume: 'Master Volume',
      musicVolume: 'Music Volume',
      sfxVolume: 'SFX Volume',
      crowdVolume: 'Crowd Volume',
      commentatorVolume: 'Commentator Volume',
      voiceChat: 'Voice Chat',
      muteWhenUnfocused: 'Mute When Unfocused',
      inputDevice: 'Input Device',
      moveUp: 'Move Up',
      moveDown: 'Move Down',
      moveLeft: 'Move Left',
      moveRight: 'Move Right',
      sprint: 'Sprint',
      pass: 'Pass',
      shoot: 'Shoot',
      dash: 'Dash',
      twoFactor: 'Two-Factor Login',
      privateProfile: 'Private Profile',
      matchInvites: 'Match Invites',
      signOut: 'Sign Out',
      version: 'Version',
      server: 'Server',
      buildChannel: 'Build Channel',
      diagnostics: 'Diagnostics',
    },
    hints: {
      language: 'Controls menu labels and lobby text.',
      region: 'Used for matchmaking preferences.',
      units: 'Distance and speed formatting.',
      aimAssist: 'Small help for controller shots.',
    },
    options: {
      en: 'English',
      uk: 'Ukrainian',
      Europe: 'Europe',
      'North America': 'North America',
      'South America': 'South America',
      Asia: 'Asia',
      Metric: 'Metric',
      Imperial: 'Imperial',
      Fullscreen: 'Fullscreen',
      Borderless: 'Borderless',
      Windowed: 'Windowed',
      Unlimited: 'Unlimited',
      Low: 'Low',
      Medium: 'Medium',
      High: 'High',
      Ultra: 'Ultra',
      Keyboard: 'Keyboard',
      Controller: 'Controller',
      Live: 'Live',
      Preview: 'Preview',
      Space: 'Space',
      Shift: 'Shift',
      'Mouse 1': 'Mouse 1',
    },
    buttons: {
      logout: 'Logout',
      exportReport: 'Export Report',
      exportingReport: 'Exporting...',
      reset: 'Reset to Default',
      cancel: 'Cancel',
      save: 'Save Changes',
    },
    messages: {
      localChanges: 'Changes are kept locally in this session.',
      saved: 'Saved',
      reportReady: 'Report ready',
      reportFailed: 'Report failed',
      gateway: 'Gateway',
      signedIn: 'Signed in',
      player: 'Player',
    },
  },
  uk: {
    settings: 'Налаштування',
    tabs: {
      general: 'Загальні',
      graphics: 'Графіка',
      audio: 'Аудіо',
      controls: 'Керування',
      account: 'Акаунт',
      about: 'Про гру',
    },
    sections: {
      language: 'Мова',
      gameplay: 'Ігровий процес',
      display: 'Екран',
      visualQuality: 'Якість зображення',
      volume: 'Гучність',
      voice: 'Голос',
      input: 'Ввід',
      profile: 'Профіль',
      game: 'Гра',
      support: 'Підтримка',
    },
    rows: {
      language: 'Мова',
      region: 'Регіон',
      units: 'Одиниці виміру',
      cameraShake: 'Тряска камери',
      showNames: 'Показувати імена гравців',
      aimAssist: 'Допомога прицілювання',
      displayMode: 'Режим екрана',
      quality: 'Пресет якості',
      brightness: 'Яскравість',
      contrast: 'Контраст',
      vsync: 'V-Sync',
      motionBlur: 'Розмиття руху',
      masterVolume: 'Загальна гучність',
      musicVolume: 'Гучність музики',
      sfxVolume: 'Гучність ефектів',
      crowdVolume: 'Гучність трибун',
      commentatorVolume: 'Гучність коментатора',
      voiceChat: 'Голосовий чат',
      muteWhenUnfocused: 'Вимикати звук без фокуса',
      inputDevice: 'Пристрій вводу',
      moveUp: 'Рух вгору',
      moveDown: 'Рух вниз',
      moveLeft: 'Рух вліво',
      moveRight: 'Рух вправо',
      sprint: 'Спринт',
      pass: 'Пас',
      shoot: 'Удар',
      dash: 'Ривок',
      twoFactor: 'Двофакторний вхід',
      privateProfile: 'Приватний профіль',
      matchInvites: 'Запрошення в матч',
      signOut: 'Вийти з акаунта',
      version: 'Версія',
      server: 'Сервер',
      buildChannel: 'Канал збірки',
      diagnostics: 'Діагностика',
    },
    hints: {
      language: 'Керує мовою меню та текстів у лобі.',
      region: 'Використовується для підбору матчів.',
      units: 'Формат дистанції та швидкості.',
      aimAssist: 'Невелика допомога для ударів з контролера.',
    },
    options: {
      en: 'English',
      uk: 'Українська',
      Europe: 'Європа',
      'North America': 'Північна Америка',
      'South America': 'Південна Америка',
      Asia: 'Азія',
      Metric: 'Метрична',
      Imperial: 'Імперська',
      Fullscreen: 'На весь екран',
      Borderless: 'Без рамки',
      Windowed: 'У вікні',
      Unlimited: 'Без обмеження',
      Low: 'Низька',
      Medium: 'Середня',
      High: 'Висока',
      Ultra: 'Ультра',
      Keyboard: 'Клавіатура',
      Controller: 'Контролер',
      Live: 'Основний',
      Preview: 'Тестовий',
      Space: 'Пробіл',
      Shift: 'Shift',
      'Mouse 1': 'Миша 1',
    },
    buttons: {
      logout: 'Вийти',
      exportReport: 'Експортувати звіт',
      exportingReport: 'Експорт...',
      reset: 'Скинути до стандартних',
      cancel: 'Скасувати',
      save: 'Зберегти',
    },
    messages: {
      localChanges: 'Зміни зберігаються локально в цій сесії.',
      saved: 'Збережено',
      reportReady: 'Звіт готовий',
      reportFailed: 'Помилка звіту',
      gateway: 'шлюз',
      signedIn: 'Вхід виконано',
      player: 'Гравець',
    },
  },
} as const;

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid min-h-11 items-center gap-4 md:grid-cols-[minmax(180px,1fr)_minmax(260px,360px)]">
      <div>
        <p className="text-[15px] font-semibold leading-tight text-white/82">{label}</p>
        {hint && <p className="mt-1 text-[12px] leading-tight text-white/38">{hint}</p>}
      </div>
      <div className="flex justify-end">{children}</div>
    </div>
  );
}

function SelectField({
  value,
  onChange,
  options,
  labels,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full rounded-md border border-white/10 bg-[#111b20] px-4 pr-10 text-[14px] font-semibold text-white/82 outline-none appearance-none transition hover:border-white/18 focus:border-[#00d69f]/70"
    >
      {options.map((option) => (
        <option key={option} value={option} className="bg-[#111b20] text-white">
          {labels?.[option] ?? option}
        </option>
      ))}
    </select>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'ml-auto flex h-[26px] w-12 items-center rounded-full border p-0.5 transition',
        checked
          ? 'border-[#10d8a0] bg-[#10d8a0] shadow-[0_0_16px_rgba(16,216,160,0.45)]'
          : 'border-white/40 bg-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]'
      )}
      aria-pressed={checked}
    >
      <span
        className={cn(
          'h-5 w-5 rounded-full transition',
          checked
            ? 'translate-x-[20px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.35)]'
            : 'translate-x-0 bg-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.2)]'
        )}
      />
    </button>
  );
}

function Slider({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="grid w-full grid-cols-[1fr_48px] items-center gap-5">
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="settings-range"
        style={{ '--range-value': `${value}%` } as CSSProperties}
      />
      <span className="text-right text-[15px] font-semibold tabular-nums text-white/72">{value}%</span>
    </div>
  );
}

function KeyButton({
  action,
  value,
  onChange,
}: {
  action: ControlAction;
  value: KeyBinding;
  onChange: (action: ControlAction, binding: KeyBinding) => void;
}) {
  const [listening, setListening] = useState(false);
  const captureKey = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (!listening) return;

    event.preventDefault();
    event.stopPropagation();

    if (event.key === 'Escape') {
      setListening(false);
      return;
    }

    onChange(action, {
      code: event.code,
      key: event.key,
      keyCode: event.keyCode,
    });
    setListening(false);
  };

  return (
    <button
      type="button"
      onClick={() => setListening(true)}
      onBlur={() => setListening(false)}
      onKeyDown={captureKey}
      className={cn(
        'h-9 min-w-[118px] rounded-md border px-4 text-[13px] font-bold transition',
        listening
          ? 'border-[#00d69f]/80 bg-[#06392f] text-white shadow-[0_0_16px_rgba(0,214,159,0.22)]'
          : 'border-white/10 bg-[#111b20] text-white/82 hover:border-[#00d69f]/60 hover:text-white'
      )}
    >
      {listening ? 'Press key...' : formatKeyBinding(value)}
    </button>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-white/10 py-5 first:border-t-0 first:pt-0">
      <h2 className="mb-5 text-[15px] font-extrabold uppercase tracking-[0.04em] text-[#00d69f]">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const { ready } = useRequireAuth();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const region = useSettingsStore((state) => state.region);
  const setRegion = useSettingsStore((state) => state.setRegion);
  const displayMode = useSettingsStore((state) => state.displayMode);
  const setStoredDisplayMode = useSettingsStore((state) => state.setDisplayMode);
  const syncFullscreenExit = useSettingsStore((state) => state.syncFullscreenExit);
  const quality = useSettingsStore((state) => state.quality);
  const setQuality = useSettingsStore((state) => state.setQuality);
  const brightness = useSettingsStore((state) => state.brightness);
  const setBrightness = useSettingsStore((state) => state.setBrightness);
  const contrast = useSettingsStore((state) => state.contrast);
  const setContrast = useSettingsStore((state) => state.setContrast);
  const vsync = useSettingsStore((state) => state.vsync);
  const setVsync = useSettingsStore((state) => state.setVsync);
  const motionBlur = useSettingsStore((state) => state.motionBlur);
  const setMotionBlur = useSettingsStore((state) => state.setMotionBlur);
  const controls = useSettingsStore((state) => state.controls);
  const setControlBinding = useSettingsStore((state) => state.setControlBinding);
  const resetControlBindings = useSettingsStore((state) => state.resetControlBindings);
  const [masterVolume, setMasterVolume] = useState(defaults.masterVolume);
  const [musicVolume, setMusicVolume] = useState(defaults.musicVolume);
  const [sfxVolume, setSfxVolume] = useState(defaults.sfxVolume);
  const [crowdVolume, setCrowdVolume] = useState(defaults.crowdVolume);
  const [commentatorVolume, setCommentatorVolume] = useState(defaults.commentatorVolume);
  const [voiceChat, setVoiceChat] = useState(defaults.voiceChat);
  const [muteWhenUnfocused, setMuteWhenUnfocused] = useState(defaults.muteWhenUnfocused);
  const [showNames, setShowNames] = useState(defaults.showNames);
  const [aimAssist, setAimAssist] = useState(defaults.aimAssist);
  const [inputDevice, setInputDevice] = useState(defaults.inputDevice);
  const [twoFactor, setTwoFactor] = useState(defaults.twoFactor);
  const [privateProfile, setPrivateProfile] = useState(defaults.privateProfile);
  const [matchInvites, setMatchInvites] = useState(defaults.matchInvites);
  const [buildChannel, setBuildChannel] = useState('Live');
  const [reportStatus, setReportStatus] = useState('');
  const [exportingReport, setExportingReport] = useState(false);
  const [savedAt, setSavedAt] = useState('');

  const t = settingsText[locale];
  const tabLabels = t.tabs;
  const optionLabels = t.options as Record<string, string>;
  const changeLanguage = (value: string) => {
    const nextLocale = value === 'uk' ? 'uk' : 'en';
    setLocale(nextLocale);
    window.localStorage.setItem('locale', nextLocale);
  };

  const changeDisplayMode = (value: string) => {
    setStoredDisplayMode(value);

    if (typeof document === 'undefined') return;
    if (value === 'Fullscreen') {
      if (!document.documentElement.requestFullscreen) {
        syncFullscreenExit();
        return;
      }

      document.documentElement.requestFullscreen().catch(() => {
        syncFullscreenExit();
      });
      return;
    }

    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => undefined);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        syncFullscreenExit();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [syncFullscreenExit]);

  const resetDefaults = () => {
    setLocale(defaults.locale);
    window.localStorage.setItem('locale', defaults.locale);
    setRegion(defaults.region);
    changeDisplayMode(defaults.displayMode);
    setQuality(defaults.quality);
    setBrightness(defaults.brightness);
    setContrast(defaults.contrast);
    setVsync(defaults.vsync);
    setMotionBlur(defaults.motionBlur);
    setMasterVolume(defaults.masterVolume);
    setMusicVolume(defaults.musicVolume);
    setSfxVolume(defaults.sfxVolume);
    setCrowdVolume(defaults.crowdVolume);
    setCommentatorVolume(defaults.commentatorVolume);
    setVoiceChat(defaults.voiceChat);
    setMuteWhenUnfocused(defaults.muteWhenUnfocused);
    setShowNames(defaults.showNames);
    setAimAssist(defaults.aimAssist);
    setInputDevice(defaults.inputDevice);
    resetControlBindings();
    setTwoFactor(defaults.twoFactor);
    setPrivateProfile(defaults.privateProfile);
    setMatchInvites(defaults.matchInvites);
    setBuildChannel('Live');
    setReportStatus('');
    setSavedAt('');
  };

  const exportDiagnosticsReport = async () => {
    setExportingReport(true);
    setReportStatus('');

    const startedAt = new Date();
    let backendHealth: unknown = null;

    try {
      const response = await api.get('/api/health');
      backendHealth = response.data;
    } catch (error) {
      backendHealth = {
        status: 'unreachable',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    const authState = useAuthStore.getState();
    const settingsState = useSettingsStore.getState();
    const storageKeys = Object.keys(window.localStorage).sort();
    const report = {
      report: {
        name: 'Megabol diagnostics',
        generatedAt: startedAt.toISOString(),
        pageUrl: window.location.href,
        build: {
          version: '0.1.0 Beta',
          channel: buildChannel,
          apiUrl: api.defaults.baseURL,
        },
      },
      browser: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        languages: navigator.languages,
        online: navigator.onLine,
        cookieEnabled: navigator.cookieEnabled,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: 'deviceMemory' in navigator ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory : undefined,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio,
        },
        screen: {
          width: window.screen.width,
          height: window.screen.height,
          colorDepth: window.screen.colorDepth,
        },
      },
      user: authState.user
        ? {
            id: authState.user.id,
            username: authState.user.username,
            nickname: authState.user.nickname,
            email: authState.user.email,
            mmr: authState.user.mmr,
            level: authState.user.level,
          }
        : null,
      auth: {
        hasAccessToken: Boolean(authState.accessToken),
        hasRefreshToken: Boolean(authState.refreshToken),
        hasHydrated: authState.hasHydrated,
      },
      settings: {
        locale,
        region: settingsState.region,
        displayMode: settingsState.displayMode,
        quality: settingsState.quality,
        brightness: settingsState.brightness,
        contrast: settingsState.contrast,
        vsync: settingsState.vsync,
        motionBlur: settingsState.motionBlur,
        controls: settingsState.controls,
        audio: {
          masterVolume,
          musicVolume,
          sfxVolume,
          crowdVolume,
          commentatorVolume,
          voiceChat,
          muteWhenUnfocused,
        },
        gameplay: {
          showNames,
          aimAssist,
        },
        account: {
          twoFactor,
          privateProfile,
          matchInvites,
        },
      },
      backend: {
        health: backendHealth,
      },
      storage: {
        keys: storageKeys,
        sizes: storageKeys.map((key) => ({
          key,
          bytes: window.localStorage.getItem(key)?.length ?? 0,
        })),
      },
    };

    try {
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = startedAt.toISOString().replace(/[:.]/g, '-');

      link.href = url;
      link.download = `megabol-diagnostics-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setReportStatus('ready');
    } catch {
      setReportStatus('failed');
    } finally {
      setExportingReport(false);
    }
  };

  if (!ready) return null;

  return (
    <main className="lobby-bg relative min-h-screen overflow-hidden font-sans">
      <AppHeader active="settings" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 pb-7 pt-[92px]">
        <div className="flex h-[min(78vh,790px)] w-full max-w-[1320px] overflow-hidden rounded-lg border border-[#2b4250] bg-[#020b0f]/88 shadow-[0_24px_90px_rgba(0,0,0,0.55)] backdrop-blur-md">
          <aside className="hidden w-[270px] shrink-0 border-r border-white/10 bg-[#02090d]/54 px-7 py-8 md:flex md:flex-col md:justify-between">
            <div>
              <h1 className="mb-9 whitespace-nowrap text-[24px] font-extrabold uppercase tracking-[0.035em] text-white drop-shadow-[0_0_12px_rgba(210,255,244,0.72)]">
                {t.settings}
              </h1>

              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'relative flex h-14 w-full items-center gap-3 border-t border-white/10 px-1 text-left text-[15px] font-bold uppercase text-white/68 transition last:border-b hover:text-white',
                    activeTab === tab.id && 'border-transparent bg-[#06271f] px-4 text-[#00d69f]'
                  )}
                >
                  {activeTab === tab.id && <span className="absolute left-0 top-0 h-full w-1 bg-[#00d69f]" />}
                  {tab.id === 'about' || tab.id === 'account' || tab.id === 'controls' || tab.id === 'audio' || tab.id === 'graphics' || tab.id === 'general' ? (
                    <span className="relative flex h-14 w-14 items-center justify-center overflow-hidden text-white/80">
                      {tab.icon}
                    </span>
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded border border-white/10 text-[12px] leading-none">
                      {tab.icon}
                    </span>
                  )}
                  <span>{tabLabels[tab.id]}</span>
                </button>
              ))}
            </nav>
            </div>
            <div className="mt-6 hidden md:block">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetDefaults}
                className="h-10 w-full rounded-md border-white/10 bg-white/[0.06] px-6 font-sans text-[13px] font-bold uppercase text-white/70 hover:border-white/20 hover:bg-white/[0.09] hover:shadow-none"
              >
                {t.buttons.reset}
              </Button>
            </div>
          </aside>

          <section className="flex min-w-0 flex-1 flex-col">
            <div className="border-b border-white/8 px-6 py-4 md:hidden">
              <SelectField
                value={activeTab}
                onChange={(value) => setActiveTab(value as SettingsTab)}
                options={tabs.map((tab) => tab.id)}
                labels={tabLabels}
              />
            </div>

            <div className="settings-scroll min-h-0 flex-1 overflow-y-auto px-6 py-8 md:px-10 lg:px-11">
              {activeTab === 'general' && (
                <>
                  <Section title={t.sections.language}>
                    <Row label={t.rows.language} hint={t.hints.language}>
                      <SelectField value={locale} onChange={changeLanguage} options={['en', 'uk']} labels={optionLabels} />
                    </Row>
                    <Row label={t.rows.region} hint={t.hints.region}>
                      <SelectField value={region} onChange={setRegion} options={[...MATCHMAKING_REGIONS]} labels={optionLabels} />
                    </Row>
                  </Section>

                  <Section title={t.sections.gameplay}>
                    <Row label={t.rows.showNames}>
                      <Toggle checked={showNames} onChange={setShowNames} />
                    </Row>
                    <Row label={t.rows.aimAssist} hint={t.hints.aimAssist}>
                      <Toggle checked={aimAssist} onChange={setAimAssist} />
                    </Row>
                  </Section>
                </>
              )}

              {activeTab === 'graphics' && (
                <>
                  <Section title={t.sections.display}>
                    <Row label={t.rows.displayMode}>
                      <SelectField value={displayMode} onChange={changeDisplayMode} options={[...DISPLAY_MODES]} labels={optionLabels} />
                    </Row>
                  </Section>

                  <Section title={t.sections.visualQuality}>
                    <Row label={t.rows.quality}>
                      <SelectField value={quality} onChange={setQuality} options={[...QUALITY_PRESETS]} labels={optionLabels} />
                    </Row>
                    <Row label={t.rows.brightness}>
                      <Slider value={brightness} onChange={setBrightness} />
                    </Row>
                    <Row label={t.rows.contrast}>
                      <Slider value={contrast} onChange={setContrast} />
                    </Row>
                    <Row label={t.rows.vsync}>
                      <Toggle checked={vsync} onChange={setVsync} />
                    </Row>
                    <Row label={t.rows.motionBlur}>
                      <Toggle checked={motionBlur} onChange={setMotionBlur} />
                    </Row>
                  </Section>
                </>
              )}

              {activeTab === 'audio' && (
                <>
                  <Section title={t.sections.volume}>
                    <Row label={t.rows.masterVolume}>
                      <Slider value={masterVolume} onChange={setMasterVolume} />
                    </Row>
                    <Row label={t.rows.musicVolume}>
                      <Slider value={musicVolume} onChange={setMusicVolume} />
                    </Row>
                    <Row label={t.rows.sfxVolume}>
                      <Slider value={sfxVolume} onChange={setSfxVolume} />
                    </Row>
                    <Row label={t.rows.crowdVolume}>
                      <Slider value={crowdVolume} onChange={setCrowdVolume} />
                    </Row>
                    <Row label={t.rows.commentatorVolume}>
                      <Slider value={commentatorVolume} onChange={setCommentatorVolume} />
                    </Row>
                  </Section>

                  <Section title={t.sections.voice}>
                    <Row label={t.rows.voiceChat}>
                      <Toggle checked={voiceChat} onChange={setVoiceChat} />
                    </Row>
                    <Row label={t.rows.muteWhenUnfocused}>
                      <Toggle checked={muteWhenUnfocused} onChange={setMuteWhenUnfocused} />
                    </Row>
                  </Section>
                </>
              )}

              {activeTab === 'controls' && (
                <>
                  <Section title={t.sections.input}>
                    <Row label={t.rows.inputDevice}>
                      <SelectField value={inputDevice} onChange={setInputDevice} options={['Keyboard', 'Controller']} labels={optionLabels} />
                    </Row>
                    <Row label={t.rows.moveUp}>
                      <KeyButton action="up" value={controls.up} onChange={setControlBinding} />
                    </Row>
                    <Row label={t.rows.moveDown}>
                      <KeyButton action="down" value={controls.down} onChange={setControlBinding} />
                    </Row>
                    <Row label={t.rows.moveLeft}>
                      <KeyButton action="left" value={controls.left} onChange={setControlBinding} />
                    </Row>
                    <Row label={t.rows.moveRight}>
                      <KeyButton action="right" value={controls.right} onChange={setControlBinding} />
                    </Row>
                    <Row label={t.rows.sprint}>
                      <KeyButton action="sprint" value={controls.sprint} onChange={setControlBinding} />
                    </Row>
                    <Row label={t.rows.pass}>
                      <KeyButton action="pass" value={controls.pass} onChange={setControlBinding} />
                    </Row>
                    <Row label={t.rows.shoot}>
                      <KeyButton action="shoot" value={controls.shoot} onChange={setControlBinding} />
                    </Row>
                    <Row label={t.rows.dash}>
                      <KeyButton action="dash" value={controls.dash} onChange={setControlBinding} />
                    </Row>
                  </Section>
                </>
              )}

              {activeTab === 'account' && (
                <>
                  <Section title={t.sections.profile}>
                    <div className="rounded-md border border-white/10 bg-white/[0.035] p-5">
                      <p className="text-[18px] font-bold text-white">{user?.nickname ?? t.messages.player}</p>
                      <p className="mt-1 text-[14px] text-white/48">{user?.email ?? t.messages.signedIn}</p>
                    </div>
                    <Row label={t.rows.twoFactor}>
                      <Toggle checked={twoFactor} onChange={setTwoFactor} />
                    </Row>
                    <Row label={t.rows.privateProfile}>
                      <Toggle checked={privateProfile} onChange={setPrivateProfile} />
                    </Row>
                    <Row label={t.rows.matchInvites}>
                      <Toggle checked={matchInvites} onChange={setMatchInvites} />
                    </Row>
                    <Row label={t.rows.signOut}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          logout();
                          router.push('/login');
                        }}
                        className="h-10 border-red-400/40 bg-red-500/10 px-5 font-sans text-[13px] font-bold normal-case text-red-200 hover:border-red-300 hover:text-white hover:shadow-none"
                      >
                        {t.buttons.logout}
                      </Button>
                    </Row>
                  </Section>
                </>
              )}

              {activeTab === 'about' && (
                <>
                  <Section title={t.sections.game}>
                    <Row label={t.rows.version}>
                      <span className="text-[15px] font-semibold text-white/78">0.1.0 Beta</span>
                    </Row>
                    <Row label={t.rows.server}>
                      <span className="text-[15px] font-semibold text-white/78">
                        {optionLabels[region] ?? region} {t.messages.gateway}
                      </span>
                    </Row>
                    <Row label={t.rows.buildChannel}>
                      <SelectField value={buildChannel} onChange={setBuildChannel} options={['Live', 'Preview']} labels={optionLabels} />
                    </Row>
                  </Section>
                  <Section title={t.sections.support}>
                    <Row label={t.rows.diagnostics}>
                      <div className="flex items-center gap-3">
                        {reportStatus && (
                          <span className={cn('text-[13px] font-semibold', reportStatus === 'failed' ? 'text-red-300' : 'text-[#00d69f]')}>
                            {reportStatus === 'failed' ? t.messages.reportFailed : t.messages.reportReady}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={exportDiagnosticsReport}
                          disabled={exportingReport}
                          className="h-10 rounded-md border-white/10 bg-[#111b20] px-5 font-sans text-[13px] font-bold normal-case text-white/72 hover:border-white/20 hover:shadow-none"
                        >
                          {exportingReport ? t.buttons.exportingReport : t.buttons.exportReport}
                        </Button>
                      </div>
                    </Row>
                  </Section>
                </>
              )}
            </div>

            <div className="flex h-[88px] items-center justify-between gap-4 border-t border-white/10 bg-[#02090d]/70 px-6 md:px-9">
              <div className="min-w-0 text-[12px] text-white/42">
                {savedAt ? `${t.messages.saved} ${savedAt}` : t.messages.localChanges}
              </div>
              <div className="flex shrink-0 gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/')}
                  className="h-10 rounded-md border-white/10 bg-white/[0.06] px-7 font-sans text-[13px] font-bold uppercase text-white/70 hover:border-white/20 hover:bg-white/[0.09] hover:shadow-none"
                >
                  {t.buttons.cancel}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}
                  className="h-10 rounded-md border border-[#0fd398]/55 !bg-[linear-gradient(180deg,#11d4a4_0%,#08b47c_52%,#009160_100%)] px-7 font-sans text-[13px] font-bold uppercase !text-white shadow-[0_0_18px_rgba(5,185,126,0.46),inset_0_1px_0_rgba(255,255,255,0.22),0_10px_24px_rgba(0,0,0,0.18)] transition hover:border-[#42f3bd]/70 hover:!bg-[linear-gradient(180deg,#20e2b2_0%,#0bc285_52%,#009b68_100%)] hover:shadow-[0_0_26px_rgba(5,185,126,0.62),inset_0_1px_0_rgba(255,255,255,0.28),0_12px_34px_rgba(0,0,0,0.22)] hover:brightness-105"
                >
                  {t.buttons.save}
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
