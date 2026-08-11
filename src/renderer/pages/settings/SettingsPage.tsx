import { FolderInput } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/features/i18n/useT";
import { importStore } from "@/features/import/importStore";
import { formatTime } from "@/libs/formatTime";
import { useSettingsPage } from "./useSettingsPage";

/**
 * Settings route (`/settings`)
 * (`docs/specs/v1.0/architecture/process-model.md`): theme, language, and
 * the library section (stats + import entrance).
 */
export const SettingsPage = () => {
  const t = useT();
  const { settings, statsState, setTheme, setLocale } = useSettingsPage();

  return (
    <section className="max-w-2xl p-6">
      <h1 className="font-semibold text-lg">{t("settings.title")}</h1>

      <SettingsSection label={t("settings.appearance")}>
        <SettingsRow label={t("settings.theme")}>
          <Select
            value={settings.theme ?? "system"}
            items={{
              system: t("settings.theme.system"),
              light: t("settings.theme.light"),
              dark: t("settings.theme.dark"),
            }}
            onValueChange={setTheme}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["system", "light", "dark"] as const).map((theme) => (
                <SelectItem key={theme} value={theme}>
                  {t(`settings.theme.${theme}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow label={t("settings.language")}>
          <Select
            value={settings.locale ?? "system"}
            // Language names are intentionally not translated — each locale
            // is shown in its own language so it stays recognisable.
            items={{
              system: t("settings.language.system"),
              en: "English",
              ja: "日本語",
            }}
            onValueChange={setLocale}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">
                {t("settings.language.system")}
              </SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ja">日本語</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection label={t("settings.library")}>
        {statsState.status === "error" && (
          <p className="break-all text-destructive text-sm">
            {t("library.loadFailed", { message: statsState.error.message })}
          </p>
        )}
        {statsState.status === "success" && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
            <StatRow
              label={t("settings.stats.musics")}
              value={String(statsState.value.musicCount)}
            />
            <StatRow
              label={t("settings.stats.artists")}
              value={String(statsState.value.artistCount)}
            />
            <StatRow
              label={t("settings.stats.albums")}
              value={String(statsState.value.albumCount)}
            />
            <StatRow
              label={t("settings.stats.duration")}
              value={formatTime(statsState.value.totalDurationMs / 1000)}
            />
          </dl>
        )}
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void importStore.openFromDialog()}
          >
            <FolderInput /> {t("sidebar.import")}
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          {t("settings.library.removeHint")}
        </p>
      </SettingsSection>
    </section>
  );
};

/** One titled settings block. */
const SettingsSection = ({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) => (
  <div className="mt-6">
    <h2 className="border-b pb-1 font-medium text-muted-foreground text-sm">
      {label}
    </h2>
    <div className="flex flex-col gap-3 pt-3">{children}</div>
  </div>
);

/** Label + control pair. */
const SettingsRow = ({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-sm">{label}</span>
    {children}
  </div>
);

/** One statistics line of the library section. */
const StatRow = ({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) => (
  <>
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="tabular-nums">{value}</dd>
  </>
);
